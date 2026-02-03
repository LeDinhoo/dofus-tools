<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { toast } from "svelte-sonner";
  import { dev } from "$app/environment";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  let email = "";
  let password = "";
  let name = "";
  let loading = false;
  let isLogin = true; // Pour basculer entre login et signup (dev uniquement)

  async function handleSubmit() {
    loading = true;

    if (isLogin) {
      // LOGIN
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
    } else {
      // SIGNUP (dev uniquement)
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
    }

    loading = false;
  }
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">
        {isLogin ? "Connexion" : "Créer un compte"}
        {#if dev}
          <span class="ml-2 text-sm text-orange-500">(Mode Dev)</span>
        {/if}
      </Card.Title>
      <Card.Description>
        {isLogin
          ? "Entrez vos identifiants pour accéder à vos outils."
          : "Rejoignez la communauté Dofus Tools."}
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      {#if !isLogin && dev}
        <div class="space-y-2">
          <Label for="name">Nom d'utilisateur</Label>
          <Input id="name" bind:value={name} placeholder="Dinho" />
        </div>
      {/if}

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

    <Card.Footer class="flex flex-col space-y-4">
      <Button class="w-full" onclick={handleSubmit} disabled={loading}>
        {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
      </Button>

      {#if dev}
        <button
          class="text-sm text-muted-foreground hover:underline"
          onclick={() => (isLogin = !isLogin)}
        >
          {isLogin
            ? "Pas encore de compte ? S'inscrire"
            : "Déjà un compte ? Se connecter"}
        </button>
      {/if}
    </Card.Footer>
  </Card.Root>
</div>
