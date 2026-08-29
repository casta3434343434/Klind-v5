<script>
  import { app } from '../../stores/appState.svelte.js';
  import { requestConfirm } from '../../stores/confirm.svelte.js';
  import { searchUserByUsername, sendFriendRequest, acceptFriendRequest, removeFriendship } from '../../api/social.js';
  import DeveloperBadge from './DeveloperBadge.svelte';

  let query = $state('');
  let results = $state([]);
  let searched = $state(false);
  let searching = $state(false);

  async function doSearch() {
    const q = query.trim();
    if (!q) { results = []; searched = false; return; }
    searching = true;
    try {
      results = await searchUserByUsername(q);
      searched = true;
    } finally {
      searching = false;
    }
  }

  function removeFriend(friend) {
    requestConfirm({
      title: 'Rimuovere questo amico?',
      message: "Non vedrete più le sessioni condivise l'uno dell'altro.",
      confirmLabel: 'Rimuovi amico',
      onConfirm: () => removeFriendship(friend.friendshipId)
    });
  }
</script>

<div class="panel">
  <h3>Trova un amico</h3>
  <div class="field-row" style="align-items:end;">
    <div class="field" style="margin-bottom:0;">
      <label>Username</label>
      <input type="text" placeholder="es. marco92" bind:value={query} onkeydown={(e) => e.key === 'Enter' && doSearch()}>
    </div>
    <button class="btn btn-primary" style="height:40px;" onclick={doSearch} disabled={searching}>{searching ? '…' : 'Cerca'}</button>
  </div>
  {#if results.length}
    <div style="margin-top:14px;">
      {#each results as u (u.id)}
        <div class="session-mini">
          <div>{u.username}<DeveloperBadge user={u} /></div>
          <button class="btn btn-sm" onclick={() => sendFriendRequest(u.id)}>+ Aggiungi</button>
        </div>
      {/each}
    </div>
  {:else if searched}
    <p class="sub" style="margin-top:12px;">Nessun utente trovato.</p>
  {/if}
</div>

<div class="panel">
  <h3>Richieste di amicizia</h3>
  {#if app.friendRequests.length}
    {#each app.friendRequests as r (r.friendshipId)}
      <div class="session-mini">
        <div><b>{r.from?.username || 'Utente'}</b><DeveloperBadge user={r.from} /></div>
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

<div class="panel">
  <h3>I miei amici</h3>
  {#if app.friends.length}
    {#each app.friends as friend (friend.friendshipId)}
      <div class="session-mini">
        <div>
          <span class="avatar">{#if friend.avatar_url}<img class="avatar" src={friend.avatar_url} alt="">{/if}</span>
          <b>{friend.username || 'Utente'}</b><DeveloperBadge user={friend} />
        </div>
        <button class="btn btn-sm btn-danger" onclick={() => removeFriend(friend)}>Rimuovi amico</button>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Non hai ancora amici aggiunti.</div>
  {/if}
</div>

<div class="panel">
  <h3>Richieste inviate</h3>
  {#if app.friendRequestsSent.length}
    {#each app.friendRequestsSent as request (request.friendshipId)}
      <div class="session-mini">
        <div><b>{request.to?.username || 'Utente'}</b><DeveloperBadge user={request.to} /></div>
        <span class="sub">In attesa</span>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna richiesta inviata.</div>
  {/if}
</div>
