<script lang="ts">
  import { enhance } from "$app/forms";

  let { id, price, size }: { id: number; price: number | null; size: number } = $props();

  let editValue = $state(price?.toString() ?? "");
  let isEditing = $state(false);

  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "  ");
  }

  function handleBlur() {
    isEditing = false;
    const newPrice = parseFloat(editValue);
    if (!isNaN(newPrice) && newPrice !== price) {
      // Submit the form
      const form = document.getElementById(`price-form-${id}`) as HTMLFormElement;
      form?.requestSubmit();
    }
  }

  function handleFocus() {
    isEditing = true;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      editValue = price?.toString() ?? "";
      isEditing = false;
    }
  }

  const formattedTotal = $derived(price !== null ? formatNumber(price) : "-");
  const formattedUnit = $derived(price !== null && size > 1 ? formatNumber(Math.round(price / size)) : "");
</script>

<form
  id="price-form-{id}"
  action="?/updatePrixVente"
  method="POST"
  use:enhance={() => {
    return async ({ update }) => {
      await update();
    };
  }}
>
  <input type="hidden" name="id" value={id} />
  <input type="hidden" name="prixVente" value={editValue} />
</form>

<div class="flex flex-col">
  {#if isEditing}
    <input
      type="number"
      class="w-24 px-1 py-0.5 text-emerald-600 font-medium border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
      bind:value={editValue}
      onblur={handleBlur}
      onkeydown={handleKeydown}
      autofocus
    />
  {:else}
    <button
      type="button"
      class="text-emerald-600 font-medium flex flex-row items-center gap-1 hover:bg-emerald-50 rounded px-1 py-0.5 cursor-text text-left"
      onfocus={handleFocus}
      onclick={handleFocus}
    >
      {formattedTotal}
      <img class="size-3.5" src="/Kama.png" alt="Kama" />
    </button>
  {/if}
  {#if price !== null && size > 1}
    <div class="text-xs text-gray-500 font-normal mt-0.5">Unité : {formattedUnit}</div>
  {/if}
</div>
