import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';
import { fetchProfile } from './profile.js';
import { fetchSessions } from './sessions.js';
import { fetchTests } from './tests.js';
import { fetchWellness } from './wellness.js';
import { loadCrags } from './crags.js';
import { refreshFriendsData } from './social.js';
import { loadGroups } from './groups.js';
import { loadChallenges } from './challenges.js';
import { loadNotifications, subscribeNotifications, unsubscribeNotifications } from './notifications.js';

export async function loadAllUserData(userId) {
  app.loadingUserData = true;
  try {
    const [profile, sessions, tests, wellness] = await Promise.all([
      fetchProfile(userId),
      fetchSessions(userId),
      fetchTests(userId),
      fetchWellness(userId),
      loadCrags()
    ]);
    app.profile = profile || {};
    app.sessions = sessions;
    app.tests = tests;
    app.wellness = wellness;
    app.user = profile?.username || app.authUser?.email || '';

    // Dati social: amici/feed devono essere caricati prima di gruppi/sfide/notifiche
    // solo per coerenza logica, ma sono indipendenti — partono in parallelo.
    await Promise.all([
      refreshFriendsData(),
      loadGroups(),
      loadChallenges(),
      loadNotifications()
    ]);
    subscribeNotifications();
  } finally {
    app.loadingUserData = false;
  }
}

export async function restoreSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return false;
  app.authUser = session.user;
  await loadAllUserData(session.user.id);
  app.view = 'app';
  app.appView = 'dashboard';
  return true;
}

export async function handleLogin(email, password) {
  app.authError = '';
  app.authBusy = true;
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { app.authError = 'Credenziali errate.'; return false; }
    app.authUser = data.user;
    await loadAllUserData(data.user.id);
    app.user = app.profile?.username || email;
    app.view = 'app';
    app.appView = 'dashboard';
    return true;
  } finally {
    app.authBusy = false;
  }
}

export async function handleSignup(email, password, username) {
  app.authError = '';
  app.authBusy = true;
  try {
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
    if (error) { app.authError = error.message; return false; }
    if (!data.session) {
      // Conferma email richiesta: nessuna sessione attiva finché non conferma.
      app.authMode = 'login';
      app.authError = 'Ti abbiamo mandato una email di conferma: apri il link, poi accedi qui.';
      return false;
    }
    app.authUser = data.user;
    app.user = username;
    app.profile = { username, altezza: '', eta: '', peso: '', apertura: '', anni: '', obiettivo: 3 };
    app.sessions = [];
    app.tests = [];
    app.wellness = [];
    app.friends = [];
    app.friendRequests = [];
    app.friendRequestsSent = [];
    app.friendFeed = [];
    app.groups = [];
    app.challenges = [];
    app.notifications = [];
    app.view = 'app';
    app.appView = 'dashboard';
    subscribeNotifications();
    return true;
  } finally {
    app.authBusy = false;
  }
}

export async function logout() {
  unsubscribeNotifications();
  await sb.auth.signOut();
  app.authUser = null;
  app.user = null;
  app.profile = null;
  app.sessions = [];
  app.tests = [];
  app.wellness = [];
  app.friends = [];
  app.friendRequests = [];
  app.friendRequestsSent = [];
  app.friendFeed = [];
  app.feedReactions = {};
  app.feedComments = {};
  app.groups = [];
  app.challenges = [];
  app.notifications = [];
  app.view = 'landing';
}
