import { auth } from "../src/lib/server/auth"; // path to your auth file
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Vérifier la session manuellement avec Better Auth
  if (!building) {
    const pathname = event.url.pathname;

    // Récupérer le token de session depuis les cookies
    const sessionToken = event.cookies.get("better-auth.session_token");

    console.log('Session check:', {
      pathname,
      hasSessionToken: !!sessionToken,
      cookieValue: sessionToken ? 'exists' : 'null'
    });

    let session = null;
    let user = null;

    // Si on a un token, vérifier la session avec Better Auth
    if (sessionToken) {
      try {
        const sessionData = await auth.api.getSession({
          headers: event.request.headers,
        });

        session = sessionData?.session || null;
        user = sessionData?.user || null;

        console.log('After auth check:', {
          hasSession: !!session,
          hasUser: !!user
        });
      } catch (error) {
        console.error('Error checking session:', error);
      }
    }

    // Peupler event.locals
    event.locals.session = session;
    event.locals.user = user;

    // Routes publiques (pas besoin d'être connecté)
    const publicRoutes = ['/login', '/api'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = !!(session || user);

    console.log('Protection decision:', {
      isAuthenticated,
      isPublicRoute,
      willRedirect: !isAuthenticated && !isPublicRoute
    });

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
