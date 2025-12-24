<script lang="ts">
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns.ts";
  import HeaderItem from "$lib/components/header-item.svelte";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { drawer, closeDrawer } from "$lib/drawerStore.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import ModifyItem from "$lib/components/ModifyItem.svelte";

  export let data;
</script>

<div class="flex w-full flex-col gap-4">
  <HeaderItem />
  <DataTable data={data.items} {columns} />
  <ModifyItem bind:open={drawer.open} item={drawer.selectedObject} />
</div>
