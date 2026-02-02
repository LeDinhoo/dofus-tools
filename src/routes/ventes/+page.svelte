<script lang="ts">
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns.ts";
  import HeaderItem from "$lib/components/header-item.svelte";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { drawer, closeDrawer } from "$lib/drawerStore.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import ModifyItem from "$lib/components/ModifyItem.svelte";

  export let data;

  // Calcul des statistiques
  $: totalDepense = data.items.reduce((sum, item) => sum + item.prixAchat, 0);
  $: gainPotentiel = data.items
    .filter(item => !item.statusVente)
    .reduce((sum, item) => sum + item.benefit, 0);
  $: gainReel = data.items
    .filter(item => item.statusVente)
    .reduce((sum, item) => sum + item.benefit, 0);

  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "  ");
  }
</script>

<div class="flex w-full flex-col gap-4">
  <HeaderItem />

  <!-- Statistiques -->
  <div class="grid grid-cols-3 gap-4">
    <div class="rounded-lg border bg-card p-4 flex flex-row items-center">
      <div class="text-sm font-medium text-muted-foreground mb-1">Total Dépensé</div>
      <div class="text-xl font-bold text-red-500 flex items-center gap-2">
        {formatNumber(totalDepense)}
        <img class="size-3" src="/Kama.png" alt="Kama">
      </div>
    </div>

    <div class="rounded-lg border bg-card p-4 flex flex-row items-center">
      <div class="text-sm font-medium text-muted-foreground mb-1">Gain Potentiel</div>
      <div class="text-xl font-bold text-amber-600 flex items-center gap-2">
        {formatNumber(gainPotentiel)}
        <img class="size-3" src="/Kama.png" alt="Kama">
      </div>
    </div>

    <div class="rounded-lg border bg-card p-4 flex flex-row items-center">
      <div class="text-sm font-medium text-muted-foreground mb-1">Gain Réel</div>
      <div class="text-xl font-bold text-emerald-600 flex items-center gap-2">
        {formatNumber(gainReel)}
        <img class="size-3" src="/Kama.png" alt="Kama">
      </div>
    </div>
  </div>

  <DataTable data={data.items} {columns} />
  <ModifyItem bind:open={drawer.open} item={drawer.selectedObject} />
</div>
