<script lang="ts">
  import DataTable from "./data-table.svelte";
  import { columns } from "./columns.ts";
  import HeaderItem from "$lib/components/header-item.svelte";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { drawer } from "$lib/drawerStore.svelte.js";
  import ModifyItem from "$lib/components/ModifyItem.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { browser } from "$app/environment";
  import SearchInput from "$lib/components/ui/search/SearchInput.svelte";
  import { Check, ShoppingCart } from "@lucide/svelte";

  let { data } = $props();

  // Gestion des slots d'équipement
  let slotDialogOpen = $state(false);
  let selectedSlotIndex = $state<number | null>(null);
  let selectedSlotType = $state<'left' | 'right' | 'bottom' | null>(null);
  let searchValue = $state('');
  let selectedItem = $state(null);

  // Stockage des items équipés (16 slots: 5 gauche + 5 droite + 6 bas)
  let equippedItems = $state<Record<string, any>>({});
  // Stockage des prix pour chaque slot
  let equipmentPrices = $state<Record<string, number>>({});
  // Stockage du statut acheté/non acheté pour chaque slot
  let equipmentBought = $state<Record<string, boolean>>({});

  // Charger les équipements depuis localStorage
  $effect(() => {
    if (browser) {
      const saved = localStorage.getItem('dofus-equipement');
      if (saved) {
        equippedItems = JSON.parse(saved);
      }
      const savedPrices = localStorage.getItem('dofus-equipement-prices');
      if (savedPrices) {
        equipmentPrices = JSON.parse(savedPrices);
      }
      const savedBought = localStorage.getItem('dofus-equipement-bought');
      if (savedBought) {
        equipmentBought = JSON.parse(savedBought);
      }
    }
  });

  // Sauvegarder les équipements dans localStorage
  function saveEquipment() {
    if (browser) {
      localStorage.setItem('dofus-equipement', JSON.stringify(equippedItems));
    }
  }

  // Sauvegarder les prix dans localStorage
  function savePrices() {
    if (browser) {
      localStorage.setItem('dofus-equipement-prices', JSON.stringify(equipmentPrices));
    }
  }

  function updatePrice(type: string, index: number, price: number) {
    const key = `${type}-${index}`;
    equipmentPrices[key] = price;
    equipmentPrices = { ...equipmentPrices };
    savePrices();
  }

  function getPrice(type: string, index: number): number {
    return equipmentPrices[`${type}-${index}`] || 0;
  }

  // Sauvegarder le statut acheté dans localStorage
  function saveBought() {
    if (browser) {
      localStorage.setItem('dofus-equipement-bought', JSON.stringify(equipmentBought));
    }
  }

  function toggleBought(type: string, index: number) {
    const key = `${type}-${index}`;
    equipmentBought[key] = !equipmentBought[key];
    equipmentBought = { ...equipmentBought };
    saveBought();
  }

  function isBought(type: string, index: number): boolean {
    return equipmentBought[`${type}-${index}`] || false;
  }

  // Total des équipements non achetés (à ajouter à l'objectif)
  const totalUnboughtEquipment = $derived(() => {
    let total = 0;
    for (let i = 0; i < 5; i++) {
      if (getEquippedItem('left', i) && !isBought('left', i)) {
        total += getPrice('left', i);
      }
    }
    for (let i = 0; i < 5; i++) {
      if (getEquippedItem('right', i) && !isBought('right', i)) {
        total += getPrice('right', i);
      }
    }
    for (let i = 0; i < 6; i++) {
      if (getEquippedItem('bottom', i) && !isBought('bottom', i)) {
        total += getPrice('bottom', i);
      }
    }
    return total;
  });

  // Formater un prix avec des espaces (1900000 -> "1 900 000")
  function formatPriceDisplay(price: number): string {
    if (price === 0) return '';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Parser un prix formaté (enlever les espaces)
  function parsePriceInput(value: string): number {
    return parseInt(value.replace(/\s/g, '')) || 0;
  }

  // Gérer l'input avec formatage
  function handlePriceInput(e: Event, type: string, index: number) {
    const input = e.currentTarget as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    const oldValue = input.value;
    const oldLength = oldValue.length;

    // Parser et reformater
    const numericValue = parsePriceInput(input.value);
    updatePrice(type, index, numericValue);

    // Mettre à jour l'affichage formaté
    const newValue = formatPriceDisplay(numericValue);
    input.value = newValue;

    // Ajuster la position du curseur
    const newLength = newValue.length;
    const diff = newLength - oldLength;
    const newCursorPos = Math.max(0, cursorPos + diff);
    input.setSelectionRange(newCursorPos, newCursorPos);
  }

  // Liste de tous les items équipés pour l'affichage
  const allEquippedItems = $derived(() => {
    const items: { type: string; index: number; item: any; price: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const item = getEquippedItem('left', i);
      if (item) items.push({ type: 'left', index: i, item, price: getPrice('left', i) });
    }
    for (let i = 0; i < 5; i++) {
      const item = getEquippedItem('right', i);
      if (item) items.push({ type: 'right', index: i, item, price: getPrice('right', i) });
    }
    for (let i = 0; i < 6; i++) {
      const item = getEquippedItem('bottom', i);
      if (item) items.push({ type: 'bottom', index: i, item, price: getPrice('bottom', i) });
    }
    return items;
  });

  // Total des prix (tous les équipements)
  const totalEquipmentPrice = $derived(() => {
    return allEquippedItems().reduce((sum, e) => sum + e.price, 0);
  });

  // Total des équipements achetés uniquement
  const totalBoughtEquipment = $derived(() => {
    return allEquippedItems()
      .filter(e => isBought(e.type, e.index))
      .reduce((sum, e) => sum + e.price, 0);
  });

  function openSlotDialog(type: 'left' | 'right' | 'bottom', index: number) {
    selectedSlotType = type;
    selectedSlotIndex = index;
    searchValue = '';
    selectedItem = null;
    slotDialogOpen = true;
  }

  function confirmEquipItem() {
    if (selectedItem && selectedSlotType !== null && selectedSlotIndex !== null) {
      const key = `${selectedSlotType}-${selectedSlotIndex}`;
      equippedItems[key] = selectedItem;
      saveEquipment();
      slotDialogOpen = false;
    }
  }

  function removeEquipItem(type: string, index: number) {
    const key = `${type}-${index}`;
    delete equippedItems[key];
    equippedItems = { ...equippedItems };
    saveEquipment();
    // Supprimer aussi le prix associé
    delete equipmentPrices[key];
    equipmentPrices = { ...equipmentPrices };
    savePrices();
    // Supprimer aussi le statut acheté
    delete equipmentBought[key];
    equipmentBought = { ...equipmentBought };
    saveBought();
  }

  function getEquippedItem(type: string, index: number) {
    return equippedItems[`${type}-${index}`];
  }

  // Gestion de l'objectif personnalisé (stocké dans localStorage)
  let objectifMontant = $state(1_000_000_000);
  let objectifDate = $state('2026-12-31');
  let showObjectifDialog = $state(false);

  // Formulaire de modification
  let nouveauMontant = $state('');
  let nouvelleDate = $state('');

  // Charger l'objectif depuis localStorage au montage
  $effect(() => {
    if (browser) {
      const saved = localStorage.getItem('dofus-objectif');
      if (saved) {
        const parsed = JSON.parse(saved);
        objectifMontant = parsed.montant;
        objectifDate = parsed.date;
      }
    }
  });

  function ouvrirDialogObjectif() {
    nouveauMontant = (objectifMontant / 1_000_000).toString();
    nouvelleDate = objectifDate;
    showObjectifDialog = true;
  }

  function sauvegarderObjectif() {
    const montant = parseFloat(nouveauMontant) * 1_000_000;
    if (montant > 0 && nouvelleDate) {
      objectifMontant = montant;
      objectifDate = nouvelleDate;

      if (browser) {
        localStorage.setItem('dofus-objectif', JSON.stringify({
          montant: objectifMontant,
          date: objectifDate
        }));
      }

      showObjectifDialog = false;
    }
  }

  // Calcul des statistiques de base
  const totalDepense = $derived(data.items.reduce((sum, item) => sum + item.prixAchat, 0));
  const gainPotentiel = $derived(data.items
    .filter(item => !item.statusVente)
    .reduce((sum, item) => sum + item.benefit, 0));
  const gainReel = $derived(data.items
    .filter(item => item.statusVente)
    .reduce((sum, item) => sum + item.benefit, 0));

  // Statistiques avancées pour la page Statistiques
  const capitalTotal = $derived(totalDepense + gainReel + totalBoughtEquipment());
  const itemsVendus = $derived(data.items.filter(item => item.statusVente).length);
  const itemsEnVente = $derived(data.items.filter(item => !item.statusVente).length);
  const tauxReussite = $derived(data.items.length > 0 ? (itemsVendus / data.items.length) * 100 : 0);

  // Utiliser l'objectif personnalisé (ajouter les équipements non achetés au restant)
  const progressionPourcent = $derived((capitalTotal / (objectifMontant + totalUnboughtEquipment())) * 100);
  const restantPourObjectif = $derived(objectifMontant + totalUnboughtEquipment() - capitalTotal);

  // Calcul des jours restants jusqu'à la date objectif
  const aujourdhui = new Date();
  const dateFinObjectif = $derived(new Date(objectifDate));
  const joursRestants = $derived(Math.ceil((dateFinObjectif.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24)));
  const kamasParJour = $derived(joursRestants > 0 ? Math.ceil(restantPourObjectif / joursRestants) : 0);

  // ROI moyen
  const roiMoyen = $derived(totalDepense > 0 ? ((gainReel / totalDepense) * 100) : 0);

  // Gain moyen par vente
  const gainMoyenParVente = $derived(itemsVendus > 0 ? gainReel / itemsVendus : 0);

  // Temps moyen de vente (en jours)
  const tempsMoyenVente = $derived.by(() => {
    const ventesAvecTemps = data.items.filter(item => item.statusVente && item.soldAt);
    if (ventesAvecTemps.length === 0) return 0;

    const totalJours = ventesAvecTemps.reduce((sum, item) => {
      const start = new Date(item.createdAt);
      const end = new Date(item.soldAt!);
      const diffJours = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return sum + diffJours;
    }, 0);

    return totalJours / ventesAvecTemps.length;
  });

  // Top 5 meilleures ventes
  const topVentes = $derived([...data.items]
    .filter(item => item.statusVente)
    .sort((a, b) => b.benefit - a.benefit)
    .slice(0, 5));

  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "  ");
  }
