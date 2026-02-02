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

  let { data } = $props();

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
  const capitalTotal = $derived(totalDepense + gainReel);
  const itemsVendus = $derived(data.items.filter(item => item.statusVente).length);
  const itemsEnVente = $derived(data.items.filter(item => !item.statusVente).length);
  const tauxReussite = $derived(data.items.length > 0 ? (itemsVendus / data.items.length) * 100 : 0);

  // Utiliser l'objectif personnalisé
  const progressionPourcent = $derived((capitalTotal / objectifMontant) * 100);
  const restantPourObjectif = $derived(objectifMontant - capitalTotal);

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

<div class="flex w-full flex-col gap-4">
  <HeaderItem />

  <Tabs.Root value="hotel" class="w-full">
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="hotel">Hôtel de Vente</Tabs.Trigger>
      <Tabs.Trigger value="stats">Statistiques</Tabs.Trigger>
    </Tabs.List>

    <!-- Onglet Hôtel de Vente -->
    <Tabs.Content value="hotel" class="space-y-4">
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
