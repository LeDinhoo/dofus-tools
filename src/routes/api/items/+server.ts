import { json } from "@sveltejs/kit";
import prisma from "$lib/server/prisma";
import type { RequestHandler } from "./$types";

// GET: Récupérer tous les items
export const GET: RequestHandler = async () => {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return json(items);
  } catch (error) {
    console.error("Erreur GET items:", error);
    return json(
      { error: "Erreur serveur lors de la récupération" },
      { status: 500 }
    );
  }
};

// POST: Créer un item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Validation minimale
    if (!body.nom || body.prixAchat === undefined) {
      return json(
        { error: "Champs requis manquants: nom, prixAchat" },
        { status: 400 }
      );
    }

    // Calcul du bénéfice si non fourni
    const prixAchat = Number(body.prixAchat);
    const prixVente = body.prixVente ? Number(body.prixVente) : 0;
    const benefit =
      body.benefit !== undefined ? Number(body.benefit) : prixVente - prixAchat;

    const newItem = await prisma.item.create({
      data: {
        nom: body.nom,
        prixAchat: prixAchat,
        prixVente: prixVente,
        benefit: benefit,
        statusVente: body.statusVente ?? false,
        category: body.category ?? "general",
        imageUrl: body.imageUrl,
        type: body.type,
        superType: body.superType,
        unit: body.unit ? Number(body.unit) : null,
        size: body.size ? Number(body.size) : null,
      },
    });

    return json(newItem, { status: 201 });
  } catch (error) {
    console.error("Erreur POST item:", error);
    return json(
      { error: "Erreur lors de la création de l'item" },
      { status: 500 }
    );
  }
};
