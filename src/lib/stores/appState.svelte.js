// Stato globale reattivo, equivalente Svelte del vecchio oggetto `state` mutabile.
// Con le rune di Svelte 5, un oggetto creato con $state() è profondamente reattivo:
// modificare app.sessions.push(x) o app.profile.username = 'x' aggiorna l'UI da solo,
// senza bisogno di richiamare un render() manuale come nella versione vanilla.

export const app = $state({
  // sessione utente / navigazione
  language: (typeof localStorage !== 'undefined' && localStorage.getItem('klindLanguage')) || 'it',
  // Specchio reattivo di localStorage('klindThemeMode'): le CSS variable del
  // tema vengono cambiate direttamente sul DOM (vedi utils/theme.js), quindi
  // di per sé non farebbero ripartire nessun $effect — questo campo esiste
  // solo perché i grafici Chart.js (letti una volta sola alla creazione)
  // possano "accorgersi" del cambio tema e ridisegnarsi con i colori giusti.
  themeMode: (typeof localStorage !== 'undefined' && localStorage.getItem('klindThemeMode')) || 'dark',
  view: 'landing',        // 'landing' | 'auth' | 'app'
  appView: 'dashboard',   // vista interna una volta loggati (dashboard, history, social, ...)
  mobileMenuOpen: false,

  // autenticazione
  authMode: 'login',      // 'login' | 'signup'
  authError: '',
  authBusy: false,
  authUser: null,         // utente Supabase Auth
  user: null,             // nome visualizzato (username o email)
  profile: null,          // riga della tabella profiles

  // dati principali
  sessions: [],
  tests: [],
  wellness: [],
  crags: [],

  // social (Fase 9): amici, gruppi, sfide, feed, notifiche
  friends: [],             // amici accettati: {id, username, avatar_url, is_developer, friendshipId}
  friendRequests: [],      // richieste ricevute in sospeso: {friendshipId, from}
  friendRequestsSent: [],  // richieste inviate in sospeso: {friendshipId, to}
  friendFeed: [],          // sessioni non private degli amici (per feed + confronti)
  feedReactions: {},       // { [sessionId]: [{id, user_id, reaction_type}, ...] }
  feedComments: {},        // { [sessionId]: [{id, user_id, content, created_at}, ...] }
  groups: [],              // {id, name, owner_id, members:[{id, username, avatar_url, is_developer}]}
  challenges: [],          // {id, name, type, creator_id, ..., participantIds:[...]}
  notifications: [],       // {id, user_id, actor_id, type, payload, is_read, created_at}

  // stato di caricamento iniziale dopo il login
  loadingUserData: false
});

export function setLanguage(lang) {
  app.language = lang;
  if (typeof localStorage !== 'undefined') localStorage.setItem('klindLanguage', lang);
}
