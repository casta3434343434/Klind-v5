<script>
  import { app } from '../stores/appState.svelte.js';
  import { openNewSession } from '../stores/sessionModal.svelte.js';
  import SessionMini from './SessionMini.svelte';
  import CragsAdmin from './crags/CragsAdmin.svelte';

  const sorted = $derived([...app.sessions]
    .filter(s => s.disciplina === 'falesia')
    .sort((a, b) => b.data.localeCompare(a.data)));

  const canEditCrags = $derived(!!app.profile?.can_edit_crags);
  let showAdmin = $state(false);
</script>

<div class="main-header">
  <div>
    <h1>Falesia</h1>
    <p class="sub">{sorted.length} sessioni outdoor.</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button class="btn btn-primary" onclick={() => openNewSession('falesia')}>+ Nuova sessione falesia</button>
    {#if canEditCrags}
      <button class="btn btn-ghost" onclick={() => showAdmin = !showAdmin}>{showAdmin ? 'Chiudi database' : 'Database falesie'}</button>
    {/if}
  </div>
</div>

{#if showAdmin && canEditCrags}
  <div style="margin-bottom:16px;">
    <CragsAdmin />
  </div>
{/if}

<div class="panel">
  {#if sorted.length}
    {#each sorted as r (r.id)}
      <SessionMini {r} />
    {/each}
  {:else}
    <div class="empty-state">Nessuna sessione in falesia ancora. Registrane una!</div>
  {/if}
</div>
