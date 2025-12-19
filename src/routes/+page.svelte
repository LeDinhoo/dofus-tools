<script lang="ts">
  import { authClient } from "$lib/auth-client";

  async function signUp() {
    const { data, error } = await authClient.signUp.email({
      email: "test@example.com",
      password: "mon_super_password_long", // Mets un truc long
      name: "Dinho",
    });

    if (error) {
      console.error("Détails de l'erreur :", error.message);
      alert("Erreur : " + error.message);
    } else {
      console.log("Compte créé !", data);
      alert("Compte créé avec succès !");
    }
  }
</script>

<button on:click={signUp}>Tester l'inscription</button>
