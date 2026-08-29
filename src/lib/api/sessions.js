import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

function rowToSession(row) {
  return { ...row.payload, id: row.id, data: row.data, disciplina: row.disciplina, privacy: row.privacy };
}

export async function fetchSessions(userId) {
  const { data, error } = await sb.from('sessions').select('*').eq('user_id', userId).order('data', { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(rowToSession);
}

export async function upsertSession(session) {
  const row = { user_id: app.authUser.id, data: session.data, disciplina: session.disciplina, privacy: session.privacy || 'amici', payload: session };
  if (session.id) {
    const { data, error } = await sb.from('sessions').update(row).eq('id', session.id).select().single();
    if (error) { alert('Errore salvataggio: ' + error.message); return null; }
    return rowToSession(data);
  } else {
    const { data, error } = await sb.from('sessions').insert(row).select().single();
    if (error) { alert('Errore salvataggio: ' + error.message); return null; }
    return rowToSession(data);
  }
}

export async function deleteSessionRemote(id) {
  const { error } = await sb.from('sessions').delete().eq('id', id);
  if (error) { alert('Errore eliminazione: ' + error.message); return false; }
  return true;
}
