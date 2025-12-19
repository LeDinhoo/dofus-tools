import prisma from "$lib/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  // On récupère tous les todos triés par date
  const todos = await prisma.todo.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    todos,
  };
};
