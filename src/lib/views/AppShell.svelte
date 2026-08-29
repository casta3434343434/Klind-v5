<script>
  import { app, setLanguage } from '../stores/appState.svelte.js';
  import { klindLogo, I18N, DEVELOPER_USER_ID } from '../constants.js';
  import { logout } from '../api/auth.js';
  import { setThemeMode } from '../utils/theme.js';
  import Dashboard from './Dashboard.svelte';
  import History from './History.svelte';
  import Calendar from './Calendar.svelte';
  import Progress from './Progress.svelte';
  import Tests from './Tests.svelte';
  import Wellness from './Wellness.svelte';
  import Social from './Social.svelte';
  import Falesia from './Falesia.svelte';
  import Profile from './Profile.svelte';
  import NotifBell from './social/NotifBell.svelte';
  import SessionModal from './session/SessionModal.svelte';
  import DeleteConfirm from './session/DeleteConfirm.svelte';

  const t = (key) => I18N[app.language]?.[key] || I18N.it[key] || key;

  function onThemeChange(e) {
    setThemeMode(e.target.value);
  }
  function onLanguageChange(e) {
    setLanguage(e.target.value);
  }

  const navs = $derived([
    { id: 'dashboard', label: t('nav_home') },
    { id: 'calendar', label: t('nav_calendar') },
    { id: 'progress', label: t('nav_progress') },
    { id: 'tests', label: t('nav_tests') },
    { id: 'wellness', label: t('nav_wellness') },
    { id: 'falesie', label: t('nav_falesie') },
    { id: 'profile', label: t('nav_profile') },
    { id: 'social', label: t('nav_social') },
    { id: 'history', label: t('nav_history') }
  ]);

  const IMPLEMENTED = new Set(['dashboard', 'history', 'calendar', 'progress', 'tests', 'wellness', 'social', 'falesie', 'profile']);

  function goView(id) {
    app.appView = id;
    app.mobileMenuOpen = false;
  }

  const isVerified = $derived(!!app.profile?.can_edit_crags);
  const isDeveloper = $derived(app.authUser?.id === DEVELOPER_USER_ID || !!app.profile?.is_developer);
</script>

{#snippet themeControls()}
  <div class="theme-controls">
    <h4>Tema</h4>
    <div class="field">
      <label for="themeMode">Aspetto</label>
      <select id="themeMode" value={app.themeMode} onchange={onThemeChange}>
        <option value="light">Chiaro</option>
        <option value="dark">Scuro</option>
      </select>
    </div>
    <div class="field">
      <label for="languageSelect">{t('lang_label')}</label>
      <select id="languageSelect" value={app.language} onchange={onLanguageChange}>
        <option value="it">Italiano</option>
        <option value="en">English</option>
      </select>
    </div>
  </div>
{/snippet}

<div class="app-shell">
  <div class="sidebar">
    <div class="brand" style="justify-content:space-between;display:flex;align-items:center;">
      {@html klindLogo} KLIND <NotifBell />
    </div>
    <button type="button" class="mobile-nav-toggle" aria-label="Apri menu" onclick={() => app.mobileMenuOpen = !app.mobileMenuOpen}>
      <span class="hamburger-lines"><span></span><span></span><span></span></span>
    </button>
    <nav>
      {#each navs as n}
        <button class="side-link {app.appView === n.id ? 'active' : ''}" onclick={() => goView(n.id)}>{n.label}</button>
      {/each}
    </nav>
    {@render themeControls()}
    <div class="mobile-nav-menu {app.mobileMenuOpen ? '' : 'hidden'}">
      {#each navs as n}
        <button class="side-link {app.appView === n.id ? 'active' : ''}" onclick={() => goView(n.id)}>{n.label}</button>
      {/each}
      <button class="side-link" onclick={logout}>Esci</button>
      {@render themeControls()}
    </div>
    <div class="user-box">
      <div class="uname">
        {app.user}
        {#if isVerified}<span class="verified-badge" title="Utente verificato">✓</span>{/if}
        {#if isDeveloper}<span class="developer-badge">Developer</span>{/if}
      </div>
      <button class="btn btn-ghost btn-sm btn-block" onclick={logout}>Esci</button>
    </div>
  </div>
  <div class="main">
    {#if IMPLEMENTED.has(app.appView)}
      {#if app.appView === 'dashboard'}<Dashboard />{/if}
      {#if app.appView === 'history'}<History />{/if}
      {#if app.appView === 'calendar'}<Calendar />{/if}
      {#if app.appView === 'progress'}<Progress />{/if}
      {#if app.appView === 'tests'}<Tests />{/if}
      {#if app.appView === 'wellness'}<Wellness />{/if}
      {#if app.appView === 'social'}<Social />{/if}
      {#if app.appView === 'falesie'}<Falesia />{/if}
      {#if app.appView === 'profile'}<Profile />{/if}
    {:else}
      <div class="empty-state" style="margin-top:40px;">
        Questa sezione arriva in una fase successiva del porting (vedi PLAN.md) — per ora usa la versione precedente per {navs.find(n => n.id === app.appView)?.label.toLowerCase()}.
      </div>
    {/if}
  </div>
</div>
<SessionModal />
<DeleteConfirm />
