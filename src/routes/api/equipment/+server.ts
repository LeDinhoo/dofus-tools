import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { auth } from '$lib/server/auth';

// GET - Récupérer les équipements d'un set spécifique
export const GET: RequestHandler = async ({ request, url }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const setId = url.searchParams.get('setId');

  if (!setId) {
    return json({ error: 'setId requis' }, { status: 400 });
  }

  // Vérifier que le set appartient à l'utilisateur
  const set = await prisma.equipmentSet.findFirst({
    where: { id: parseInt(setId), userId: session.user.id },
    include: { equipments: true },
  });

  if (!set) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  // Transformer en format attendu par le frontend
  const equippedItems: Record<string, any> = {};
  const equipmentPrices: Record<string, number> = {};
  const equipmentBought: Record<string, boolean> = {};

  for (const eq of set.equipments) {
    equippedItems[eq.slot] = eq.itemData;
    equipmentPrices[eq.slot] = eq.price;
    equipmentBought[eq.slot] = eq.bought;
  }

  return json({ equippedItems, equipmentPrices, equipmentBought });
};

// POST - Sauvegarder/mettre à jour un équipement dans un set
export const POST: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { setId, slot, itemData, price, bought } = await request.json();

  if (!setId || !slot) {
    return json({ error: 'setId et slot requis' }, { status: 400 });
  }

  // Vérifier que le set appartient à l'utilisateur
  const set = await prisma.equipmentSet.findFirst({
    where: { id: setId, userId: session.user.id },
  });

  if (!set) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  // Si itemData est null, supprimer l'équipement
  if (itemData === null) {
    await prisma.equipment.deleteMany({
      where: { setId, slot },
    });
    return json({ success: true });
  }

  // Upsert l'équipement
  await prisma.equipment.upsert({
    where: {
      setId_slot: { setId, slot },
    },
    update: {
      itemData,
      price: price ?? 0,
      bought: bought ?? false,
    },
    create: {
      setId,
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

  const { setId, slot, price, bought } = await request.json();

  if (!setId || !slot) {
    return json({ error: 'setId et slot requis' }, { status: 400 });
  }

  // Vérifier que le set appartient à l'utilisateur
  const set = await prisma.equipmentSet.findFirst({
    where: { id: setId, userId: session.user.id },
  });

  if (!set) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  const updateData: any = {};
  if (price !== undefined) updateData.price = price;
  if (bought !== undefined) updateData.bought = bought;

  await prisma.equipment.updateMany({
    where: { setId, slot },
    data: updateData,
  });

  return json({ success: true });
};

// DELETE - Supprimer tous les équipements d'un set
export const DELETE: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { setId } = await request.json();

  if (!setId) {
    return json({ error: 'setId requis' }, { status: 400 });
  }

  // Vérifier que le set appartient à l'utilisateur
  const set = await prisma.equipmentSet.findFirst({
    where: { id: setId, userId: session.user.id },
  });

  if (!set) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  await prisma.equipment.deleteMany({
    where: { setId },
  });

  return json({ success: true });
};
