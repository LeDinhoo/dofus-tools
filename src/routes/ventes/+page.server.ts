import prisma from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { Actions } from "@sveltejs/kit";
import { parse } from "svelte/compiler";

export const load = async () => {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { items };
};

export const actions: Actions = {
  createItem: async ({ request }) => {
    const data = await request.formData();

    console.log(
      "Données du formulaire reçues:",
      Object.fromEntries(data.entries())
    );

    const nom = data.get("nom") as string;
    const category = data.get("category") as string;
    const size = parseFloat(data.get("size") as string);
    const unit = parseFloat(data.get("unit") as string);
    const prixAchatStr = data.get("prixAchat") as string;
    // Si prix de vente est vide, on le met à 0
    const prixVenteStr = (data.get("prixVente") as string) || "0";
    const statusVente =
      (data.get("statusVente") as string) === "true" ? true : false;
    const benefit = parseFloat(prixVenteStr) - parseFloat(prixAchatStr);
    const imageUrl = data.get("imageUrl") as string | null;
    const type = data.get("type") as string | null;
    const superType = data.get("superType") as string | null;

    if (!nom || !category || !prixAchatStr) {
      return fail(400, { message: "Tous les champs sont requis" });
    }

    const prixAchat = parseFloat(prixAchatStr);
    const prixVente = parseFloat(prixVenteStr);

    if (isNaN(prixAchat)) {
      return fail(400, { message: "Les prix doivent être des nombres" });
    }

    console.log("Création de l'item avec:", {
      nom,
      prixAchat,
      prixVente,
      statusVente,
      benefit,
    });

    try {
      await prisma.item.create({
        data: {
          nom,
          category,
          unit,
          size,
          prixAchat,
          prixVente,
          statusVente,
          benefit,
          imageUrl,
          type,
          superType,
        },
      });
    } catch (err) {
      console.error("L'ERREUR PRISMA EST :", err);

      return fail(500, { message: "Erreur lors de la création de l'item" });
    }

    return { success: true };
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
};
