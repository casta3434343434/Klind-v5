import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';
import { rowToSession } from './sessions.js';
import { loadFeedInteractions } from './feed.js';

export async function loadFriendsData() {
  const me = app.authUser.id;
  const { data: rows, error } = await sb.from('friendships')
    .select('*, requester:requester_id(id,username,avatar_url,is_developer), addressee:addressee_id(id,username,avatar_url,is_developer)')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  if (error) { console.error(error); app.friends = []; app.friendRequests = []; app.friendRequestsSent = []; return; }

  const rawFriends = rows.filter(r => r.status === 'accepted').map(r => {
    const other = r.requester_id === me ? r.addressee : r.requester;
    return { ...other, friendshipId: r.id };
  });
  const seen = new Set();
  app.friends = rawFriends.filter(f => { if (seen.has(f.id)) return false; seen.add(f.id); return true; });
  app.friendRequests = rows.filter(r => r.status === 'pending' && r.addressee_id === me).map(r => ({ friendshipId: r.id, from: r.requester }));
  app.friendRequestsSent = rows.filter(r => r.status === 'pending' && r.requester_id === me).map(r => ({ friendshipId: r.id, to: r.addressee }));

  if (app.friends.length) {
    const ids = app.friends.map(f => f.id);
    const { data: feedRows, error: feedErr } = await sb.from('sessions').select('*').in('user_id', ids).neq('privacy', 'privato').order('data', { ascending: false }).limit(60);
    if (!feedErr) {
      app.friendFeed = feedRows.map(row => ({ ...rowToSession(row), authorId: row.user_id, authorName: (app.friends.find(f => f.id === row.user_id) || {}).username || '?' }));
    }
  } else {
    app.friendFeed = [];
  }
  app.feedVisibleCount = 8;
  await loadFeedInteractions(app.friendFeed.map(s => s.id));
}

export async function searchUserByUsername(username) {
  const me = app.authUser.id;
  const escaped = username.trim().replace(/[\\%_]/g, '\\$&');
  const { data, error } = await sb.from('profiles').select('id,username,is_developer').ilike('username', `%${escaped}%`).neq('id', me).limit(5);
  if (error) { console.error(error); return []; }
  return data;
}

export async function sendFriendRequest(targetId) {
  const me = app.authUser.id;
  const { data: existing, error: checkErr } = await sb.from('friendships').select('id')
    .or(`and(requester_id.eq.${me},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${me})`).limit(1);
  if (checkErr) { alert('Errore: ' + checkErr.message); return; }
  if (existing?.length) { alert('Richiesta già inviata o già amici.'); return; }
  const { error } = await sb.from('friendships').insert({ requester_id: me, addressee_id: targetId, status: 'pending' });
  if (error) { alert(error.code === '23505' ? 'Richiesta già inviata.' : 'Errore: ' + error.message); return; }
  await sb.from('notifications').insert({ user_id: targetId, actor_id: me, type: 'friend_request' });
  await loadFriendsData();
}

export async function acceptFriendRequest(friendshipId) {
  const { error } = await sb.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) { alert('Errore: ' + error.message); return; }
  await loadFriendsData();
}

export async function removeFriendship(friendshipId) {
  const { error } = await sb.from('friendships').delete().eq('id', friendshipId);
  if (error) { alert('Errore: ' + error.message); return; }
  await loadFriendsData();
}
