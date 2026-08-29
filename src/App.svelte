<script>
  import { app } from './lib/stores/appState.svelte.js';
  import { restoreSession } from './lib/api/auth.js';
  import Landing from './lib/views/Landing.svelte';
  import Auth from './lib/views/Auth.svelte';
  import AppShell from './lib/views/AppShell.svelte';

  let checkingSession = $state(true);

  $effect(() => {
    restoreSession().finally(() => { checkingSession = false; });
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
