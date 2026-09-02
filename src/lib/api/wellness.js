import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

export async function fetchWellness(userId) {
  const { data, error } = await sb.from('wellness').select('*').eq('user_id', userId).order('data', { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(row => ({ ...row.payload, id: row.id, data: row.data }));
}

export async function upsertWellness(entry) {
  const row = { user_id: app.authUser.id, data: entry.data, payload: entry };
  const { data, error } = await sb.from('wellness').upsert(row, { onConflict: 'user_id,data' }).select().single();
  if (error) { alert('Errore salvataggio: ' + error.message); return null; }
  return { ...data.payload, id: data.id, data: data.data };
}
