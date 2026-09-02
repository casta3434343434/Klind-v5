import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

export async function loadChallenges() {
  const { data, error } = await sb.from('challenges').select('*, challenge_participants(user_id)');
  if (error) { console.error(error); app.challenges = []; return; }
  app.challenges = (data || []).map(c => ({ ...c, participantIds: (c.challenge_participants || []).map(p => p.user_id) }));
}

export async function createChallenge(payload, memberIds) {
  const me = app.authUser.id;
  const { data: chRow, error } = await sb.from('challenges').insert({ ...payload, creator_id: me }).select().single();
  if (error) { alert('Errore creazione sfida: ' + error.message); return; }
  const uniqueIds = [...new Set([me, ...(memberIds || [])])];
  const rows = uniqueIds.map(userId => ({ challenge_id: chRow.id, user_id: userId }));
  const { error: partErr } = await sb.from('challenge_participants').insert(rows);
  if (partErr) alert('Errore aggiunta partecipanti: ' + partErr.message);
  const invited = uniqueIds.filter(id => id !== me);
  if (invited.length) {
    await sb.from('notifications').insert(invited.map(userId => ({ user_id: userId, actor_id: me, type: 'challenge_win', payload: { challenge_id: chRow.id, challenge_name: chRow.name, kind: 'invite' } })));
  }
  app.showCreateChallenge = false;
  app.newChallengeName = '';
  app.newChallengeMemberIds = [];
  app.newChallengeTargetGrade = '';
  app.newChallengeEndDate = '';
  await loadChallenges();
}

export async function deleteChallenge(id) {
  const { error: participantsError } = await sb.from('challenge_participants').delete().eq('challenge_id', id);
  if (participantsError) { alert('Errore eliminazione partecipanti: ' + participantsError.message); return; }
  const { error } = await sb.from('challenges').delete().eq('id', id);
  if (error) { alert('Errore: ' + error.message); return; }
  await loadChallenges();
}

export async function leaveChallenge(id) {
  const { error } = await sb.from('challenge_participants').delete().eq('challenge_id', id).eq('user_id', app.authUser.id);
  if (error) { alert('Errore: ' + error.message); return; }
  await loadChallenges();
}
