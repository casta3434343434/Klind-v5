<script>
  import { app } from '../../stores/appState.svelte.js';
</script>

<div class="panel">
  <h3>Richieste inviate</h3>
  {#if app.friendRequestsSent?.length}
    {#each app.friendRequestsSent as request}
      <div class="session-mini">
        <div><b>{request.to?.username || 'Utente'}</b>{#if request.to?.is_developer}<span class="developer-badge">Developer</span>{/if}</div>
        <span class="sub">In attesa</span>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna richiesta inviata.</div>
  {/if}
</div>