</script>

<svelte:head>
  <title>Otomaï - Ventes</title>
</svelte:head>

<div class="flex w-full flex-col gap-2">
  
  <Tabs.Root value="hotel" class="w-full">
    <div class="w-full justify-center flex flex-row">
      <Tabs.List class="grid  grid-cols-3">
        <Tabs.Trigger value="hotel">Hôtel de Vente</Tabs.Trigger>
        <Tabs.Trigger value="equipement">Equipement</Tabs.Trigger>
        <Tabs.Trigger value="stats">Statistiques</Tabs.Trigger>
      </Tabs.List>
    </div>
    
    <!-- Onglet Hôtel de Vente -->
    <Tabs.Content value="hotel" class="space-y-4">
      <HeaderItem />
      <!-- Statistiques de base -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border bg-card p-2 px-3 flex flex-row items-center gap-2">
          <div class="text-sm font-medium text-muted-foreground">Total Dépensé</div>
          <div class="text-md font-bold text-red-500 flex items-center gap-2">
            {formatNumber(totalDepense)}
            <img class="size-4" src="/Kama.png" alt="Kama">
          </div>
        </div>

        <div class="rounded-lg border bg-card p-2 px-3 flex flex-row items-center gap-2">
          <div class="text-sm font-medium text-muted-foreground">Gain Potentiel</div>
          <div class="text-md font-bold text-amber-600 flex items-center gap-2">
            {formatNumber(gainPotentiel)}
            <img class="size-4" src="/Kama.png" alt="Kama">
          </div>
        </div>

        <div class="rounded-lg border bg-card p-2 px-3 flex flex-row items-center gap-2">
          <div class="text-sm font-medium text-muted-foreground">Gain Réel</div>
          <div class="text-md font-bold text-emerald-600 flex items-center gap-2">
            {formatNumber(gainReel)}
            <img class="size-4" src="/Kama.png" alt="Kama">
          </div>
        </div>
      </div>

      <DataTable data={data.items} {columns} />
    </Tabs.Content>

    <!-- Onglet Equipement -->
    <Tabs.Content value="equipement" class="py-4">
      <div class="flex flex-col items-center gap-4">
        <!-- Total -->
        <div class="flex items-center gap-2 text-lg font-bold">
          Total: {formatNumber(totalEquipmentPrice())}
          <img class="size-5" src="/Kama.png" alt="Kama">
        </div>

        <div class="flex items-center gap-4">
          <!-- 5 slots à gauche avec inputs -->
          <div class="flex flex-col gap-2">
            {#each Array(5) as _, i}
              {@const item = getEquippedItem('left', i)}
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => openSlotDialog('left', i)}
                  oncontextmenu={(e) => { e.preventDefault(); if (item) removeEquipItem('left', i); }}
                  class="size-14 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/50 hover:border-primary hover:bg-muted transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  {#if item}
                    <img src={item.img} alt={item.name?.fr} class="size-12 object-contain" />
                  {/if}
                </button>
                <div class="relative">
                  <Input
                    type="text"
                    value={formatPriceDisplay(getPrice('left', i))}
                    oninput={(e) => handlePriceInput(e, 'left', i)}
                    class="w-28 text-center text-sm pr-5"
                    placeholder="Prix"
                  />
                  <img class="size-4 absolute right-1.5 top-1/2 -translate-y-1/2" src="/Kama.png" alt="Kama">
                </div>
                <button
                  type="button"
                  onclick={() => item && toggleBought('left', i)}
                  class="size-6 rounded-md flex items-center justify-center transition-colors {item ? (isBought('left', i) ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground') : 'invisible'}"
                  title={isBought('left', i) ? 'Acheté' : 'Non acheté'}
                >
                  {#if isBought('left', i)}
                    <Check class="size-4" />
                  {:else}
                    <ShoppingCart class="size-4" />
                  {/if}
                </button>
              </div>
            {/each}
          </div>

          <!-- Image centrale -->
          <img
            src="/character.png"
            alt="Character"
            class="max-h-[50vh] object-contain"
          />

          <!-- 5 slots à droite avec inputs -->
          <div class="flex flex-col gap-2">
            {#each Array(5) as _, i}
              {@const item = getEquippedItem('right', i)}
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => item && toggleBought('right', i)}
                  class="size-6 rounded-md flex items-center justify-center transition-colors {item ? (isBought('right', i) ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground') : 'invisible'}"
                  title={isBought('right', i) ? 'Acheté' : 'Non acheté'}
                >
                  {#if isBought('right', i)}
                    <Check class="size-4" />
                  {:else}
                    <ShoppingCart class="size-4" />
                  {/if}
                </button>
                <div class="relative">
                  <img class="size-4 absolute right-1.5 top-1/2 -translate-y-1/2" src="/Kama.png" alt="Kama">
                  <Input
                    type="text"
                    value={formatPriceDisplay(getPrice('right', i))}
                    oninput={(e) => handlePriceInput(e, 'right', i)}
                    class="w-28 text-center text-sm pr-5"
                    placeholder="Prix"
                  />
                </div>
                <button
                  type="button"
                  onclick={() => openSlotDialog('right', i)}
                  oncontextmenu={(e) => { e.preventDefault(); if (item) removeEquipItem('right', i); }}
                  class="size-14 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/50 hover:border-primary hover:bg-muted transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
                >
                  {#if item}
                    <img src={item.img} alt={item.name?.fr} class="size-12 object-contain" />
                  {/if}
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- 6 slots en bas avec inputs -->
        <div class="flex gap-4">
          {#each Array(6) as _, i}
            {@const item = getEquippedItem('bottom', i)}
            <div class="flex flex-col items-center gap-1">
              <button
                type="button"
                onclick={() => openSlotDialog('bottom', i)}
                oncontextmenu={(e) => { e.preventDefault(); if (item) removeEquipItem('bottom', i); }}
                class="size-14 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/50 hover:border-primary hover:bg-muted transition-colors flex items-center justify-center overflow-hidden"
              >
                {#if item}
                  <img src={item.img} alt={item.name?.fr} class="size-12 object-contain" />
                {/if}
              </button>
              <div class="relative">
                <Input
                  type="text"
                  value={formatPriceDisplay(getPrice('bottom', i))}
                  oninput={(e) => handlePriceInput(e, 'bottom', i)}
                  class="w-28 text-center text-sm pr-5"
                  placeholder="Prix"
                />
                <img class="size-4 absolute right-1 top-1/2 -translate-y-1/2" src="/Kama.png" alt="Kama">
              </div>
              {#if item}
                <button
                  type="button"
                  onclick={() => toggleBought('bottom', i)}
                  class="size-6 rounded-md flex items-center justify-center transition-colors {isBought('bottom', i) ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}"
                  title={isBought('bottom', i) ? 'Acheté' : 'Non acheté'}
                >
                  {#if isBought('bottom', i)}
                    <Check class="size-4" />
                  {:else}
                    <ShoppingCart class="size-4" />
                  {/if}
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </Tabs.Content>

    <!-- Dialog pour sélectionner un item -->
    <Dialog.Root bind:open={slotDialogOpen}>
      <Dialog.Content class="sm:max-w-[400px]">
        <Dialog.Header>
          <Dialog.Title>Sélectionner un équipement</Dialog.Title>
        </Dialog.Header>
        <div class="py-4">
          <SearchInput
            placeholder="Rechercher un item..."
            bind:value={searchValue}
            bind:selectedItem
          />
        </div>
        <Dialog.Footer>
          <Button variant="outline" onclick={() => slotDialogOpen = false}>
            Annuler
          </Button>
          <Button onclick={confirmEquipItem} disabled={!selectedItem}>
            Équiper
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <!-- Onglet Statistiques -->
    <Tabs.Content value="stats" class="space-y-6">
      <!-- Objectif personnalisé -->
      <div class="rounded-lg border bg-card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold flex items-center gap-2">
            🎯 Objectif : {formatNumber(objectifMontant)} Kamas
          </h3>
          <Button variant="outline" size="sm" onclick={ouvrirDialogObjectif}>
            Modifier
          </Button>
        </div>

        <div class="space-y-4">
          <!-- Barre de progression -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="font-medium">Progression</span>
              <span class="font-bold text-blue-600">{progressionPourcent.toFixed(2)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                class="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                style="width: {Math.min(progressionPourcent, 100)}%"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{formatNumber(capitalTotal)} K</span>
              <span>{formatNumber(objectifMontant)} K</span>
            </div>
          </div>

          <!-- Infos objectif -->
          <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="text-center p-3 rounded-lg bg-muted">
              <div class="text-2xl font-bold text-orange-600">{joursRestants}</div>
              <div class="text-xs text-muted-foreground">jours restants</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-muted">
              <div class="text-2xl font-bold text-red-600">{formatNumber(restantPourObjectif)}</div>
              <div class="text-xs text-muted-foreground flex items-center justify-center gap-1">
                K restants <img class="size-3" src="/Kama.png" alt="Kama">
              </div>
            </div>
            <div class="text-center p-3 rounded-lg bg-muted">
              <div class="text-2xl font-bold text-purple-600">{formatNumber(kamasParJour)}</div>
              <div class="text-xs text-muted-foreground flex items-center justify-center gap-1">
                K/jour nécessaires <img class="size-3" src="/Kama.png" alt="Kama">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg border bg-card p-6">
          <h4 class="text-lg font-bold mb-4">📈 Performance</h4>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">ROI Moyen</span>
              <span class="font-bold text-emerald-600">{roiMoyen.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Gain moyen/vente</span>
              <span class="font-bold flex items-center gap-1">
                {formatNumber(Math.round(gainMoyenParVente))}
                <img class="size-3" src="/Kama.png" alt="Kama">
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Temps moyen de vente</span>
              <span class="font-bold text-blue-600">{tempsMoyenVente.toFixed(1)}j</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Taux de réussite</span>
              <span class="font-bold text-purple-600">{tauxReussite.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg border bg-card p-6">
          <h4 class="text-lg font-bold mb-4">💼 État actuel</h4>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Capital total</span>
              <span class="font-bold text-blue-600 flex items-center gap-1">
                {formatNumber(capitalTotal)}
                <img class="size-3" src="/Kama.png" alt="Kama">
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Items vendus</span>
              <span class="font-bold text-emerald-600">{itemsVendus}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Items en vente</span>
              <span class="font-bold text-amber-600">{itemsEnVente}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">Capital immobilisé</span>
              <span class="font-bold text-red-500 flex items-center gap-1">
                {formatNumber(data.items.filter(i => !i.statusVente).reduce((s, i) => s + i.prixAchat, 0))}
                <img class="size-3" src="/Kama.png" alt="Kama">
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top 5 meilleures ventes -->
      <div class="rounded-lg border bg-card p-6">
        <h4 class="text-lg font-bold mb-4">🏆 Top 5 Meilleures Ventes</h4>
        <div class="space-y-2">
          {#each topVentes as item, index}
            <div class="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                {#if item.imageUrl}
                  <img src={item.imageUrl} alt={item.nom} class="w-8 h-8 rounded object-contain" />
                {/if}
                <span class="font-medium">{item.nom}</span>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-600 flex items-center gap-1">
                  +{formatNumber(item.benefit)}
                  <img class="size-3.5" src="/Kama.png" alt="Kama">
                </div>
                <div class="text-xs text-muted-foreground">
                  ROI: {item.prixAchat > 0 ? ((item.benefit / item.prixAchat) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          {:else}
            <p class="text-center text-muted-foreground py-4">Aucune vente pour le moment</p>
          {/each}
        </div>
      </div>
    </Tabs.Content>
  </Tabs.Root>

  <ModifyItem bind:open={drawer.open} item={drawer.selectedObject} />

  <!-- Dialog pour modifier l'objectif -->
  <Dialog.Root bind:open={showObjectifDialog}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Modifier l'objectif</Dialog.Title>
        <Dialog.Description>
          Définissez votre objectif de Kamas et la date cible
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="montant">Montant (en millions de Kamas)</Label>
          <Input
            id="montant"
            type="number"
            bind:value={nouveauMontant}
            placeholder="30"
          />
          <p class="text-xs text-muted-foreground">
            Exemple : 30 pour 30 millions de Kamas
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="date">Date cible</Label>
          <Input
            id="date"
            type="date"
            bind:value={nouvelleDate}
          />
        </div>
      </div>
      <Dialog.Footer>
        <Button variant="outline" onclick={() => showObjectifDialog = false}>
          Annuler
        </Button>
        <Button onclick={sauvegarderObjectif}>
          Sauvegarder
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>
