<script>
  import { app } from '../../stores/appState.svelte.js';
  import { acceptFriendRequest, removeFriendship } from '../../api/friends.js';
</script>

<div class="panel">
  <h3>Richieste di amicizia</h3>
  {#if app.friendRequests?.length}
    {#each app.friendRequests as r}
      <div class="session-mini">
        <div><b>{r.from?.username || 'Utente'}</b>{#if r.from?.is_developer}<span class="developer-badge">Developer</span>{/if}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-primary" onclick={() => acceptFriendRequest(r.friendshipId)}>Accetta</button>
          <button class="btn btn-sm btn-danger" onclick={() => removeFriendship(r.friendshipId)}>Rifiuta</button>
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna richiesta in sospeso.</div>
  {/if}
</div>
