<script lang="ts">
  // Icons
  import Plus from "@lucide/svelte/icons/plus";
  import Copy from "@lucide/svelte/icons/copy";

  //Other components
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import CategorySelect from "./category-select.svelte";
  import UnitSelect from "./unit-select.svelte";
  import SearchInput from "./ui/search/SearchInput.svelte";
  import CraftPriceInput from "./CraftPriceInput.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { enhance } from "$app/forms";

  let name = $state("");
  let category = $state("");
  let unit = $state("");
  let purchasePrice = $state();
  let size = $state();
  let salePrice = $state();
  let saleStatus = $state(false);
  let saleStatusLabel = $derived(saleStatus ? "Vendu" : "Disponible");
  let selectedItem = $state(null);
  let priceDialogOpen = $state(false);
  let kamasAvant = $state();
  let kamasApres = $state();

  function closeDialog() {
    priceDialogOpen = false;
  }

  function handleSubmit({ formData }: { formData: FormData }) {
    if (selectedItem) {
      formData.set("nom", selectedItem.name.fr);
      formData.set("imageUrl", selectedItem.img);
      formData.set("type", selectedItem.type?.name?.fr || "");
      formData.set("superType", selectedItem.type?.superType?.name?.fr || "");
    }

    formData.set("category", category);
    formData.set("unit", unit);
    formData.set("statusVente", saleStatus.toString());

    console.log("Form Data Soumise:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
  }
</script>

<form
  action="?/createItem"
  method="POST"
  class="flex flex-col gap-3 p-4 bg-muted rounded-lg border"
  use:enhance={({ formData }) => {
    handleSubmit({ formData });
  }}
>
  <!-- Mobile: colonnes empilées | Desktop: tout en ligne avec flex-wrap -->
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <SearchInput
      placeholder="Rechercher un objet"
      bind:value={name}
      bind:selectedItem
    />

    <CategorySelect bind:value={category} />
    <UnitSelect bind:value={unit} />

    <Input
      placeholder="Taille"
      type="number"
      bind:value={size}
      name="size"
      class="w-full sm:w-20"
    />

    <div class="flex gap-2 items-center">
      <Input
        placeholder="Prix d'achat"
        type="number"
        bind:value={purchasePrice}
        name="prixAchat"
        class="w-full sm:w-32"
      />
      <Dialog.Root bind:open={priceDialogOpen}>
        <Dialog.Trigger>
          <Button variant="outline" size="icon" class="shrink-0">
            <Copy />
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <CraftPriceInput bind:purchasePrice onValidate={closeDialog} />
          </Dialog.Header>
        </Dialog.Content>
      </Dialog.Root>
    </div>

    <Input
      placeholder="Prix de vente"
      type="number"
      bind:value={salePrice}
      name="prixVente"
      class="w-full sm:w-32"
    />

    <Input
      placeholder="Kamas avant"
      type="number"
      bind:value={kamasAvant}
      name="kamasAvant"
      class="w-full sm:w-32"
    />

    <Input
      placeholder="Kamas après"
      type="number"
      bind:value={kamasApres}
      name="kamasApres"
      class="w-full sm:w-32"
    />

    <div class="flex items-center gap-2">
      <Switch id="airplane-mode" bind:checked={saleStatus} />
      <Label for="airplane-mode" class="text-sm whitespace-nowrap">
        {saleStatusLabel}
      </Label>
    </div>

    <Button class="cursor-pointer w-full sm:w-auto" type="submit" variant="outline">
      <Plus />
      <span class="hidden sm:inline">Nouveau</span>
    </Button>
  </div>
</form>
