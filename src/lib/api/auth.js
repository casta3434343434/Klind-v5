import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';
import { fetchProfile } from './profile.js';
import { fetchSessions } from './sessions.js';
import { loadCrags } from './crags.js';
import { fetchWellness } from './wellness.js';
import { fetchTests } from './tests.js';
import { loadFriendsData } from './friends.js';
import { loadGroups } from './groups.js';
import { loadChallenges } from './challenges.js';
import { loadNotifications, subscribeNotifications, unsubscribeNotifications } from './notifications.js';

export async function loadAllUserData(userId) {
  app.loadingUserData = true;
  try {
    const [profile, sessions, wellness, tests] = await Promise.all([
      fetchProfile(userId),
      fetchSessions(userId),
      fetchWellness(userId),
      fetchTests(userId),
      loadCrags()
    ]);
    app.profile = profile || {};
    app.sessions = sessions;
    app.wellness = wellness;
    app.tests = tests;
    app.user = profile?.username || app.authUser?.email || '';
    // Dati sociali: non bloccano il primo render se falliscono/impiegano tempo.
    await Promise.all([loadFriendsData(), loadGroups(), loadChallenges(), loadNotifications()]);
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
    app.view = 'app';
    app.appView = 'dashboard';
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
  app.wellness = [];
  app.tests = [];
  app.friends = [];
  app.friendRequests = [];
  app.friendRequestsSent = [];
  app.friendFeed = [];
  app.groups = [];
  app.challenges = [];
  app.notifications = [];
  app.view = 'landing';
}
