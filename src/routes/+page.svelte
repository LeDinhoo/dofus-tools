<script lang="ts">
  import { authClient } from "$lib/auth-client";
  export let data;
</script>

<h1>Bienvenue sur Dofus Tools, {data.user?.name} !</h1>
<p>Si tu vois cette page, c'est que l'authentification fonctionne.</p>