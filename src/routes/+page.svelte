<script lang="ts">
    export let data;
</script>

<main style="font-family: sans-serif; padding: 2rem;">
    <h1>Ma Liste Docker + Prisma</h1>

    {#if data.todos.length === 0}
        <p>Aucune tâche trouvée. La base est vide mais connectée !</p>
    {:else}
        <ul>
            {#each data.todos as todo}
                <li>
                    <span style={todo.completed ? "text-decoration: line-through" : ""}>
                        {todo.task}
                    </span>
                    <small>(créé le {todo.createdAt.toLocaleDateString()})</small>
                </li>
            {/each}
        </ul>
    {/if}
</main>