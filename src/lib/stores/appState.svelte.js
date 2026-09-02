// Stato globale reattivo, equivalente Svelte del vecchio oggetto `state` mutabile.
// Con le rune di Svelte 5, un oggetto creato con $state() è profondamente reattivo:
// modificare app.sessions.push(x) o app.profile.username = 'x' aggiorna l'UI da solo,
// senza bisogno di richiamare un render() manuale come nella versione vanilla.

export const app = $state({
  // sessione utente / navigazione
  language: (typeof localStorage !== 'undefined' && localStorage.getItem('klindLanguage')) || 'it',
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

  // social — amici, gruppi, feed, sfide, notifiche (Fase 9)
  friends: [],
  friendRequests: [],
  friendRequestsSent: [],
  friendFeed: [],
  friendSearchResults: [],
  friendSearchQuery: '',
  friendSearchDone: false,
  feedVisibleCount: 8,
  feedFilterDiscipline: 'all',
  feedFilterFriend: 'all',
  feedReactions: {},
  feedComments: {},
  openCommentsFor: null,
  reactionPickerFor: null,
  groups: [],
  showCreateGroup: false,
  newGroupName: '',
  newGroupMemberIds: [],
  activeGroupId: null,
  radarPersonA: '__me__',
  radarPersonB: '',
  radarMode: 'duo',
  radarGroupId: null,
  challenges: [],
  showCreateChallenge: false,
  newChallengeName: '',
  newChallengeType: 'most_sessions',
  newChallengeDisc: 'boulder',
  newChallengeTargetGrade: '',
  newChallengeEndDate: '',
  newChallengeMemberIds: [],
  notifications: [],
  notifDropdownOpen: false,

  // admin luoghi (Fase 10)
  showCragsAdminInsideFalesia: false,
  cragsAdminSearch: '',
  cragsAdminExpandedId: null,

  // stato di caricamento iniziale dopo il login
  loadingUserData: false
});

export function setLanguage(lang) {
  app.language = lang;
  if (typeof localStorage !== 'undefined') localStorage.setItem('klindLanguage', lang);
}
