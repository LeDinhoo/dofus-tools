<script lang="ts" generics="TData, TValue">
  import { type ColumnDef, getCoreRowModel, getSortedRowModel, type SortingState } from "@tanstack/table-core";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { ArrowUpDown, ArrowUp, ArrowDown } from "@lucide/svelte";

  type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
  };

  let { data, columns }: DataTableProps<TData, TValue> = $props();

  let sorting = $state<SortingState>([]);

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      if (typeof updater === "function") {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },
    state: {
      get sorting() {
        return sorting;
      },
    },
  });
</script>

<div class="rounded-md border">
  <Table.Root>
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head colspan={header.colSpan}>
              {#if !header.isPlaceholder}
                {#if header.column.getCanSort()}
                  <button
                    type="button"
                    class="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer select-none"
                    onclick={() => header.column.toggleSorting()}
                  >
                    <FlexRender
                      content={header.column.columnDef.header}
                      context={header.getContext()}
                    />
                    {#if header.column.getIsSorted() === "asc"}
                      <ArrowUp class="size-4" />
                    {:else if header.column.getIsSorted() === "desc"}
                      <ArrowDown class="size-4" />
                    {:else}
                      <ArrowUpDown class="size-4 opacity-50" />
                    {/if}
                  </button>
                {:else}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row data-state={row.getIsSelected() && "selected"}>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender
                content={cell.column.columnDef.cell}
                context={cell.getContext()}
              />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-24 text-center"
            >No results.</Table.Cell
          >
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
