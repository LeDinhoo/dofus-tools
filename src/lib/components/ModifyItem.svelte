<script lang="ts">
  import { MediaQuery } from "svelte/reactivity";
  import { enhance } from "$app/forms";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { toast } from "svelte-sonner";

  // On reçoit l'objet complet
  let { item, open = $bindable(false) } = $props();

  const isDesktop = new MediaQuery("(min-width: 768px)");
  let prixAchat = $derived(item?.prixAchat);
  let prixVente = $derived(item?.prixVente ?? 0);
  let imageUrl = $derived(item?.imageUrl ?? "");
  let type = $derived(item?.type ?? "");
  let superType = $derived(item?.superType ?? "");
  let size = $derived(item?.size); // Peut être null/undefined
  let unit = $derived(item?.unit); // Peut être null/undefined
  let benefit = $derived((prixVente || 0) - (prixAchat || 0));
</script>

{#snippet formContent()}
  <div class="grid gap-6 px-4 md:px-0">
    <form
      method="POST"
      action="?/updateItem"
      class="grid items-start gap-4"
      use:enhance={() => {
        return async ({ result, update }) => {
          // 1. Applique la mise à jour des données (rafraîchit la liste)
          await update();

          // 2. Si c'est un succès, ferme le modal
          if (result.type === "success") {
            // Exemple: variable pour fermer ton modal
            open = false;
            toast.success("Item modifié !");
          }
        };
      }}
    >
      <Input type="hidden" name="id" value={item.id} />

      <div class="grid gap-2">
        <Label for="nom-{item.id}">Nom</Label>
        <Input id="nom-{item.id}" name="nom" value={item.nom} required />
      </div>

      <div class="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border">
        <div class="grid gap-2">
          <Label for="pa-{item.id}">Achat (€)</Label>
          <Input
            type="number"
            step="0.01"
            id="pa-{item.id}"
            name="prixAchat"
            bind:value={prixAchat}
            required
          />
        </div>
        <div class="grid gap-2">
          <Label for="pv-{item.id}">Vente (€)</Label>
          <Input
            type="number"
            step="0.01"
            id="pv-{item.id}"
            name="prixVente"
            bind:value={prixVente}
          />
        </div>
      </div>

      <div class="flex items-center justify-between mt-1">
        <span class="text-sm text-muted-foreground">
          Bénéfice :
          <span
            class={benefit >= 0
              ? "text-emerald-600 font-bold"
              : "text-destructive font-bold"}
          >
            {benefit.toFixed(2)} €
          </span>
        </span>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>

    {#if item.statusVente}
      <div class="border-t pt-4">
        <h4 class="mb-3 text-sm font-medium text-destructive">
          Zone de danger
        </h4>
        <form
          method="POST"
          action="?/unsellItem"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") open = false;
            };
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <Button variant="secondary" type="submit" class="w-full">
            Annuler la vente (Restock)
          </Button>
        </form>
      </div>
    {/if}
  </div>
{/snippet}

{#if isDesktop.current}
  <Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
      <Dialog.Header>
        <Dialog.Title>Modifier : {item.nom}</Dialog.Title>
        <Dialog.Description>
          Modifiez les informations de l'article.
        </Dialog.Description>
      </Dialog.Header>
      {@render formContent()}
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root bind:open>
    <Drawer.Content class="max-h-[90vh]">
      <Drawer.Header class="text-start">
        <Drawer.Title>Modifier : {item.nom}</Drawer.Title>
        <Drawer.Description>
          Modifiez les informations de l'article.
        </Drawer.Description>
      </Drawer.Header>
      <div class="overflow-y-auto px-4 pb-4">
        {@render formContent()}
      </div>
      <Drawer.Footer class="pt-2">
        <Drawer.Close class={buttonVariants({ variant: "outline" })}>
          Annuler
        </Drawer.Close>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
