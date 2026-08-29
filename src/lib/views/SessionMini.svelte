<script>
  import { DISCIPLINE_LABELS, SESSION_MOODS, LEAD_ASCENT_MODES } from '../constants.js';
  import { sessionGrade, displaySessionGrade } from '../utils/grades.js';

  let { r } = $props();

  const grade = $derived(sessionGrade(r, r.disciplina));
  const blocchi = $derived(r.blocchi || []);
  const mood = $derived(SESSION_MOODS.find(m => m.id === r.mood));
  const ascentModes = $derived(r.disciplina === 'lead'
    ? [...new Set(blocchi.map(b => b.modalita).filter(Boolean))].map(mode => LEAD_ASCENT_MODES.find(o => o.id === mode)?.label || mode)
    : []);
</script>

<div class="session-mini">
  {#if mood}<img src={mood.img} alt={mood.label} title={mood.label} style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex-shrink:0;">{/if}
  <div style="flex:1;min-width:0;">
    <div>
      <span class="chip chip-{r.disciplina}">{DISCIPLINE_LABELS[r.disciplina] || r.disciplina}</span>
      {#if grade} <b>{displaySessionGrade(r, grade)}</b>{/if}
      {#if blocchi.length} · {blocchi.length} {r.disciplina === 'lead' ? 'vie' : 'elementi'}{/if}
      {#if r.luogo} · {r.luogo}{/if}
      {#if ascentModes.length} · {ascentModes.join(', ')}{/if}
    </div>
    <div style="color:var(--muted);font-size:14px;">
      {r.data.split('-').reverse().join('/')} · {r.durata || '—'} min{#if r.riscaldamento} · riscaldamento {r.riscaldamento} min{/if}
    </div>
  </div>
</div>
