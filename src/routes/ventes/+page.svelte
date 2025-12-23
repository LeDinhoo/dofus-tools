<script lang="ts">
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns.ts";
  import HeaderItem from "$lib/components/header-item.svelte";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { drawer, closeDrawer } from "$lib/drawerStore.svelte.js";
  import Button from "$lib/components/ui/button/button.svelte";

  export let data;
</script>

<div class="flex w-full flex-col gap-4">
  <HeaderItem />
  <DataTable data={data.items} {columns} />
  <Drawer.Root bind:open={drawer.open}>
    <Drawer.Content>
      {#if drawer.selectedObject}
        <Drawer.Header>
          <Drawer.Title
            >Modifier: {JSON.stringify(drawer.selectedObject)}</Drawer.Title
          >
        </Drawer.Header>

        <div class="p-4">
          <p>ID: {drawer.selectedObject.id}</p>
        </div>

        <Drawer.Footer>
          <Button variant="outline" onclick={closeDrawer}>Annuler</Button>
        </Drawer.Footer>
      {/if}
    </Drawer.Content>
  </Drawer.Root>
</div>
