<script>
	let { item, selectedItem = $bindable() } = $props();
</script>

<button
	type="button"
	class="flex w-full cursor-pointer flex-row gap-2 border-b p-2 hover:bg-accent hover:text-accent-foreground"
	onclick={() => (selectedItem = item)}
>
	<img src={item.img} alt={item.slug.fr} class="m-2 h-12 w-auto" />
	<div class="flex flex-col items-start justify-center">
		<span class="font-medium">{item.name.fr}</span>
		<span class="text-sm text-muted-foreground">Niveau {item.level}</span>
	</div>
</button>