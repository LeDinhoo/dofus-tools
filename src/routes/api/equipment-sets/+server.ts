import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { auth } from '$lib/server/auth';

// GET - Récupérer tous les sets de l'utilisateur avec leurs équipements
export const GET: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const sets = await prisma.equipmentSet.findMany({
    where: { userId: session.user.id },
    include: { equipments: true },
    orderBy: { createdAt: 'asc' },
  });

  // Si aucun set, en créer un par défaut
  if (sets.length === 0) {
    const defaultSet = await prisma.equipmentSet.create({
      data: {
        userId: session.user.id,
        name: 'Équipement 1',
        includeInObjective: true,
      },
      include: { equipments: true },
    });
    return json({ sets: [defaultSet] });
  }

  return json({ sets });
};

// POST - Créer un nouveau set
export const POST: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { name } = await request.json();

  const set = await prisma.equipmentSet.create({
    data: {
      userId: session.user.id,
      name: name || 'Nouvel équipement',
      includeInObjective: true,
    },
    include: { equipments: true },
  });

  return json({ set });
};

// PUT - Mettre à jour un set (nom, includeInObjective)
export const PUT: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { setId, name, includeInObjective } = await request.json();

  if (!setId) {
    return json({ error: 'setId requis' }, { status: 400 });
  }

  // Vérifier que le set appartient à l'utilisateur
  const existingSet = await prisma.equipmentSet.findFirst({
    where: { id: setId, userId: session.user.id },
  });

  if (!existingSet) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (includeInObjective !== undefined) updateData.includeInObjective = includeInObjective;

  const set = await prisma.equipmentSet.update({
    where: { id: setId },
    data: updateData,
    include: { equipments: true },
  });

  return json({ set });
};

// DELETE - Supprimer un set
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
  const existingSet = await prisma.equipmentSet.findFirst({
    where: { id: setId, userId: session.user.id },
  });

  if (!existingSet) {
    return json({ error: 'Set non trouvé' }, { status: 404 });
  }

  // Vérifier qu'il reste au moins un set
  const count = await prisma.equipmentSet.count({
    where: { userId: session.user.id },
  });

  if (count <= 1) {
    return json({ error: 'Impossible de supprimer le dernier set' }, { status: 400 });
  }

  await prisma.equipmentSet.delete({
    where: { id: setId },
  });

  return json({ success: true });
};
