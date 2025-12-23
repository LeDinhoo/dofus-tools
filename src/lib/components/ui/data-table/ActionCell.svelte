<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import DollarIcon from '@lucide/svelte/icons/circle-dollar-sign';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Edit from '@lucide/svelte/icons/settings-2';
	import ModifyButton from '$lib/components/ModifyButton.svelte';

	export let id: number;
	export let isSold: boolean;
	export let object;

	function handleDeleteSubmit() {
		if (!confirm('Voulez-vous vraiment supprimer cet item ?')) {
			return false; // Annule la soumission du formulaire
		}
		return true; // Continue la soumission
	}
</script>

<div class="flex items-center justify-end gap-2">
	<!-- BOUTON MODIFIER -->
	<ModifyButton {object} />

	<!-- BOUTON VENDRE -->
	{#if !isSold}
		<form method="POST" action="?/sellItem" use:enhance>
			<input type="hidden" name="id" value={id} />
			<Button
				variant="ghost"
				size="icon"
				type="submit"
				title="Marquer comme vendu"
				class="text-emerald-600 hover:bg-emerald-100"
			>
				<DollarIcon class="h-5 w-5" />
			</Button>
		</form>
	{:else}
		<form method="POST" action="?/unsellItem" use:enhance>
			<input type="hidden" name="id" value={id} />
			<Button
				variant="ghost"
				size="icon"
				type="submit"
				title="Marquer comme disponible"
				class="text-blue-600 hover:bg-blue-100"
			>
				<RotateCcw class="h-5 w-5" />
			</Button>
		</form>
	{/if}

	<!-- BOUTON SUPPRIMER (Existant) -->
	<form
		method="POST"
		action="?/deleteItem"
		use:enhance
		on:submit|preventDefault={handleDeleteSubmit}
	>
		<input type="hidden" name="id" value={id} />
		<Button
			variant="ghost"
			size="icon"
			type="submit"
			title="Supprimer"
			class="text-destructive hover:bg-red-100"
		>
			<TrashIcon class="h-4 w-4" />
		</Button>
	</form>
</div>
