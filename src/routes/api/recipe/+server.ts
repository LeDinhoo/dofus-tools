import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DOFUSDB_API = 'https://api.dofusdb.fr';

interface DofusDBItem {
	id: number;
	name: { fr: string };
	slug: { fr: string };
	img: string;
	hasRecipe: boolean;
	type?: { name: { fr: string } };
}

interface RecipeIngredient {
	id: number;
	name: { fr: string };
	slug: { fr: string };
	img: string;
	type?: { name: { fr: string } };
}

interface DofusDBRecipe {
	resultId: number;
	resultName: { fr: string };
	ingredientIds: number[];
	quantities: number[];
	ingredients: RecipeIngredient[];
	job?: { name: { fr: string } };
}

export const GET: RequestHandler = async ({ url }) => {
	const itemName = url.searchParams.get('name');

	if (!itemName || itemName.trim().length < 2) {
		throw error(400, 'Le paramètre "name" est requis (min 2 caractères)');
	}

	// 1. Chercher l'item par nom
	const itemRes = await fetch(
		`${DOFUSDB_API}/items?lang=fr&slug.fr[$search]=${encodeURIComponent(itemName.trim())}&$limit=1`
	);

	if (!itemRes.ok) {
		throw error(502, "Erreur lors de la recherche de l'item sur DofusDB");
	}

	const itemData = await itemRes.json();

	if (!itemData.data || itemData.data.length === 0) {
		throw error(404, `Aucun item trouvé pour "${itemName}"`);
	}

	const item: DofusDBItem = itemData.data[0];

	if (!item.hasRecipe) {
		return json({
			item: {
				id: item.id,
				name: item.name.fr,
				img: item.img
			},
			hasRecipe: false,
			recipe: null,
			message: `"${item.name.fr}" n'a pas de recette`
		});
	}

	// 2. Récupérer la recette
	const recipeRes = await fetch(
		`${DOFUSDB_API}/recipes?resultId=${item.id}&lang=fr&$limit=1`
	);

	if (!recipeRes.ok) {
		throw error(502, 'Erreur lors de la récupération de la recette sur DofusDB');
	}

	const recipeData = await recipeRes.json();

	if (!recipeData.data || recipeData.data.length === 0) {
		return json({
			item: {
				id: item.id,
				name: item.name.fr,
				img: item.img
			},
			hasRecipe: true,
			recipe: null,
			message: `Recette introuvable pour "${item.name.fr}" malgré hasRecipe=true`
		});
	}

	const recipe: DofusDBRecipe = recipeData.data[0];

	// 3. Formater la réponse
	const ingredients = recipe.ingredientIds.map((id, index) => {
		const ingredient = recipe.ingredients.find((ing) => ing.id === id);
		return {
			id,
			name: ingredient?.name?.fr ?? 'Inconnu',
			img: ingredient?.img ?? null,
			quantity: recipe.quantities[index],
			type: ingredient?.type?.name?.fr ?? null
		};
	});

	return json({
		item: {
			id: item.id,
			name: item.name.fr,
			img: item.img
		},
		hasRecipe: true,
		recipe: {
			job: recipe.job?.name?.fr ?? null,
			ingredients
		}
	});
};
