import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DOFUSDB_API = 'https://api.dofusdb.fr';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const ingredientIds: number[] = body.ingredientIds;

	if (!ingredientIds || ingredientIds.length === 0) {
		throw error(400, 'Au moins un ingrédient requis');
	}

	// Chercher les recettes contenant le premier ingrédient (le moins courant = dernier ajouté)
	const firstId = ingredientIds[ingredientIds.length - 1];
	const res = await fetch(
		`${DOFUSDB_API}/recipes?ingredientIds=${firstId}&lang=fr&$limit=50`
	);

	if (!res.ok) {
		throw error(502, 'Erreur lors de la recherche sur DofusDB');
	}

	const data = await res.json();

	if (!data.data || data.data.length === 0) {
		return json({ recipes: [] });
	}

	// Filtrer côté serveur : ne garder que les recettes contenant TOUS les ingrédients
	const matching = data.data
		.filter((recipe: any) => {
			return ingredientIds.every((id) => recipe.ingredientIds.includes(id));
		})
		.map((recipe: any) => {
			const ingredients = recipe.ingredientIds.map((id: number, index: number) => {
				const ing = recipe.ingredients.find((i: any) => i.id === id);
				return {
					id,
					name: ing?.name?.fr ?? 'Inconnu',
					img: ing?.img ?? null,
					quantity: recipe.quantities[index],
					type: ing?.type?.name?.fr ?? null
				};
			});

			return {
				resultId: recipe.resultId,
				resultName: recipe.resultName?.fr ?? 'Inconnu',
				resultImg: recipe.result?.img ?? null,
				resultLevel: recipe.resultLevel,
				job: recipe.job?.name?.fr ?? null,
				ingredients
			};
		});

	return json({ recipes: matching });
};
