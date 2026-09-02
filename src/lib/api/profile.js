import { sb } from './supabaseClient.js';

// Selezione esplicita dei campi (mai select('*')): stesso fix di sicurezza
// già applicato alla versione vanilla — non si tira dietro più dati di quanti
// l'app ne usi davvero.
const PROFILE_FIELDS = 'id,username,avatar_url,is_developer,can_edit_crags,altezza,eta,peso,apertura,anni,obiettivo';

export async function fetchProfile(userId) {
  const { data, error } = await sb.from('profiles').select(PROFILE_FIELDS).eq('id', userId).maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

export async function updateProfile(userId, profile) {
  const username = (profile.username || '').trim().toLowerCase();
  const escapedUsername = username.replace(/[\\%_]/g, '\\$&');
  const { data: matches, error: checkError } = await sb.from('profiles')
    .select('id').ilike('username', escapedUsername).neq('id', userId).limit(1);
  if (checkError) return { ok: false, message: 'Errore controllo username: ' + checkError.message };
  if (matches?.length) return { ok: false, message: 'Questo username è già in uso.' };

  const row = { id: userId, username, ...profile };
  const { error } = await sb.from('profiles').update(row).eq('id', userId);
  if (error) return { ok: false, message: error.code === '23505' ? 'Questo username è già in uso.' : 'Errore salvataggio profilo: ' + error.message };
  return { ok: true };
}
