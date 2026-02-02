import { auth } from "../src/lib/server/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

// Premier handle : Better Auth peuple event.locals
const authHandle: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building });
};

// Deuxième handle : Protection des routes
const protectionHandle: Handle = async ({ event, resolve }) => {
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

  return resolve(event);
};

// Enchaîne les deux handles
export const handle = sequence(authHandle, protectionHandle);
