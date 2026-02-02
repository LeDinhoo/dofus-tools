import { createAuthClient } from "better-auth/svelte";
import { browser } from "$app/environment";

// Utilise l'origine courante du navigateur en production
// ou une variable d'environnement si définie pour le dev
const getBaseURL = () => {
  if (browser) {
    return window.location.origin;
  }
  return "http://localhost:5173"; // Fallback pour SSR en dev
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});
