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
    const user = event.locals.user;
    const pathname = event.url.pathname;

    // Debug logs
    console.log('Protection check:', {
      pathname,
      hasSession: !!session,
      hasUser: !!user,
      sessionData: session ? 'exists' : 'null',
      userData: user ? 'exists' : 'null'
    });

    // Routes publiques (pas besoin d'être connecté)
    const publicRoutes = ['/login', '/api'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Vérifier si l'utilisateur est connecté (session OU user)
    const isAuthenticated = !!(session || user);

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!isAuthenticated && !isPublicRoute) {
      console.log('Redirecting to login - no auth');
      throw redirect(303, '/login');
    }

    // Si l'utilisateur est connecté et va sur /login, rediriger vers la page d'accueil
    if (isAuthenticated && pathname === '/login') {
      console.log('Redirecting to home - already authenticated');
      throw redirect(303, '/');
    }
  }

  return resolve(event);
};

// Enchaîne les deux handles
export const handle = sequence(authHandle, protectionHandle);
