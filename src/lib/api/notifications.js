import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

let channel = null;

export async function loadNotifications() {
  const { data, error } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(30);
  if (error) { console.error(error); app.notifications = []; return; }
  app.notifications = data || [];
}

export async function markNotificationsRead() {
  const unreadIds = app.notifications.filter(n => !n.is_read).map(n => n.id);
  if (!unreadIds.length) return;
  await sb.from('notifications').update({ is_read: true }).in('id', unreadIds);
  app.notifications = app.notifications.map(n => ({ ...n, is_read: true }));
}

// Realtime: nuove notifiche arrivano subito senza bisogno di ricaricare la pagina.
export function subscribeNotifications() {
  if (!app.authUser) return;
  unsubscribeNotifications();
  channel = sb.channel('notifications-' + app.authUser.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${app.authUser.id}` }, payload => {
      app.notifications = [payload.new, ...app.notifications];
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Klind', { body: notificationLabel(payload.new) });
      }
    }).subscribe();
}

export function unsubscribeNotifications() {
  if (channel) { sb.removeChannel(channel); channel = null; }
}

export function notificationLabel(n) {
  const actor = app.friends.find(f => f.id === n.actor_id)?.username || 'Qualcuno';
  if (n.type === 'comment') return `${actor} ha commentato una tua sessione`;
  if (n.type === 'reaction') return `${actor} ha messo una reazione a una tua sessione`;
  if (n.type === 'friend_request') return `${actor} ti ha inviato una richiesta di amicizia`;
  if (n.type === 'challenge_win') return n.payload?.kind === 'invite' ? `${actor} ti ha invitato alla sfida "${n.payload?.challenge_name || ''}"` : `Hai vinto la sfida "${n.payload?.challenge_name || ''}"!`;
  if (n.type === 'group_invite') return `${actor} ti ha aggiunto a un gruppo`;
  return 'Nuova notifica';
}
