<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.js";

  // Voici la liste mise à jour
  const categories = [
    { value: "ames", label: "Âmes" },
    { value: "equipements", label: "Équipements" },
    { value: "consommables", label: "Consommables" },
    { value: "creatures", label: "Créatures" },
    { value: "cosmetiques", label: "Cosmétiques" },
    { value: "runes", label: "Runes" },
    { value: "ressources", label: "Ressources" },
  ];

  let { value = $bindable() } = $props();

  const triggerContent = $derived(
    categories.find((cat) => cat.value === value)?.label ?? "Catégorie"
  );
</script>

<div class="flex w-[180px]">
  <Select.Root type="single" bind:value>
    <Select.Trigger class="w-[180px]">
      {triggerContent}
    </Select.Trigger>
    <Select.Content>
      {#each categories as category (category.value)}
        <Select.Item value={category.value} label={category.label}>
          {category.label}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
