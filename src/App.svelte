<script>
  import { app } from './lib/stores/appState.svelte.js';
  import { restoreSession } from './lib/api/auth.js';
  import Landing from './lib/views/Landing.svelte';
  import Auth from './lib/views/Auth.svelte';
  import AppShell from './lib/views/AppShell.svelte';
  import { installTranslations } from './lib/utils/i18n.js';

  let checkingSession = $state(true);
  let translationObserver;

  $effect(() => {
    restoreSession().finally(() => { checkingSession = false; });
  });

  $effect(() => {
    const language = app.language;
    translationObserver?.disconnect();
    translationObserver = installTranslations(language);
    return () => translationObserver?.disconnect();
  });
</script>

{#if checkingSession}
  <div class="auth-wrap"><p class="sub">Caricamento…</p></div>
{:else if app.view === 'landing'}
  <Landing />
{:else if app.view === 'auth'}
  <Auth />
{:else if app.view === 'app'}
  <AppShell />
{/if}
