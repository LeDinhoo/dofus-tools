// Importe votre configuration d'authentification (définie ailleurs)
import { auth } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";

// Gère les requêtes de lecture (ex: récupérer la session, callback OAuth)
export const GET: RequestHandler = ({ request }) => auth.handler(request);

// Gère les actions (ex: se connecter, s'inscrire, se déconnecter)
export const POST: RequestHandler = ({ request }) => auth.handler(request);
