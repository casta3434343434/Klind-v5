import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

function rowToTest(row) {
  return { ...row.payload, id: row.id };
}

export async function fetchTests(userId) {
  const { data, error } = await sb.from('tests').select('*').eq('user_id', userId).order('data', { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(rowToTest);
}

export async function insertTest(test) {
  const row = { user_id: app.authUser.id, data: test.data, tipo: test.tipo, payload: test };
  const { data, error } = await sb.from('tests').insert(row).select().single();
  if (error) { alert('Errore salvataggio: ' + error.message); return null; }
  return rowToTest(data);
}

export async function deleteTestRemote(id) {
  const { error } = await sb.from('tests').delete().eq('id', id);
  if (error) { alert('Errore eliminazione: ' + error.message); return false; }
  return true;
}
