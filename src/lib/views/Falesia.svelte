<script>
  import { app } from '../stores/appState.svelte.js';
  import { DISCIPLINE_LABELS, LEAD_ASCENT_MODES, SESSION_MOODS } from '../constants.js';
  import { sessionGrade, displaySessionGrade } from '../utils/grades.js';
  import { openNewSession, openEditSession } from '../stores/sessionModal.svelte.js';
  import CragsAdmin from './falesia/CragsAdmin.svelte';

  const sorted = $derived([...app.sessions].filter(s => s.disciplina === 'falesia').sort((a, b) => b.data.localeCompare(a.data)));
  const showAdmin = $derived(app.showCragsAdminInsideFalesia);

  function ascentModes(r) {
    const ids = [...new Set((r.blocchi || []).map(c => c.modalita).filter(Boolean))];
    return ids.map(id => LEAD_ASCENT_MODES.find(o => o.id === id)?.label || id);
  }
</script>

<div class="main-header">
  <div><h1>Falesia</h1><p class="sub">{sorted.length} sessioni outdoor.</p></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button class="btn btn-primary" onclick={() => openNewSession('falesia')}>+ Nuova sessione falesia</button>
    {#if app.profile?.can_edit_crags}
      <button class="btn btn-ghost" onclick={() => app.showCragsAdminInsideFalesia = !showAdmin}>{showAdmin ? 'Chiudi database' : 'Database falesie'}</button>
    {/if}
  </div>
</div>

{#if showAdmin}
  <div style="margin-bottom:16px;"><CragsAdmin /></div>
{/if}

<div class="panel">
  {#if sorted.length}
    {#each sorted as r (r.id)}
      {@const grade = sessionGrade(r, r.disciplina)}
      {@const mood = SESSION_MOODS.find(m => m.id === r.mood)}
      {@const modes = ascentModes(r)}
      <div class="session-mini" onclick={() => openEditSession(r)} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && openEditSession(r)} style="cursor:pointer;">
        {#if mood}<img src={mood.img} alt={mood.label} title={mood.label} style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex-shrink:0;">{/if}
        <div style="flex:1;min-width:0;">
          <div>
            <span class="chip chip-{r.disciplina}">{DISCIPLINE_LABELS[r.disciplina] || r.disciplina}</span>
            {#if grade}<b> {displaySessionGrade(r, grade)}</b>{/if}
            {#if (r.blocchi || []).length} · {(r.blocchi || []).length} vie{/if}
            {#if r.luogo} · {r.luogo}{/if}
            {#if modes.length} · {modes.join(', ')}{/if}
          </div>
          <div style="color:var(--muted);font-size:14px;">{r.data.split('-').reverse().join('/')} · {r.durata || '—'} min{#if r.riscaldamento} · riscaldamento {r.riscaldamento} min{/if}</div>
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna sessione in falesia ancora. Registrane una!</div>
  {/if}
</div>
