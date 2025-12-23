import prisma from "$lib/server/prisma.js"; // Notre client Prisma
import { fail } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "desc" }, // Les plus récents en premier
  });

  return {
    user: locals.user,
    items,
  };
};
