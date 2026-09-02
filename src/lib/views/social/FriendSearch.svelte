<script>
  import { app } from '../../stores/appState.svelte.js';
  import { searchUserByUsername, sendFriendRequest } from '../../api/friends.js';

  async function search() {
    const q = (app.friendSearchQuery || '').trim();
    if (!q) return;
    app.friendSearchResults = await searchUserByUsername(q);
    app.friendSearchDone = true;
  }
</script>

<div class="panel">
  <h3>Trova un amico</h3>
  <div class="field-row" style="align-items:end;">
    <div class="field" style="margin-bottom:0;"><label>Username</label><input type="text" placeholder="es. marco92" bind:value={app.friendSearchQuery} onkeydown={(e) => e.key === 'Enter' && search()}></div>
    <button class="btn btn-primary" style="height:40px;" onclick={search}>Cerca</button>
  </div>
  {#if app.friendSearchResults?.length}
    <div style="margin-top:14px;">
      {#each app.friendSearchResults as u}
        <div class="session-mini">
          <div>{u.username}{#if u.is_developer}<span class="developer-badge">Developer</span>{/if}</div>
          <button class="btn btn-sm" onclick={() => sendFriendRequest(u.id)}>+ Aggiungi</button>
        </div>
      {/each}
    </div>
  {:else if app.friendSearchDone}
    <p class="sub" style="margin-top:12px;">Nessun utente trovato.</p>
  {/if}
</div>
