import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

const DOFUSDB_API = 'https://api.dofusdb.fr';

type PileEntry = { unitPrice: number; remaining: number };

function consumeFromPile(
	pile: Map<string, PileEntry[]>,
	name: string,
	needed: number
): { consumed: number; cost: number } {
	const key = [...pile.keys()].find((k) => k.toLowerCase() === name.toLowerCase());
	if (!key) return { consumed: 0, cost: 0 };
	const entries = pile.get(key)!;
	let consumed = 0;
	let cost = 0;
	while (needed > 0 && entries.length > 0) {
		const batch = entries[0];
		const take = Math.min(needed, batch.remaining);
		cost += take * batch.unitPrice;
		batch.remaining -= take;
		needed -= take;
		consumed += take;
		if (batch.remaining <= 0) entries.shift();
	}
	return { consumed, cost };
}

async function fetchRecipe(name: string) {
	try {
		const itemRes = await fetch(
			`${DOFUSDB_API}/items?lang=fr&slug.fr[$search]=${encodeURIComponent(name)}&$limit=1`
		);
		if (!itemRes.ok) return null;
		const itemData = await itemRes.json();
		if (!itemData.data?.length) return null;

		const item = itemData.data[0];

		const itemMeta = {
			img: item.img ?? null,
			type: item.type?.name?.fr ?? null,
			superType: item.superType?.name?.fr ?? null
		};

		if (!item.hasRecipe) return { ingredients: [], itemMeta };

		const recipeRes = await fetch(
			`${DOFUSDB_API}/recipes?resultId=${item.id}&lang=fr&$limit=1`
		);
		if (!recipeRes.ok) return { ingredients: [], itemMeta };
		const recipeData = await recipeRes.json();
		if (!recipeData.data?.length) return { ingredients: [], itemMeta };

		const recipe = recipeData.data[0];
		return {
			itemMeta,
			ingredients: recipe.ingredientIds.map((id: number, index: number) => {
				const ing = recipe.ingredients.find((i: any) => i.id === id);
				return {
					name: ing?.name?.fr ?? 'Inconnu',
					quantity: recipe.quantities[index]
				};
			})
		};
	} catch (e) {
		console.error(`Erreur fetchRecipe pour "${name}":`, e);
		return null;
	}
}

const BUY_REGEX = /\[[\d:]+\]\s*(\d+)\s*x\s*\[(.+?)\]\s*\(([\d\s.]+)\s*kamas\)/i;
const CRAFT_REGEX = /\[[\d:]+\]\s*Vous avez cr[ée]+\s*(\d+)\s*[×x]\s*\[(.+?)\]\s*!/i;

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const text: string = body.text;

	if (!text || text.trim().length < 5) {
		throw error(400, 'Le champ "text" est requis');
	}

	const lines = text.split('\n');
	const pile = new Map<string, PileEntry[]>();
	const crafts: any[] = [];

	try {
	for (const line of lines) {
		const buyMatch = line.match(BUY_REGEX);
		if (buyMatch) {
			const qty = parseInt(buyMatch[1]);
			const name = buyMatch[2].trim();
			const unitPrice = parseInt(buyMatch[3].replace(/[\s.]/g, ''));
			const entries = pile.get(name) || [];
			entries.push({ unitPrice, remaining: qty });
			pile.set(name, entries);
			continue;
		}

		const craftMatch = line.match(CRAFT_REGEX);
		if (craftMatch) {
			const qty = parseInt(craftMatch[1]);
			const name = craftMatch[2].trim();

			const recipe = await fetchRecipe(name);

			if (!recipe) {
				crafts.push({ name, quantity: qty, ingredients: [], totalCost: 0, itemMeta: null });
				continue;
			}

			let totalCost = 0;
			const ingredients = recipe.ingredients.map((recipeIng: any) => {
				const needed = recipeIng.quantity * qty;
				const { consumed, cost } = consumeFromPile(pile, recipeIng.name, needed);
				totalCost += cost;
				return {
					name: recipeIng.name,
					needed,
					consumed,
					cost,
					inPile: consumed > 0
				};
			});

			crafts.push({ name, quantity: qty, ingredients, totalCost, itemMeta: recipe.itemMeta });
		}
	}

	// Ressources restantes
	const remaining: any[] = [];
	for (const [name, entries] of pile) {
		const qty = entries.reduce((sum, e) => sum + e.remaining, 0);
		if (qty > 0) {
			const totalPrice = entries.reduce((sum, e) => sum + e.remaining * e.unitPrice, 0);
			remaining.push({
				name,
				quantity: qty,
				totalPrice,
				unitPrice: Math.round(totalPrice / qty)
			});
		}
	}

	// Créer les items craftés dans l'HDV automatiquement
	const createdItems: any[] = [];
	for (const craft of crafts) {
		const prixAchatUnitaire = craft.quantity > 0 ? Math.round(craft.totalCost / craft.quantity) : 0;
		for (let i = 0; i < craft.quantity; i++) {
			const created = await prisma.item.create({
				data: {
					nom: craft.name,
					category: 'craft',
					size: 1,
					unit: 1,
					prixAchat: prixAchatUnitaire,
					prixVente: 0,
					benefit: -prixAchatUnitaire,
					statusVente: false,
					imageUrl: craft.itemMeta?.img ?? undefined,
					type: craft.itemMeta?.type ?? undefined,
					superType: craft.itemMeta?.superType ?? undefined
				}
			});
			createdItems.push(created);
		}
	}

	return json({
		crafts,
		totalCost: crafts.reduce((sum: number, c: any) => sum + c.totalCost, 0),
		remaining,
		createdItems
	});
	} catch (e) {
		console.error('Erreur chat-scan:', e);
		throw error(500, 'Erreur interne lors de l\'analyse');
	}
};
