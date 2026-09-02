import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

export async function loadFeedInteractions(sessionIds) {
  if (!sessionIds?.length) { app.feedReactions = {}; app.feedComments = {}; return; }
  const [{ data: reactions, error: rErr }, { data: comments, error: cErr }] = await Promise.all([
    sb.from('feed_reactions').select('*').in('session_id', sessionIds),
    sb.from('feed_comments').select('*').in('session_id', sessionIds).order('created_at', { ascending: true })
  ]);
  if (rErr) console.error(rErr);
  if (cErr) console.error(cErr);
  const byReaction = {}; (reactions || []).forEach(r => { (byReaction[r.session_id] = byReaction[r.session_id] || []).push(r); });
  const byComment = {}; (comments || []).forEach(c => { (byComment[c.session_id] = byComment[c.session_id] || []).push(c); });
  app.feedReactions = byReaction;
  app.feedComments = byComment;
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
  app.reactionPickerFor = null;
  await loadFeedInteractions(Object.keys(app.feedReactions).concat(sessionId));
}

export async function addComment(sessionId, authorId, text) {
  if (!text?.trim()) return;
  const me = app.authUser.id;
  const { error } = await sb.from('feed_comments').insert({ session_id: sessionId, user_id: me, content: text.trim() });
  if (error) { alert('Errore commento: ' + error.message); return; }
  if (authorId && authorId !== me) await sb.from('notifications').insert({ user_id: authorId, actor_id: me, type: 'comment', payload: { session_id: sessionId } });
  await loadFeedInteractions(Object.keys(app.feedComments).concat(sessionId));
}
