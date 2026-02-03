<script>
	import { Input } from '$lib/components/ui/input/index.js';
	import ItemCard from './ItemCard.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js'; // 1. Importer le Badge
	import X from '@lucide/svelte/icons/x'; // 2. Importer l'icône 'X'

	let { value = $bindable(''), placeholder, selectedItem = $bindable(null) } = $props();

	let searchTerm = $state('');
	let results = $state([]);
	let isLoading = $state(false);

	let query = $derived(searchTerm?.toLowerCase() || '');

	let timeoutId;

	// 3. Fonction pour effacer la sélection
	function clearSelection() {
		selectedItem = null;
		searchTerm = '';
		results = []; // Assure-toi que les résultats sont vidés
	}

	$inspect(selectedItem);

	$effect(() => {
		// --- 4. Logique de sélection (ton code est déjà bon) ---
		// Quand on clique sur un ItemCard, selectedItem est mis à jour.
		// Cet effet s'exécute, voit selectedItem, et arrête la recherche.
		if (selectedItem !== null) {
			// On s'assure que le searchTerm est bien le nom de l'item
			// (Même si l'input est caché, c'est propre pour le bind:value)
			searchTerm = selectedItem.name.fr || selectedItem.slug.fr;
			results = [];
			isLoading = false;
			return; // STOPPE LA RECHERCHE
		}
		// --- Logique de recherche (si selectedItem est null) ---
		if (query.length < 2) {
			results = [];
			isLoading = false;
			return;
		}

		clearTimeout(timeoutId);
		timeoutId = setTimeout(async () => {
			const controller = new AbortController();
			isLoading = true;
			results = [];

			const url = `https://api.dofusdb.fr/items?lang=fr&slug.fr[$search]=${query}&$limit=20&$sort[name]=asc`;

			try {
				const res = await fetch(url, { signal: controller.signal });
				const data = await res.json();

				results = data.data || [];
			} catch (err) {
				if (err.name !== 'AbortError') {
					console.error('Erreur API:', err);
					results = [];
				}
			}

			isLoading = false;
		}, 350);
	});
</script>

<div class="relative w-full sm:w-[280px]">
	{#if selectedItem}
		<div class="flex w-full items-center">
			<Badge variant="outline" class="flex h-9 w-full items-center justify-between px-3">
				<span class="truncate font-medium">
					{selectedItem.name.fr || selectedItem.slug.fr}
				</span>

				<button
					type="button"
					class="ml-2 rounded-full ring-offset-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					onclick={clearSelection}
					aria-label="Effacer la sélection"
				>
					<X class="h-4 w-4 text-muted-foreground hover:text-foreground" />
				</button>
			</Badge>
		</div>
	{:else}
		<Input type="text" {placeholder} bind:value={searchTerm} autocomplete="off" />
	{/if}

	{#if (results.length > 0 || isLoading) && !selectedItem}
		<div class="absolute z-10 mt-1 w-full flex-col rounded-md border bg-card shadow-lg">
			{#if isLoading}
				<div>Recherche...</div>
			{/if}
			{#each results as item (item._id)}
				<ItemCard {item} bind:selectedItem />
			{/each}
		</div>
	{/if}
</div>
