import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

export async function loadCrags() {
  const { data, error } = await sb.from('crags').select('*').order('nome', { ascending: true });
  if (error) { console.error(error); app.crags = []; return; }
  app.crags = data || [];
}

export async function addCrag(nome, tipo, indirizzo, zona) {
  const row = { nome: nome.trim(), tipo: tipo || 'palestra', indirizzo: (indirizzo || '').trim() || null, zona: (zona || '').trim() || null, created_by: app.authUser.id };
  const { data, error } = await sb.from('crags').insert(row).select().single();
  if (error) {
    if (error.code === '23505') {
      const existing = app.crags.find(c => c.nome.toLowerCase() === nome.trim().toLowerCase());
      return existing || null;
    }
    alert('Errore salvataggio luogo: ' + error.message);
    return null;
  }
  app.crags.push(data);
  app.crags.sort((a, b) => a.nome.localeCompare(b.nome));
  return data;
}

export async function updateCragDetails(id, fields) {
  if (!app.profile?.can_edit_crags) { alert('Solo gli utenti verificati possono modificare le palestre.'); return null; }
  const { data, error } = await sb.from('crags').update(fields).eq('id', id).select().single();
  if (error) { alert('Errore salvataggio: ' + error.message); return null; }
  const idx = app.crags.findIndex(c => c.id === id);
  if (idx >= 0) app.crags[idx] = data;
  return data;
}

export async function deleteCrag(id) {
  if (!app.profile?.can_edit_crags) { alert('Solo gli utenti verificati possono eliminare le palestre.'); return false; }
  const crag = app.crags.find(c => c.id === id);
  if (!crag || !confirm(`Eliminare la palestra "${crag.nome}"? Le sessioni già registrate resteranno nello storico.`)) return false;
  const { error } = await sb.from('crags').delete().eq('id', id);
  if (error) { alert('Errore eliminazione: ' + error.message); return false; }
  app.crags = app.crags.filter(c => c.id !== id);
  if (app.cragsAdminExpandedId === id) app.cragsAdminExpandedId = null;
  return true;
}
