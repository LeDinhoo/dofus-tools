import { json } from "@sveltejs/kit";
import prisma from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

// PATCH: Mettre à jour un item
export const PATCH: RequestHandler = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) return json({ error: "ID invalide" }, { status: 400 });

  try {
    const body = await request.json();

    // Si on modifie les prix, on doit peut-être recalculer le bénéfice
    // On récupère d'abord l'ancien item pour avoir les valeurs manquantes
    let dataToUpdate: any = { ...body };

    if (body.prixAchat !== undefined || body.prixVente !== undefined) {
      const currentItem = await prisma.item.findUnique({ where: { id } });

      if (currentItem) {
        const nouveauPrixAchat =
          body.prixAchat !== undefined
            ? Number(body.prixAchat)
            : currentItem.prixAchat;
        const nouveauPrixVente =
          body.prixVente !== undefined
            ? Number(body.prixVente)
            : currentItem.prixVente || 0;

        // On met à jour le bénéfice automatiquement
        dataToUpdate.benefit = nouveauPrixVente - nouveauPrixAchat;
      }
    }

    // Nettoyage des types numériques
    if (dataToUpdate.prixAchat)
      dataToUpdate.prixAchat = Number(dataToUpdate.prixAchat);
    if (dataToUpdate.prixVente)
      dataToUpdate.prixVente = Number(dataToUpdate.prixVente);
    if (dataToUpdate.unit) dataToUpdate.unit = Number(dataToUpdate.unit);
    if (dataToUpdate.size) dataToUpdate.size = Number(dataToUpdate.size);

    const updatedItem = await prisma.item.update({
      where: { id },
      data: dataToUpdate,
    });

    return json(updatedItem);
  } catch (error) {
    console.error("Erreur PATCH item:", error);
    return json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
};

// DELETE: Supprimer un item
export const DELETE: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) return json({ error: "ID invalide" }, { status: 400 });

  try {
    await prisma.item.delete({
      where: { id },
    });
    return json({ success: true, message: "Item supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE item:", error);
    return json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
};
