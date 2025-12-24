import prisma from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import { toast } from "svelte-sonner";

export const load = async () => {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
  });
  const form = await superValidate(zod4(itemSchema));
  return { items, form };
};

// Schéma de validation Zod pour un item
const itemSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  category: z.string().min(1),
  size: z.number(),
  unit: z.number(),
  prixAchat: z.number(),
  prixVente: z.number().default(0),
  statusVente: z.boolean().default(false),
  imageUrl: z.string().optional(),
  type: z.string().optional(),
  superType: z.string().optional(),
});

export const actions = {
  createItem: async ({ request }) => {
    const form = await superValidate(request, zod4(itemSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const benefit = form.data.prixVente - form.data.prixAchat;

    try {
      await prisma.item.create({
        data: {
          ...form.data,
          benefit,
        },
      });
    } catch (err) {
      return toast.error("Erreur lors de la création de l'item");
    }

    return { form };
  },

  // 1. AJOUTER CETTE NOUVELLE ACTION
  deleteItem: async ({ request }) => {
    const data = await request.formData();
    const idStr = data.get("id") as string;

    if (!idStr) {
      return fail(400, { message: "ID manquant pour la suppression" });
    }

    try {
      // 2. On convertit l'ID en nombre
      const id = parseInt(idStr, 10);

      // 3. On appelle Prisma pour supprimer l'item
      await prisma.item.delete({
        where: { id: id },
      });
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      return fail(500, { message: "Impossible de supprimer l'item" });
    }

    // 4. Succès ! SvelteKit va rafraîchir les données de la page.
    return { success: true };
  },

  // 1. AJOUTE CETTE NOUVELLE ACTION
  sellItem: async ({ request }) => {
    const data = await request.formData();
    const idStr = data.get("id") as string;

    if (!idStr) return fail(400, { message: "ID manquant" });

    try {
      await prisma.item.update({
        where: { id: parseInt(idStr) },
        data: { statusVente: true }, // On passe le statut à Vrai
      });
    } catch (err) {
      return fail(500, { message: "Erreur lors de la vente" });
    }

    return { success: true };
  },

  // --- AJOUTE CETTE NOUVELLE ACTION ---
  unsellItem: async ({ request }) => {
    const data = await request.formData();
    const idStr = data.get("id") as string;

    if (!idStr) return fail(400, { message: "ID manquant" });

    try {
      await prisma.item.update({
        where: { id: parseInt(idStr) },
        data: { statusVente: false }, // On repasse le statut à FAUX
      });
    } catch (err) {
      return fail(500, { message: "Erreur lors de la réinitialisation" });
    }

    return { success: true };
  },

  updateItem: async ({ request }) => {
    const data = await request.formData();

    console.log(
      "Données reçues pour la mise à jour :",
      Array.from(data.entries())
    );

    // 1. Récupération et conversion des données
    const idStr = data.get("id") as string;
    const nom = data.get("nom") as string;
    const prixAchatStr = data.get("prixAchat") as string;
    const prixVenteStr = data.get("prixVente") as string;

    // Validation basique
    if (!idStr || !nom || !prixAchatStr || !prixVenteStr) {
      return fail(400, {
        message: "Tous les champs (ID, Nom, Prix) sont requis",
      });
    }

    try {
      const id = parseInt(idStr, 10);
      const prixAchat = parseFloat(prixAchatStr);
      const prixVente = parseFloat(prixVenteStr);

      // 2. Recalcul du bénéfice
      const benefit = prixVente - prixAchat;

      // 3. Mise à jour Prisma
      await prisma.item.update({
        where: { id: id },
        data: {
          nom,
          prixAchat,
          prixVente,
          benefit, // On sauvegarde le nouveau bénéfice calculé
        },
      });
    } catch (err) {
      console.error("Erreur update:", err);
      return fail(500, { message: "Erreur lors de la modification de l'item" });
    }

    return { success: true };
  },
};
