import { auth } from "$lib/auth"; // Importe la config qu'on vient de faire
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ request }) => {
  return auth.handler(request);
};

export const POST: RequestHandler = ({ request }) => {
  return auth.handler(request);
};
