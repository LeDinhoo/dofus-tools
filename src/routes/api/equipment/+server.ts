import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { auth } from '$lib/server/auth';

// GET - Récupérer tous les équipements de l'utilisateur
export const GET: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const equipments = await prisma.equipment.findMany({
    where: { userId: session.user.id },
  });

  // Transformer en format attendu par le frontend
  const equippedItems: Record<string, any> = {};
  const equipmentPrices: Record<string, number> = {};
  const equipmentBought: Record<string, boolean> = {};

  for (const eq of equipments) {
    equippedItems[eq.slot] = eq.itemData;
    equipmentPrices[eq.slot] = eq.price;
    equipmentBought[eq.slot] = eq.bought;
  }

  return json({ equippedItems, equipmentPrices, equipmentBought });
};

// POST - Sauvegarder/mettre à jour un équipement
export const POST: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { slot, itemData, price, bought } = await request.json();

  if (!slot) {
    return json({ error: 'Slot requis' }, { status: 400 });
  }

  // Si itemData est null, supprimer l'équipement
  if (itemData === null) {
    await prisma.equipment.deleteMany({
      where: { userId: session.user.id, slot },
    });
    return json({ success: true });
  }

  // Upsert l'équipement
  await prisma.equipment.upsert({
    where: {
      userId_slot: { userId: session.user.id, slot },
    },
    update: {
      itemData,
      price: price ?? 0,
      bought: bought ?? false,
    },
    create: {
      userId: session.user.id,
      slot,
      itemData,
      price: price ?? 0,
      bought: bought ?? false,
    },
  });

  return json({ success: true });
};

// PUT - Mise à jour partielle (prix ou statut acheté)
export const PUT: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { slot, price, bought } = await request.json();

  if (!slot) {
    return json({ error: 'Slot requis' }, { status: 400 });
  }

  const updateData: any = {};
  if (price !== undefined) updateData.price = price;
  if (bought !== undefined) updateData.bought = bought;

  await prisma.equipment.updateMany({
    where: { userId: session.user.id, slot },
    data: updateData,
  });

  return json({ success: true });
};

// DELETE - Supprimer tous les équipements (pour réimport)
export const DELETE: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  await prisma.equipment.deleteMany({
    where: { userId: session.user.id },
  });

  return json({ success: true });
};
