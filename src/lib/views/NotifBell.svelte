<script>
  import { app } from '../stores/appState.svelte.js';
  import { notificationLabel, markNotificationsRead } from '../api/notifications.js';

  const unread = $derived(app.notifications.filter(n => !n.is_read).length);
  const canAskPermission = $derived(typeof Notification !== 'undefined' && Notification.permission === 'default');

  function toggle() {
    app.notifDropdownOpen = !app.notifDropdownOpen;
    if (app.notifDropdownOpen) markNotificationsRead();
  }

  function askPermission() {
    if (typeof Notification !== 'undefined') Notification.requestPermission();
  }
</script>

<span style="position:relative;">
  <button class="notif-bell {unread ? 'has-unread' : ''}" aria-label="Notifiche" onclick={toggle}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a5 5 0 0 0-5 5v3.2c0 .78-.31 1.53-.86 2.08L4.7 14.7c-.63.63-.18 1.7.7 1.7h13.2c.88 0 1.33-1.07.7-1.7l-1.44-1.42A2.94 2.94 0 0 1 17 11.2V8a5 5 0 0 0-5-5z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>
    {#if unread}<span class="notif-dot"></span>{/if}
  </button>
  {#if app.notifDropdownOpen}
    <div class="notif-dropdown">
      {#if app.notifications.length}
        {#each app.notifications as n}
          <div class="notif-item {n.is_read ? '' : 'unread'}">
            {notificationLabel(n)}
            <div class="sub" style="margin-top:2px;">{new Date(n.created_at).toLocaleString('it-IT')}</div>
          </div>
        {/each}
      {:else}
        <div class="notif-item">Nessuna notifica.</div>
      {/if}
      {#if canAskPermission}
        <div class="notif-item"><button class="btn btn-sm btn-block" onclick={askPermission}>Attiva notifiche del browser</button></div>
      {/if}
    </div>
  {/if}
</span>
