import { auth } from "../src/lib/server/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // D'abord, on laisse Better Auth gérer l'authentification et peupler event.locals
  const response = await svelteKitHandler({ event, resolve, auth, building });

  // Protection des routes (sauf pendant le build)
  if (!building) {
    const session = event.locals.session;
    const pathname = event.url.pathname;

    // Routes publiques (pas besoin d'être connecté)
    const publicRoutes = ['/login', '/api'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!session && !isPublicRoute) {
      throw redirect(303, '/login');
    }

    // Si l'utilisateur est connecté et va sur /login, rediriger vers la page d'accueil
    if (session && pathname === '/login') {
      throw redirect(303, '/');
    }
  }

  return response;
}
