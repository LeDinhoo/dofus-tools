<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils.js';

	// Voici la liste mise à jour
	const units = [
		{ value: '1', label: 'x1' },
		{ value: '10', label: 'x10' },
		{ value: '100', label: 'x100' },
		{ value: '1000', label: 'x1000' }
	];

	let { value = $bindable(), class: className = '' } = $props();

	const triggerContent = $derived(units.find((cat) => cat.value === value)?.label ?? 'Unité');
</script>

<div class={cn('w-full sm:w-fit', className)}>
	<Select.Root type="single" bind:value>
		<Select.Trigger class="w-full sm:w-[80px]">
			{triggerContent}
		</Select.Trigger>
		<Select.Content>
			{#each units as unit (unit.value)}
				<Select.Item value={unit.value} label={unit.label}>
					{unit.label}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
