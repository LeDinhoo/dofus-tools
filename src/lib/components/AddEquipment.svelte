<script lang="ts">
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash-2";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import SearchInput from "./ui/search/SearchInput.svelte";
  import { enhance } from "$app/forms";

  let selectedItem = $state(null);
  let prix = $state();

  function handleSubmit({ formData }: { formData: FormData }) {
    if (selectedItem) {
      formData.set("nom", selectedItem.name.fr);
      formData.set("imageUrl", selectedItem.img);
      formData.set("type", selectedItem.type?.name?.fr || "");
      formData.set("superType", selectedItem.type?.superType?.name?.fr || "");
    }

    console.log("Form Data Soumise:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
  }

  function resetForm() {
    selectedItem = null;
    prix = undefined;
  }
</script>

<div
  class="flex flex-row items-center justify-center gap-4 p-4 bg-muted rounded-lg border"
>
  <form
    action="?/createEquipment"
    method="POST"
    class="flex w-full items-center justify-between gap-4"
    use:enhance={({ formData }) => {
      handleSubmit({ formData });
      return async ({ update }) => {
        await update();
        resetForm();
      };
    }}
  >
    <div class="flex flex-wrap w-full flex-row gap-4 items-center">
      <SearchInput
        placeholder="Rechercher un équipement"
        bind:selectedItem
      />

      <Input
        placeholder="Prix souhaité"
        type="number"
        bind:value={prix}
        name="prix"
        class="w-[180px]"
      />
    </div>

    <Button class="cursor-pointer" type="submit" variant="outline" disabled={!selectedItem || !prix}>
      <Plus />
      Ajouter
    </Button>
  </form>
</div>
