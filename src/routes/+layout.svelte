<script lang="ts">
  import favicon from "$lib/assets/otomai.png";
  import "../app.css";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Toaster />
<Sidebar.Provider open={false}>
  <AppSidebar />
  <main class="w-full pl-4 pr-12 pt-2">
    {@render children?.()}
  </main>
</Sidebar.Provider>
