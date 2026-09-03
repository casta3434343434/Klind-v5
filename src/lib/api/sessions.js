import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';
import { sessionDisciplines } from '../utils/grades.js';

export function rowToSession(row) {
  const session = { ...row.payload, id: row.id, data: row.data, disciplina: row.disciplina, privacy: row.privacy };
  session.discipline = sessionDisciplines(session).length ? sessionDisciplines(session) : [row.disciplina];
  session.blocchiByDiscipline ||= row.disciplina ? { [row.disciplina]: session.blocchi || [] } : {};

  // Compatibilità con le sessioni salvate prima che la scala gradi diventasse
  // per-disciplina: la portiamo nella nuova mappa già in lettura, non solo
  // quando l'utente riapre la sessione per modificarla — altrimenti Storico,
  // Calendario e Feed mostrerebbero la scala di default invece di quella
  // che l'utente aveva davvero scelto.
  session.scalaByDiscipline ||= {};
  if (session.scala && !session.scalaByDiscipline[row.disciplina]) session.scalaByDiscipline[row.disciplina] = session.scala;

  return session;
}

export async function fetchSessions(userId) {
  const { data, error } = await sb.from('sessions').select('*').eq('user_id', userId).order('data', { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(rowToSession);
}

export async function upsertSession(session) {
  const primary = session.discipline?.[0] || session.disciplina;
  const row = { user_id: app.authUser.id, data: session.data, disciplina: primary, privacy: session.privacy || 'amici', payload: { ...session, disciplina: primary } };
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
