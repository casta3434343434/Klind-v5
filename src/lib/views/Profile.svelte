<script>
  import { app } from '../stores/appState.svelte.js';
  import { DEVELOPER_USER_ID } from '../constants.js';
  import { updateProfile } from '../api/profile.js';
  import { resizeAvatar } from '../utils/avatar.js';

  const isVerified = $derived(!!app.profile?.can_edit_crags);
  const isDeveloper = $derived(app.authUser?.id === DEVELOPER_USER_ID || !!app.profile?.is_developer);

  let username = $state(app.profile?.username || app.user || '');
  let altezza = $state(app.profile?.altezza || '');
  let eta = $state(app.profile?.eta || '');
  let peso = $state(app.profile?.peso || '');
  let apertura = $state(app.profile?.apertura || '');
  let anni = $state(app.profile?.anni || '');
  let obiettivo = $state(app.profile?.obiettivo || 3);

  let avatarFile = $state(null);
  let avatarPreview = $state(app.profile?.avatar_url || '');
  let saved = $state('');
  let error = $state('');
  let busy = $state(false);

  async function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      avatarFile = file;
      avatarPreview = await resizeAvatar(file);
    } catch {
      alert('Impossibile leggere questa immagine.');
    }
  }

  async function submit(e) {
    e.preventDefault();
    saved = '';
    error = '';
    busy = true;
    try {
      const avatarUrl = avatarFile ? await resizeAvatar(avatarFile) : app.profile?.avatar_url || '';
      const profile = {
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl,
        altezza, eta, peso, apertura, anni,
        obiettivo: parseInt(obiettivo) || 3,
        scala: app.profile?.scala || 'font'
      };
      const result = await updateProfile(app.authUser.id, profile);
      if (result.ok) {
        app.profile = { ...app.profile, ...profile };
        app.user = profile.username;
        saved = '✓ Salvato';
      } else {
        error = result.message;
      }
    } finally {
      busy = false;
    }
  }
</script>

<div class="main-header">
  <div><h1>Profilo</h1><p class="sub">Gestisci i tuoi dati personali e il tuo profilo.</p></div>
</div>
<div class="panel" style="max-width:820px;">
  <h3>Il tuo profilo</h3>
  <form onsubmit={submit}>
    <div class="avatar-upload">
      <div class="profile-avatar-wrap">
        <div class="avatar profile-avatar">
          {#if avatarPreview}<img class="avatar" src={avatarPreview} alt="">{:else}Foto{/if}
        </div>
        <div class="profile-developer-badge">
          {#if isVerified}<span class="verified-badge" title="Utente verificato" aria-label="Utente verificato">✓</span>{/if}
          {#if isDeveloper}<span class="developer-badge">Developer</span>{/if}
        </div>
      </div>
      <div>
        <label for="p_avatar" class="btn btn-ghost btn-sm">Scegli immagine</label>
        <input type="file" id="p_avatar" accept="image/*" onchange={onAvatarChange}>
        <div class="sub" style="margin:6px 0 0;font-size:12px;">Immagine quadrata consigliata</div>
      </div>
    </div>
    <div class="field"><label for="p_username">Nome utente</label><input type="text" id="p_username" autocomplete="username" minlength="3" required bind:value={username}></div>
    <div class="field-row">
      <div class="field"><label for="p_altezza">Altezza (cm)</label><input type="number" id="p_altezza" bind:value={altezza}></div>
      <div class="field"><label for="p_eta">Età</label><input type="number" id="p_eta" bind:value={eta}></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="p_peso">Peso (kg)</label><input type="number" step="0.1" id="p_peso" bind:value={peso}></div>
      <div class="field"><label for="p_apertura">Apertura (cm)</label><input type="number" id="p_apertura" bind:value={apertura}></div>
    </div>
    <div class="field-row">
      <div class="field"><label for="p_anni">Anni arrampicata</label><input type="number" step="0.5" id="p_anni" bind:value={anni}></div>
      <div class="field"><label for="p_obiettivo">Obiettivo/settimana</label><input type="number" id="p_obiettivo" bind:value={obiettivo}></div>
    </div>
    <button type="submit" class="btn btn-primary" disabled={busy}>Salva profilo</button>
    {#if saved}<span style="color:var(--lime);margin-left:12px;">{saved}</span>{/if}
    {#if error}<span style="color:var(--rust);display:block;margin-top:8px;">{error}</span>{/if}
  </form>
</div>
