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

<div class="flex flex-row items-center justify-center">
  <form
    action="?/createItem"
    method="POST"
    class="flex w-full items-center justify-between gap-4"
    use:enhance={({ formData }) => {
      handleSubmit({ formData });
    }}
  >
    <div class="flex w-full flex-row gap-4">
      <SearchInput
        placeholder="Rechercher un objet"
        bind:value={name}
        bind:selectedItem
      />

      <CategorySelect bind:value={category} />

      <Input
        placeholder="Taille"
        type="number"
        bind:value={size}
        name="size"
        class="w-[90px]"
      />

      <UnitSelect bind:value={unit} />

      <Input
        placeholder="Prix d'achat"
        type="number"
        bind:value={purchasePrice}
        name="prixAchat"
        class="w-[180px]"
      />

      <Dialog.Root bind:open={priceDialogOpen}>
        <Dialog.Trigger>
          <Button variant="outline" size="icon">
            <Copy />
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <CraftPriceInput bind:purchasePrice onValidate={closeDialog} />
          </Dialog.Header>
        </Dialog.Content>
      </Dialog.Root>

      <Input
        placeholder="Prix de vente"
        type="number"
        bind:value={salePrice}
        name="prixVente"
        class="w-[180px]"
      />

      <div class="flex items-center justify-center gap-2">
        <Switch id="airplane-mode" bind:checked={saleStatus} />
        <Label for="airplane-mode" class="w-16 justify-self-auto"
          >{saleStatusLabel}</Label
        >
      </div>
    </div>
    <Button class="cursor-pointer" type="submit" variant="outline">
      <Plus />
      Nouveau
    </Button>
  </form>
</div>
