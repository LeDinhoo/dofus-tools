<script lang="ts">
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import HouseIcon from "@lucide/svelte/icons/house";
  import InboxIcon from "@lucide/svelte/icons/inbox";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import DollarIcon from "@lucide/svelte/icons/circle-dollar-sign";
  import Wand from "@lucide/svelte/icons/wand-sparkles";
  import Gem from "@lucide/svelte/icons/gem";
  import DuelSwords from "@lucide/svelte/icons/swords";
  import Egg from "@lucide/svelte/icons/egg";
  import RightPanel from "@lucide/svelte/icons/panel-right";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { useSidebar } from "$lib/components/ui/sidebar/index.js";
  import Button from "./ui/button/button.svelte";

  const sidebar = useSidebar();
  let isHovered = $state(false);

  $inspect(sidebar.open);
  $inspect(isHovered);

  function handleHover() {
    isHovered = true;
  }

  function handleLeave() {
    isHovered = false;
  }

  // Menu items.
  const items = [
    {
      title: "Almanax",
      url: "#",
      icon: CalendarIcon,
    },
    {
      title: "Martin",
      url: "/koli",
      icon: DuelSwords,
    },
    {
      title: "Ventes", // <-- Item ajouté
      url: "/ventes", // <-- Route ajoutée
      icon: DollarIcon, // <-- Icône ajoutée
    },
    {
      title: "Forgemagie", // <-- Item ajouté
      url: "/forgemagie", // <-- Route ajoutée
      icon: Wand, // <-- Icône ajoutée
    },
  ];
</script>

<Sidebar.Root collapsible="icon">
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <div class="flex w-full flex-row justify-between">
            <Sidebar.MenuItem
              onmouseenter={handleHover}
              onmouseleave={handleLeave}
            >
              {#if sidebar.open}
                <Sidebar.MenuButton>
                  <Egg />
                </Sidebar.MenuButton>
              {:else}
                <Sidebar.MenuButton onclick={() => sidebar.toggle()}>
                  {#if isHovered}
                    <RightPanel color="#404040" />
                  {:else}
                    <Egg />
                  {/if}
                </Sidebar.MenuButton>
              {/if}
            </Sidebar.MenuItem>
            {#if sidebar.open}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton onclick={() => sidebar.toggle()}>
                  <RightPanel color="#404040" />
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/if}
          </div>
          {#each items as item (item.title)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
