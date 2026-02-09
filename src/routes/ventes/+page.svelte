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
  import { Check, ShoppingCart, Download, Loader2, DollarSign, Plus, Trash2, Search, ChefHat, X, PackageSearch } from "@lucide/svelte";
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();

  // Recherche de recette
  let recipeSearch = $state('');
  let recipeSelectedItem = $state<any>(null);
  let recipeLoading = $state(false);
  let recipeResult = $state<any>(null);
  let recipeError = $state('');

  async function searchRecipe() {
    if (!recipeSelectedItem) return;
    recipeLoading = true;
    recipeError = '';
    recipeResult = null;
    try {
      const res = await fetch(`/api/recipe?name=${encodeURIComponent(recipeSelectedItem.name?.fr || recipeSelectedItem.slug?.fr)}`);
      const data = await res.json();
      if (!res.ok) {
        recipeError = data.message || 'Erreur lors de la recherche';
        return;
      }
      recipeResult = data;
    } catch (e) {
      recipeError = 'Erreur de connexion';
    } finally {
      recipeLoading = false;
    }
  }

  // Auto-search quand un item est sélectionné
  $effect(() => {
    if (recipeSelectedItem) {
      searchRecipe();
    } else {
      recipeResult = null;
      recipeError = '';
    }
  });

  // Scanner de chat
  let chatText = $state('');
  let chatLoading = $state(false);
  let chatCrafts = $state<any[]>([]);
  let chatRemainingPile = $state<any[]>([]);
  let chatTotalCost = $state(0);
  let chatError = $state('');
  let chatCreatedItems = $state<any[]>([]);

  async function parseChatLog() {
    chatLoading = true;
    chatCrafts = [];
    chatRemainingPile = [];
    chatTotalCost = 0;
    chatError = '';
    try {
      const res = await fetch('/api/chat-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatText })
      });
      const data = await res.json();
      if (!res.ok) {
        chatError = data.message || 'Erreur lors de l\'analyse';
        return;
      }
      chatCrafts = data.crafts;
      chatTotalCost = data.totalCost;
      chatRemainingPile = data.remaining;
    } catch (e) {
      chatError = 'Erreur de connexion';
    } finally {
      chatLoading = false;
    }
  }

  // Gestion des sets d'équipement
  type EquipmentSet = {
    id: number;
    name: string;
    includeInObjective: boolean;
    equipments: any[];
  };
  let equipmentSets = $state<EquipmentSet[]>([]);
  let activeSetId = $state<number | null>(null);
  let showRenameDialog = $state(false);
  let renameSetId = $state<number | null>(null);
  let renameValue = $state('');

  // Gestion des slots d'équipement
  let slotDialogOpen = $state(false);
  let selectedSlotIndex = $state<number | null>(null);
  let selectedSlotType = $state<'left' | 'right' | 'bottom' | null>(null);
  let searchValue = $state('');
  let selectedItem = $state(null);

  // Stockage des items équipés (16 slots: 5 gauche + 5 droite + 6 bas)
  let equippedItems = $state<Record<string, any>>({});

  // Import DofusBook
  let showImportDialog = $state(false);
  let importUrl = $state('');
  let importLoading = $state(false);
  let importError = $state('');
  let importNotFound = $state<string[]>([]);
  // Stockage des prix pour chaque slot
  let equipmentPrices = $state<Record<string, number>>({});
  // Stockage du statut acheté/non acheté pour chaque slot
  let equipmentBought = $state<Record<string, boolean>>({});
  // État de chargement des équipements
  let equipmentLoading = $state(true);

  // Charger les sets depuis l'API
  $effect(() => {
    if (browser) {
      loadEquipmentSets();
    }
  });

  async function loadEquipmentSets() {
    try {
      const response = await fetch('/api/equipment-sets');
      if (response.ok) {
        const data = await response.json();
        equipmentSets = data.sets || [];
        if (equipmentSets.length > 0 && !activeSetId) {
          activeSetId = equipmentSets[0].id;
          await loadEquipmentFromSet(equipmentSets[0].id);
        }
      }
    } catch (e) {
      console.error('Erreur chargement sets:', e);
    } finally {
      equipmentLoading = false;
    }
  }

  async function loadEquipmentFromSet(setId: number) {
    try {
      const response = await fetch(`/api/equipment?setId=${setId}`);
      if (response.ok) {
        const data = await response.json();
        equippedItems = data.equippedItems || {};
        equipmentPrices = data.equipmentPrices || {};
        equipmentBought = data.equipmentBought || {};
      }
    } catch (e) {
      console.error('Erreur chargement équipements:', e);
    }
  }

  async function switchSet(setId: number) {
    activeSetId = setId;
    await loadEquipmentFromSet(setId);
  }

  async function createNewSet() {
    try {
      const response = await fetch('/api/equipment-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Équipement ${equipmentSets.length + 1}` }),
      });
      if (response.ok) {
        const data = await response.json();
        equipmentSets = [...equipmentSets, data.set];
        await switchSet(data.set.id);
      }
    } catch (e) {
      console.error('Erreur création set:', e);
    }
  }

  async function deleteSet(setId: number) {
    if (equipmentSets.length <= 1) return;
    try {
      const response = await fetch('/api/equipment-sets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId }),
      });
      if (response.ok) {
        equipmentSets = equipmentSets.filter(s => s.id !== setId);
        if (activeSetId === setId && equipmentSets.length > 0) {
          await switchSet(equipmentSets[0].id);
        }
      }
    } catch (e) {
      console.error('Erreur suppression set:', e);
    }
  }

  async function toggleSetObjective(setId: number) {
    const set = equipmentSets.find(s => s.id === setId);
    if (!set) return;
    try {
      await fetch('/api/equipment-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId, includeInObjective: !set.includeInObjective }),
      });
      equipmentSets = equipmentSets.map(s =>
        s.id === setId ? { ...s, includeInObjective: !s.includeInObjective } : s
      );
    } catch (e) {
      console.error('Erreur mise à jour set:', e);
    }
  }

  async function renameSet() {
    if (!renameSetId || !renameValue.trim()) return;
    try {
      await fetch('/api/equipment-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: renameSetId, name: renameValue }),
      });
      equipmentSets = equipmentSets.map(s =>
        s.id === renameSetId ? { ...s, name: renameValue } : s
      );
      showRenameDialog = false;
      renameSetId = null;
      renameValue = '';
    } catch (e) {
      console.error('Erreur renommage set:', e);
    }
  }

  function openRenameDialog(setId: number, currentName: string) {
    renameSetId = setId;
    renameValue = currentName;
    showRenameDialog = true;
  }

  // Sauvegarder un équipement dans la DB
  async function saveEquipmentSlot(slot: string, itemData: any, price?: number, bought?: boolean) {
    if (!activeSetId) return;
    const finalPrice = price ?? equipmentPrices[slot] ?? 0;
    const finalBought = bought ?? equipmentBought[slot] ?? false;
    try {
      await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: activeSetId,
          slot,
          itemData,
          price: finalPrice,
          bought: finalBought
        }),
      });
      // Mettre à jour le set local pour les totaux
      updateLocalSetEquipment(slot, itemData, finalPrice, finalBought);
    } catch (e) {
      console.error('Erreur sauvegarde équipement:', e);
    }
  }

  // Mettre à jour prix ou statut acheté
  async function updateEquipmentSlot(slot: string, price?: number, bought?: boolean) {
    if (!activeSetId) return;
    try {
      await fetch('/api/equipment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: activeSetId, slot, price, bought }),
      });
      // Mettre à jour le set local pour les totaux
      const set = equipmentSets.find(s => s.id === activeSetId);
      if (set) {
        const eq = set.equipments.find(e => e.slot === slot);
        if (eq) {
          if (price !== undefined) eq.price = price;
          if (bought !== undefined) eq.bought = bought;
          equipmentSets = [...equipmentSets];
        }
      }
    } catch (e) {
      console.error('Erreur mise à jour équipement:', e);
    }
  }

  // Mettre à jour l'équipement local dans le set
  function updateLocalSetEquipment(slot: string, itemData: any, price: number, bought: boolean) {
    const set = equipmentSets.find(s => s.id === activeSetId);
    if (!set) return;

    if (itemData === null) {
      // Supprimer l'équipement
      set.equipments = set.equipments.filter(e => e.slot !== slot);
    } else {
      // Ajouter ou mettre à jour
      const existingIndex = set.equipments.findIndex(e => e.slot === slot);
      if (existingIndex >= 0) {
        set.equipments[existingIndex] = { slot, itemData, price, bought };
      } else {
        set.equipments.push({ slot, itemData, price, bought });
      }
    }
    equipmentSets = [...equipmentSets];
  }

  function updatePrice(type: string, index: number, price: number) {
    const key = `${type}-${index}`;
    equipmentPrices[key] = price;
    equipmentPrices = { ...equipmentPrices };
    updateEquipmentSlot(key, price, undefined);
  }

  function getPrice(type: string, index: number): number {
    return equipmentPrices[`${type}-${index}`] || 0;
  }

  function toggleBought(type: string, index: number) {
    const key = `${type}-${index}`;
    equipmentBought[key] = !equipmentBought[key];
    equipmentBought = { ...equipmentBought };
    updateEquipmentSlot(key, undefined, equipmentBought[key]);
  }

  function isBought(type: string, index: number): boolean {
    return equipmentBought[`${type}-${index}`] || false;
  }

  // Total des équipements non achetés (pour les sets avec includeInObjective = true)
  const totalUnboughtEquipment = $derived(() => {
    let total = 0;
    for (const set of equipmentSets) {
      if (set.includeInObjective) {
        for (const eq of set.equipments) {
          if (!eq.bought) {
            total += eq.price || 0;
          }
        }
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

  // Total des équipements achetés uniquement (pour les sets avec includeInObjective = true)
  const totalBoughtEquipment = $derived(() => {
    let total = 0;
    for (const set of equipmentSets) {
      if (set.includeInObjective) {
        for (const eq of set.equipments) {
          if (eq.bought) {
            total += eq.price || 0;
          }
        }
      }
    }
    return total;
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
      equippedItems = { ...equippedItems };
      saveEquipmentSlot(key, selectedItem);
      slotDialogOpen = false;
    }
  }

  function removeEquipItem(type: string, index: number) {
    const key = `${type}-${index}`;
    delete equippedItems[key];
    equippedItems = { ...equippedItems };
    delete equipmentPrices[key];
    equipmentPrices = { ...equipmentPrices };
    delete equipmentBought[key];
    equipmentBought = { ...equipmentBought };
    saveEquipmentSlot(key, null);
  }

  // Vendre un équipement (créer un item dans l'hôtel de vente)
  async function sellEquipment(type: string, index: number) {
    const key = `${type}-${index}`;
    const item = equippedItems[key];
    const price = equipmentPrices[key] || 0;

    if (!item || price <= 0) return;

    const formData = new FormData();
    formData.append('nom', item.name?.fr || item.name || 'Item inconnu');
    formData.append('category', 'equipement');
    formData.append('size', '1');
    formData.append('unit', '1');
    formData.append('prixAchat', price.toString());
    formData.append('prixVente', '0');
    formData.append('statusVente', 'false');
    formData.append('imageUrl', item.img || '');
    formData.append('type', item.type?.name?.fr || '');
    formData.append('superType', item.superType?.name?.fr || '');

    try {
      const response = await fetch('?/createItem', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Rafraîchir les données
        await invalidateAll();
      }
    } catch (e) {
      console.error('Erreur lors de la mise en vente:', e);
    }
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

  // Import depuis DofusBook
  async function importFromDofusBook() {
    if (!importUrl.trim()) return;

    importLoading = true;
    importError = '';
    importNotFound = [];

    try {
      const response = await fetch('/api/import-dofusbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      // Stocker les items non trouvés
      if (data.notFound && data.notFound.length > 0) {
        importNotFound = data.notFound;
      }

      if (data.items && data.items.length > 0) {
        // Mapper les items aux slots
        // Ordre: left 0-4, right 0-4, bottom 0-5
        const slots = [
          ...Array(5).fill(null).map((_, i) => ({ type: 'left', index: i })),
          ...Array(5).fill(null).map((_, i) => ({ type: 'right', index: i })),
          ...Array(6).fill(null).map((_, i) => ({ type: 'bottom', index: i }))
        ];

        if (!activeSetId) return;

        // Vider les équipements existants du set actif (en DB)
        await fetch('/api/equipment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId: activeSetId })
        });

        // Vider localement
        equippedItems = {};
        equipmentPrices = {};
        equipmentBought = {};

        // Assigner les items aux slots et sauvegarder en DB
        for (let index = 0; index < data.items.length && index < slots.length; index++) {
          const item = data.items[index];
          const slot = slots[index];
          const key = `${slot.type}-${slot.index}`;
          equippedItems[key] = item;
          await saveEquipmentSlot(key, item, 0, false);
        }

        equippedItems = { ...equippedItems };

        // Recharger les sets pour mettre à jour les totaux
        await loadEquipmentSets();

        // Fermer seulement si tous les items ont été trouvés
        if (importNotFound.length === 0) {
          showImportDialog = false;
          importUrl = '';
        }
      }
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Erreur inconnue';
    } finally {
      importLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Otomaï - Ventes</title>
</svelte:head>

<div class="flex w-full flex-col gap-2">
  
  <Tabs.Root value="hotel" class="w-full">
    <div class="w-full justify-center flex flex-row">
      <Tabs.List class="grid grid-cols-4">
        <Tabs.Trigger value="hotel">Hôtel de Vente</Tabs.Trigger>
        <Tabs.Trigger value="equipement">Equipement</Tabs.Trigger>
        <Tabs.Trigger value="recettes">Recettes</Tabs.Trigger>
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
        <!-- Onglets des sets d'équipement -->
        <div class="flex items-center gap-2 flex-wrap justify-center">
          {#each equipmentSets as set}
            <div class="flex items-center gap-1">
              <button
                type="button"
                onclick={() => switchSet(set.id)}
                ondblclick={() => openRenameDialog(set.id, set.name)}
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors {activeSetId === set.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
              >
                {set.name}
              </button>
              <button
                type="button"
                onclick={() => toggleSetObjective(set.id)}
                class="size-5 rounded flex items-center justify-center {set.includeInObjective ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}"
                title={set.includeInObjective ? 'Inclus dans l\'objectif' : 'Non inclus dans l\'objectif'}
              >
                <Check class="size-3" />
              </button>
              {#if equipmentSets.length > 1}
                <button
                  type="button"
                  onclick={() => deleteSet(set.id)}
                  class="size-5 rounded flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  title="Supprimer ce set"
                >
                  <Trash2 class="size-3" />
                </button>
              {/if}
            </div>
          {/each}
          <Button variant="outline" size="sm" onclick={createNewSet} class="h-7">
            <Plus class="size-4" />
          </Button>
        </div>

        <!-- Header avec Total et bouton Import -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-lg font-bold">
            Total: {formatNumber(totalEquipmentPrice())}
            <img class="size-5" src="/Kama.png" alt="Kama">
          </div>
          <Button variant="outline" size="sm" onclick={() => showImportDialog = true}>
            <Download class="size-4 mr-2" />
            Importer
          </Button>
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
                <button
                  type="button"
                  onclick={() => item && sellEquipment('left', i)}
                  class="size-6 rounded-md flex items-center justify-center transition-colors {item && isBought('left', i) && getPrice('left', i) > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'invisible'}"
                  title="Mettre en vente"
                >
                  <DollarSign class="size-4" />
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
                  onclick={() => item && sellEquipment('right', i)}
                  class="size-6 rounded-md flex items-center justify-center transition-colors {item && isBought('right', i) && getPrice('right', i) > 0 ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'invisible'}"
                  title="Mettre en vente"
                >
                  <DollarSign class="size-4" />
                </button>
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
                <div class="flex gap-1">
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
                  {#if isBought('bottom', i) && getPrice('bottom', i) > 0}
                    <button
                      type="button"
                      onclick={() => sellEquipment('bottom', i)}
                      class="size-6 rounded-md flex items-center justify-center transition-colors bg-amber-500 hover:bg-amber-600 text-white"
                      title="Mettre en vente"
                    >
                      <DollarSign class="size-4" />
                    </button>
                  {/if}
                </div>
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

    <!-- Dialog pour importer depuis DofusBook -->
    <Dialog.Root bind:open={showImportDialog}>
      <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
          <Dialog.Title>Importer depuis DofusBook</Dialog.Title>
          <Dialog.Description>
            Collez un lien DofusBook (d-bk.net ou dofusbook.net) pour importer tous les équipements
          </Dialog.Description>
        </Dialog.Header>
        <div class="py-4 space-y-4">
          <div class="grid gap-2">
            <Label for="dofusbook-url">Lien DofusBook</Label>
            <Input
              id="dofusbook-url"
              type="text"
              bind:value={importUrl}
              placeholder="https://d-bk.net/fr/d/xxxxx"
              disabled={importLoading}
            />
          </div>
          {#if importError}
            <p class="text-sm text-destructive">{importError}</p>
          {/if}
          {#if importNotFound.length > 0}
            <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p class="text-sm font-medium text-amber-600 mb-2">⚠️ {importNotFound.length} item(s) non trouvé(s) sur DofusDB :</p>
              <ul class="text-sm text-amber-600/80 list-disc list-inside">
                {#each importNotFound as itemName}
                  <li>{itemName}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
        <Dialog.Footer>
          <Button variant="outline" onclick={() => { showImportDialog = false; importError = ''; importNotFound = []; importUrl = ''; }} disabled={importLoading}>
            {importNotFound.length > 0 ? 'Fermer' : 'Annuler'}
          </Button>
          {#if importNotFound.length === 0}
            <Button onclick={importFromDofusBook} disabled={importLoading || !importUrl.trim()}>
              {#if importLoading}
                <Loader2 class="size-4 mr-2 animate-spin" />
                Import en cours...
              {:else}
                Importer
              {/if}
            </Button>
          {/if}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <!-- Onglet Recettes -->
    <Tabs.Content value="recettes" class="py-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Colonne gauche : Recherche par nom -->
        <div class="space-y-4">
          <div class="rounded-lg border bg-card p-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <ChefHat class="size-5" />
              Recette d'un item
            </h3>
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <SearchInput
                  placeholder="Nom de l'item..."
                  bind:value={recipeSearch}
                  bind:selectedItem={recipeSelectedItem}
                />
              </div>
              {#if recipeLoading}
                <Loader2 class="size-5 animate-spin text-muted-foreground" />
              {/if}
            </div>
          </div>

          {#if recipeError}
            <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p class="text-sm text-destructive">{recipeError}</p>
            </div>
          {/if}

          {#if recipeResult}
            <div class="rounded-lg border bg-card p-6">
              <div class="flex items-center gap-4 mb-6 pb-4 border-b">
                {#if recipeResult.item.img}
                  <img src={recipeResult.item.img} alt={recipeResult.item.name} class="size-16 object-contain" />
                {/if}
                <div>
                  <h4 class="text-xl font-bold">{recipeResult.item.name}</h4>
                  {#if recipeResult.recipe?.job}
                    <p class="text-sm text-muted-foreground">Métier : {recipeResult.recipe.job}</p>
                  {/if}
                </div>
              </div>

              {#if recipeResult.hasRecipe && recipeResult.recipe}
                <h5 class="font-semibold mb-3">Ingrédients</h5>
                <div class="space-y-2">
                  {#each recipeResult.recipe.ingredients as ingredient}
                    <div class="flex items-center gap-3 p-2 rounded-lg bg-muted">
                      {#if ingredient.img}
                        <img src={ingredient.img} alt={ingredient.name} class="size-10 object-contain" />
                      {/if}
                      <div class="flex-1">
                        <span class="font-medium">{ingredient.name}</span>
                        {#if ingredient.type}
                          <span class="text-xs text-muted-foreground ml-2">({ingredient.type})</span>
                        {/if}
                      </div>
                      <span class="font-bold text-lg">x{ingredient.quantity}</span>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-center text-muted-foreground py-4">{recipeResult.message}</p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Colonne droite : Scanner de chat -->
        <div class="space-y-4">
          <div class="rounded-lg border bg-card p-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <PackageSearch class="size-5" />
              Scanner de chat
            </h3>
            <p class="text-sm text-muted-foreground mb-3">Collez le log du chat Dofus</p>
            <textarea
              bind:value={chatText}
              placeholder={"[12:06] 1 x [Barbe inexistante du Barbroussa] (150 kamas)\n[12:07] 1 x [Substrat de Fascine] (3 081 kamas)\n[12:08] Vous avez créé 1 × [Chapeau Terrdala] !"}
              rows="8"
              class="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            ></textarea>
            <Button class="w-full mt-3" onclick={parseChatLog} disabled={chatLoading || chatText.trim().length < 5}>
              {#if chatLoading}
                <Loader2 class="size-4 mr-2 animate-spin" />
                Analyse...
              {:else}
                <Search class="size-4 mr-2" />
                Analyser
              {/if}
            </Button>
          </div>

          {#if chatCrafts.length > 0}
            <!-- Total global -->
            <div class="rounded-lg border bg-card p-4 flex items-center justify-between">
              <span class="font-semibold">Coût total des crafts</span>
              <div class="flex items-center gap-1 font-bold text-red-500">
                -{formatNumber(chatTotalCost)}
                <img class="size-4" src="/Kama.png" alt="Kama">
              </div>
            </div>

            <!-- Détail par craft -->
            {#each chatCrafts as craft}
              <div class="rounded-lg border bg-card p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-emerald-600">{craft.name}</span>
                    {#if craft.quantity > 1}
                      <span class="text-sm text-muted-foreground">x{craft.quantity}</span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-1 font-bold text-red-500 text-sm">
                    -{formatNumber(craft.totalCost)}
                    <img class="size-3.5" src="/Kama.png" alt="Kama">
                  </div>
                </div>

                {#if craft.ingredients.length > 0}
                  <div class="space-y-1">
                    {#each craft.ingredients as ing}
                      <div class="flex items-center justify-between p-1.5 rounded bg-muted text-sm">
                        <div class="flex items-center gap-2">
                          <span class={ing.inPile ? 'font-medium' : 'font-medium text-muted-foreground'}>{ing.name}</span>
                          <span class="text-xs text-muted-foreground">
                            {ing.consumed}/{ing.needed}
                          </span>
                          {#if !ing.inPile}
                            <span class="text-xs text-amber-500">hors pile</span>
                          {:else if ing.consumed < ing.needed}
                            <span class="text-xs text-amber-500">partiel</span>
                          {/if}
                        </div>
                        <span class="font-bold flex items-center gap-1 text-xs">
                          {formatNumber(ing.cost)}
                          <img class="size-3" src="/Kama.png" alt="Kama">
                        </span>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-xs text-muted-foreground">Recette non trouvée</p>
                {/if}
              </div>
            {/each}
          {/if}

          {#if chatRemainingPile.length > 0}
            <div class="rounded-lg border border-dashed bg-card p-4">
              <h4 class="font-semibold mb-2 text-sm text-muted-foreground">Ressources restantes dans la pile</h4>
              <div class="space-y-1">
                {#each chatRemainingPile as resource}
                  <div class="flex items-center justify-between p-1.5 rounded bg-muted text-sm">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{resource.name}</span>
                      <span class="text-muted-foreground">x{resource.quantity}</span>
                    </div>
                    <span class="font-bold flex items-center gap-1 text-xs">
                      {formatNumber(resource.totalPrice)}
                      <img class="size-3" src="/Kama.png" alt="Kama">
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </Tabs.Content>

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

  <!-- Dialog pour renommer un set -->
  <Dialog.Root bind:open={showRenameDialog}>
    <Dialog.Content class="sm:max-w-[400px]">
      <Dialog.Header>
        <Dialog.Title>Renommer l'équipement</Dialog.Title>
      </Dialog.Header>
      <div class="py-4">
        <Input
          type="text"
          bind:value={renameValue}
          placeholder="Nom de l'équipement"
        />
      </div>
      <Dialog.Footer>
        <Button variant="outline" onclick={() => { showRenameDialog = false; renameSetId = null; }}>
          Annuler
        </Button>
        <Button onclick={renameSet}>
          Renommer
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>
