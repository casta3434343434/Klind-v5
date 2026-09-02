<script>
  import { app } from '../../stores/appState.svelte.js';
  import { removeFriendship } from '../../api/friends.js';
</script>

<div class="panel">
  <h3>I miei amici</h3>
  {#if app.friends?.length}
    {#each app.friends as friend}
      <div class="session-mini">
        <div>
          <span class="avatar">{#if friend.avatar_url}<img class="avatar" src={friend.avatar_url} alt="">{/if}</span>
          <b>{friend.username || 'Utente'}</b>{#if friend.is_developer}<span class="developer-badge">Developer</span>{/if}
        </div>
        <button class="btn btn-sm btn-danger" onclick={() => removeFriendship(friend.friendshipId)}>Rimuovi amico</button>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Non hai ancora amici aggiunti.</div>
  {/if}
</div>
