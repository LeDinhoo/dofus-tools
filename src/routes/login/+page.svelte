<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { toast } from "svelte-sonner";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  let email = "";
  let password = "";
  let loading = false;

  async function handleSubmit() {
    loading = true;

    // LOGIN uniquement
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Bon retour parmi nous !");
          window.location.href = "/";
        },
        onError: (ctx) => toast.error(ctx.error.message),
      }
    );

    loading = false;
  }

  // Code commenté pour réactiver l'inscription si nécessaire
  /*
  let name = "";
  let isLogin = true;

  async function handleSignup() {
    loading = true;
    await authClient.signUp.email(
      { email, password, name },
      {
        onSuccess: () => {
          toast.success("Compte créé avec succès !");
          window.location.href = "/";
        },
        onError: (ctx) => toast.error(ctx.error.message),
      }
    );
    loading = false;
  }
  */
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">Connexion</Card.Title>
      <Card.Description>
        Entrez vos identifiants pour accéder à vos outils.
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          type="email"
          bind:value={email}
          placeholder="m@example.com"
        />
      </div>

      <div class="space-y-2">
        <Label for="password">Mot de passe</Label>
        <Input id="password" type="password" bind:value={password} />
      </div>
    </Card.Content>

    <Card.Footer>
      <Button class="w-full" onclick={handleSubmit} disabled={loading}>
        {loading ? "Chargement..." : "Se connecter"}
      </Button>
    </Card.Footer>
  </Card.Root>
</div>
