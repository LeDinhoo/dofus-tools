<script lang="ts">
  import { Label } from "$lib/components/ui/label/";
  import { Textarea } from "$lib/components/ui/textarea/";
  import { CircleCheck, CircleX } from "@lucide/svelte/icons";
  import Button from "$lib/components/ui/button/button.svelte";

  // --- États Svelte ---
  let leTexte = $state("");
  let isValid = $state(false);
  let totalGeneral = $state(0);

  // --- Props ---
  let { purchasePrice = $bindable(), onValidate } = $props();

  // --- Constantes ---
  // MODIFICATION 1 : Le regex accepte maintenant les espaces dans le prix ([\d\s]+)
  // Ex: (4 992 kamas) sera capturé correctement
  const regex =
    /\[\d{2}:\d{2}\]\s+(\d+)\s+x\s+\[([^\]]+)\]\s+\(([\d\s]+)\s+kamas\)/;

  // --- Fonctions métier ---

  /**
   * Parse le texte brut, calcule le total et vérifie la validité.
   */
  function parsePurchaseText(text: string) {
    // On évite de spammer la console à chaque frappe, on garde juste le résultat final
    // console.clear();

    const lignes = text.split("\n");
    let localTotal = 0;
    let anyLineValid = false;

    for (const ligne of lignes) {
      if (ligne.trim() === "") continue;

      const match = ligne.match(regex);

      if (match) {
        const quantite = parseInt(match[1], 10);
        const nomRessource = match[2];

        // MODIFICATION 2 : On nettoie le prix (on enlève les espaces) avant de convertir
        // "4 992" devient "4992"
        const rawPrice = match[3].replace(/\s/g, "");
        const prixLotAffiché = parseInt(rawPrice, 10);

        if (!isNaN(quantite) && !isNaN(prixLotAffiché)) {
          // MODIFICATION 3 : Logique Dofus
          // Dans le chat, (XX kamas) correspond au prix TOTAL du lot, pas à l'unité.
          // Donc on ajoute juste le prix affiché, on ne remultiplie pas par la quantité.
          localTotal += prixLotAffiché;

          anyLineValid = true;
        }
      }
    }

    return {
      total: localTotal,
      valid: anyLineValid,
    };
  }

  /**
   * Gère la soumission : met à jour le parent et ferme le dialogue.
   */
  function handleValidation() {
    purchasePrice = totalGeneral;
    if (onValidate) onValidate();
  }

  // --- Réactions (Effects) ---

  $effect(() => {
    if (leTexte.trim() === "") {
      isValid = false;
      totalGeneral = 0;
      return;
    }

    const result = parsePurchaseText(leTexte);
    isValid = result.valid;
    totalGeneral = result.total;
  });
</script>

<div class="grid w-full gap-4">
  <Label for="mon-textarea">Calculateur de prix de craft</Label>

  <Textarea
    id="mon-textarea"
    class="font-mono text-xs"
    placeholder="Collez vos logs de chat ici...
Exemple :
[21:51] 1 x [Substrat de Bosquet] (4 992 kamas)
[21:51] 10 x [Pépite] (4178 kamas)"
    rows={10}
    bind:value={leTexte}
  />

  <div class="flex items-start justify-between gap-2 text-sm">
    {#if leTexte.trim() === ""}
      <p class="text-muted-foreground">En attente de données...</p>
    {:else if isValid}
      <div class="flex flex-col gap-1">
        <div class="flex flex-row items-center gap-2">
          <CircleCheck class="h-4 w-4 text-green-500" />
          <p class="font-medium text-green-600">Données valides</p>
        </div>
        <p class="text-xs text-muted-foreground">
          Le calcul prend en compte les espaces (ex: 4 992)
        </p>
      </div>
    {:else}
      <div class="flex flex-row items-center gap-2">
        <CircleX class="h-4 w-4 text-red-500" />
        <p class="text-red-600">
          Format non reconnu. Vérifiez le copier-coller.
        </p>
      </div>
    {/if}

    <div class="flex flex-col items-end">
      <span
        class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
        >Total estimé</span
      >
      <div
        class="flex flex-row items-center justify-center gap-1 text-xl font-bold text-foreground"
      >
        {new Intl.NumberFormat("fr-FR").format(totalGeneral)}
        <!-- Placeholder image pour l'icone Kama si elle n'existe pas -->
        <span class="text-yellow-600">K</span>
      </div>
    </div>
  </div>

  <Button
    variant="default"
    class="w-full self-end sm:w-auto"
    onclick={handleValidation}
    disabled={!isValid}
  >
    Valider ce montant
  </Button>
</div>
