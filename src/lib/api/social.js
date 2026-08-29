import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

function rowToSession(row) {
  return { ...row.payload, id: row.id, data: row.data, disciplina: row.disciplina, privacy: row.privacy };
}

// Amici, richieste e feed condiviso -----------------------------------------

export async function fetchFriendsData(userId) {
  const { data: rows, error } = await sb.from('friendships')
    .select('*, requester:requester_id(id,username,avatar_url,is_developer), addressee:addressee_id(id,username,avatar_url,is_developer)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) { console.error(error); return { friends: [], friendRequests: [], friendRequestsSent: [], friendFeed: [] }; }

  const rawFriends = rows.filter(r => r.status === 'accepted').map(r => {
    const other = r.requester_id === userId ? r.addressee : r.requester;
    return { ...other, friendshipId: r.id };
  });
  const seen = new Set();
  const friends = rawFriends.filter(f => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
  const friendRequests = rows.filter(r => r.status === 'pending' && r.addressee_id === userId).map(r => ({ friendshipId: r.id, from: r.requester }));
  const friendRequestsSent = rows.filter(r => r.status === 'pending' && r.requester_id === userId).map(r => ({ friendshipId: r.id, to: r.addressee }));

  let friendFeed = [];
  if (friends.length) {
    const ids = friends.map(f => f.id);
    const { data: feedRows, error: feedErr } = await sb.from('sessions').select('*').in('user_id', ids).neq('privacy', 'privato').order('data', { ascending: false }).limit(60);
    if (!feedErr) {
      friendFeed = feedRows.map(row => ({ ...rowToSession(row), authorId: row.user_id, authorName: (friends.find(f => f.id === row.user_id) || {}).username || '?' }));
    }
  }
  return { friends, friendRequests, friendRequestsSent, friendFeed };
}

// Ricarica amici/richieste/feed e le relative reazioni/commenti, aggiornando app.*
export async function refreshFriendsData() {
  const me = app.authUser?.id;
  if (!me) return;
  const { friends, friendRequests, friendRequestsSent, friendFeed } = await fetchFriendsData(me);
  app.friends = friends;
  app.friendRequests = friendRequests;
  app.friendRequestsSent = friendRequestsSent;
  app.friendFeed = friendFeed;
  const { feedReactions, feedComments } = await loadFeedInteractions(friendFeed.map(s => s.id));
  app.feedReactions = feedReactions;
  app.feedComments = feedComments;
}

export async function searchUserByUsername(username) {
  const me = app.authUser.id;
  const { data, error } = await sb.from('profiles').select('id,username,is_developer').ilike('username', username).neq('id', me).limit(5);
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
  await refreshFriendsData();
}

export async function acceptFriendRequest(friendshipId) {
  const { error } = await sb.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) { alert('Errore: ' + error.message); return; }
  await refreshFriendsData();
}

export async function removeFriendship(friendshipId) {
  const { error } = await sb.from('friendships').delete().eq('id', friendshipId);
  if (error) { alert('Errore: ' + error.message); return; }
  await refreshFriendsData();
}

// Reazioni & commenti sul feed -------------------------------------------

export async function loadFeedInteractions(sessionIds) {
  if (!sessionIds?.length) return { feedReactions: {}, feedComments: {} };
  const [{ data: reactions, error: rErr }, { data: comments, error: cErr }] = await Promise.all([
    sb.from('feed_reactions').select('*').in('session_id', sessionIds),
    sb.from('feed_comments').select('*').in('session_id', sessionIds).order('created_at', { ascending: true })
  ]);
  if (rErr) console.error(rErr);
  if (cErr) console.error(cErr);
  const feedReactions = {};
  (reactions || []).forEach(r => { (feedReactions[r.session_id] = feedReactions[r.session_id] || []).push(r); });
  const feedComments = {};
  (comments || []).forEach(c => { (feedComments[c.session_id] = feedComments[c.session_id] || []).push(c); });
  return { feedReactions, feedComments };
}

export async function toggleReaction(sessionId, authorId, reactionType) {
  const me = app.authUser.id;
  const mine = (app.feedReactions[sessionId] || []).find(r => r.user_id === me);
  if (mine && mine.reaction_type === reactionType) {
    await sb.from('feed_reactions').delete().eq('id', mine.id);
  } else if (mine) {
    await sb.from('feed_reactions').update({ reaction_type: reactionType }).eq('id', mine.id);
  } else {
    await sb.from('feed_reactions').insert({ session_id: sessionId, user_id: me, reaction_type: reactionType });
    if (authorId && authorId !== me) await sb.from('notifications').insert({ user_id: authorId, actor_id: me, type: 'reaction', payload: { session_id: sessionId } });
  }
  const { feedReactions } = await loadFeedInteractions(Object.keys(app.feedReactions).concat(sessionId));
  app.feedReactions = feedReactions;
}

export async function addComment(sessionId, authorId, text) {
  if (!text?.trim()) return;
  const me = app.authUser.id;
  const { error } = await sb.from('feed_comments').insert({ session_id: sessionId, user_id: me, content: text.trim() });
  if (error) { alert('Errore commento: ' + error.message); return; }
  if (authorId && authorId !== me) await sb.from('notifications').insert({ user_id: authorId, actor_id: me, type: 'comment', payload: { session_id: sessionId } });
  const { feedComments } = await loadFeedInteractions(Object.keys(app.feedComments).concat(sessionId));
  app.feedComments = feedComments;
}
