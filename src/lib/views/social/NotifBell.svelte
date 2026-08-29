<script>
  import { app } from '../../stores/appState.svelte.js';
  import { markNotificationsRead, notificationLabel } from '../../api/notifications.js';

  let open = $state(false);
  const unread = $derived(app.notifications.filter(n => !n.is_read).length);

  function toggle() {
    open = !open;
    if (open) markNotificationsRead();
  }

  let notifPermission = $state(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  async function requestPermission() {
    if (typeof Notification === 'undefined') return;
    notifPermission = await Notification.requestPermission();
  }
</script>

<span style="position:relative;">
  <button class="notif-bell {unread ? 'has-unread' : ''}" aria-label="Notifiche" onclick={toggle}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a5 5 0 0 0-5 5v3.2c0 .78-.31 1.53-.86 2.08L4.7 14.7c-.63.63-.18 1.7.7 1.7h13.2c.88 0 1.33-1.07.7-1.7l-1.44-1.42A2.94 2.94 0 0 1 17 11.2V8a5 5 0 0 0-5-5z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>
    {#if unread}<span class="notif-dot"></span>{/if}
  </button>
  {#if open}
    <div class="notif-dropdown">
      {#if app.notifications.length}
        {#each app.notifications as n (n.id)}
          <div class="notif-item {n.is_read ? '' : 'unread'}">
            {notificationLabel(n)}
            <div class="sub" style="margin-top:2px;">{new Date(n.created_at).toLocaleString('it-IT')}</div>
          </div>
        {/each}
      {:else}
        <div class="notif-item">Nessuna notifica.</div>
      {/if}
      {#if notifPermission === 'default'}
        <div class="notif-item"><button class="btn btn-sm btn-block" onclick={requestPermission}>Attiva notifiche del browser</button></div>
      {/if}
    </div>
  {/if}
</span>
