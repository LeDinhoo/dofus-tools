<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Button from '$lib/components/ui/button/button.svelte';
	import { openModifyDrawer } from '$lib/drawerStore.svelte.js';
	import Edit from '@lucide/svelte/icons/settings-2';

	// Cet 'objet' sera passé par la DataTable (l'objet de la ligne)
	export let object;
</script>

<Button
	onclick={() => openModifyDrawer(object)}
	variant="ghost"
	size="icon"
	type="submit"
	title="Modifier"
	class="text-yellow-600 hover:bg-yellow-100"
>
	<Edit class="h-4 w-4" />
</Button>
