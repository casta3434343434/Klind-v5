<script>
  import { app } from '../stores/appState.svelte.js';
  import { klindLogo } from '../constants.js';
  import { handleLogin, handleSignup } from '../api/auth.js';

  let email = $state((app.authMode === 'login' && localStorage.getItem('klindRememberedEmail')) || '');
  let password = $state('');
  let username = $state('');
  let rememberLogin = $state(localStorage.getItem('klindRememberLogin') === 'true');
  let showPassword = $state(false);

  const isLogin = $derived(app.authMode === 'login');

  function switchMode(mode) {
    app.authMode = mode;
    app.authError = '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password || (!isLogin && !username.trim())) {
      app.authError = 'Compila tutti i campi.';
      return;
    }
    if (isLogin) {
      if (rememberLogin) {
        localStorage.setItem('klindRememberedEmail', emailNorm);
        localStorage.setItem('klindRememberLogin', 'true');
      } else {
        localStorage.removeItem('klindRememberedEmail');
        localStorage.removeItem('klindRememberLogin');
      }
      await handleLogin(emailNorm, password);
    } else {
      await handleSignup(emailNorm, password, username.trim().toLowerCase());
    }
  }
</script>

<nav class="nav"><div class="brand" style="cursor:pointer" onclick={() => app.view = 'landing'}>{@html klindLogo} KLIND</div></nav>

<div class="auth-wrap">
  <div class="auth-card">
    <h2>{isLogin ? 'Bentornato' : 'Crea account'}</h2>
    <p class="sub">{isLogin ? 'Accedi per continuare.' : 'Username e password per il tuo spazio.'}</p>
    <form onsubmit={onSubmit}>
      {#if !isLogin}
        <div class="field"><label>Username</label><input type="text" bind:value={username} autocomplete="username" required></div>
      {/if}
      <div class="field"><label>Email</label><input type="email" bind:value={email} autocomplete={isLogin ? 'username' : 'email'} required></div>
      <div class="field password-field">
        <label for="authPass">Password</label>
        <input id="authPass" type={showPassword ? 'text' : 'password'} bind:value={password} autocomplete={isLogin ? 'current-password' : 'new-password'} required minlength="6">
        <button type="button" class="password-toggle" aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} onclick={() => showPassword = !showPassword}>
          {#if showPassword}
            <svg class="password-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"></path><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.3 18.3 0 0 1-3.1 3.8"></path><path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8"></path><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"></path></svg>
          {:else}
            <svg class="password-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>
          {/if}
        </button>
      </div>
      {#if isLogin}
        <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-family:inherit;font-size:14px;color:var(--muted);margin:-4px 0 16px;cursor:pointer;">
          <input type="checkbox" bind:checked={rememberLogin} style="width:auto;margin:0;"> Ricordami su questo dispositivo
        </label>
      {/if}
      {#if app.authError}<div class="error-msg">{app.authError}</div>{/if}
      <button type="submit" class="btn btn-primary btn-block" disabled={app.authBusy}>{app.authBusy ? 'Attendere…' : (isLogin ? 'Accedi' : 'Crea account')}</button>
    </form>
    <div class="auth-switch">
      {#if isLogin}
        Non hai un account? <button onclick={() => switchMode('signup')}>Registrati</button>
      {:else}
        Hai già un account? <button onclick={() => switchMode('login')}>Accedi</button>
      {/if}
    </div>
  </div>
</div>
