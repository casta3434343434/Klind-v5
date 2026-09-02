<script>
  import { app } from '../stores/appState.svelte.js';
  import { DOW, MONTHS, DISCIPLINE_LABELS } from '../constants.js';
  import { today, fmt, parseDate } from '../utils/dates.js';
  import { sessionGrade, displaySessionGrade } from '../utils/grades.js';
  import { openNewSession, openEditSession } from '../stores/sessionModal.svelte.js';

  let calMonth = $state(new Date());
  let dayPanel = $state(null);

  const todayS = today();

  const byDate = $derived.by(() => {
    const map = {};
    app.sessions.forEach(s => { (map[s.data] = map[s.data] || []).push(s); });
    return map;
  });

  const weeks = $derived.by(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  });

  function cellDate(d) {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    return fmt(new Date(y, m, d));
  }

  function navMonth(delta) {
    if (delta === 0) { calMonth = new Date(); return; }
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    calMonth = new Date(y, m + delta, 1);
  }

  function openDay(ds) {
    dayPanel = dayPanel === ds ? null : ds;
  }

  const dayList = $derived(dayPanel ? (app.sessions.filter(s => s.data === dayPanel)) : []);
</script>

<div class="main-header"><div><h1>Calendario</h1><p class="sub">Clicca un giorno per vedere le sessioni.</p></div></div>

<div class="panel">
  <div class="cal-head">
    <div class="month-label">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</div>
    <div class="cal-nav">
      <button onclick={() => navMonth(-1)}>‹</button>
      <button onclick={() => navMonth(0)}>Oggi</button>
      <button onclick={() => navMonth(1)}>›</button>
    </div>
  </div>
  <div class="cal-grid">
    {#each DOW as d}<div class="cal-dow">{d}</div>{/each}
    {#each weeks as d}
      {#if d === null}
        <div class="cal-cell empty"></div>
      {:else}
        {@const ds = cellDate(d)}
        {@const sess = byDate[ds] || []}
        {@const disc = sess[0]?.disciplina}
        <div
          class="cal-cell {ds === todayS ? 'today' : ''} {disc ? `has-session-${disc}` : ''} {ds === dayPanel ? 'selected-day' : ''}"
          onclick={() => openDay(ds)}
        >
          <div class="d">{d}</div>
          {#if sess.length}<div style="font-size:14px;color:var(--muted);">{sess.length}</div>{/if}
        </div>
      {/if}
    {/each}
  </div>
  <div style="display:flex; gap:15px; margin-top:12px; font-size:15px; color:var(--muted);">
    <span><span class="legend-dot" style="background:var(--boulder);"></span>Boulder</span>
    <span><span class="legend-dot" style="background:var(--vertical);"></span>Vertical</span>
    <span><span class="legend-dot" style="background:var(--moon);"></span>Moonboard</span>
    <span><span class="legend-dot" style="background:var(--speed);"></span>Speed</span>
  </div>
</div>

{#if dayPanel}
  <div class="panel">
    <div class="panel-head">
      <h3>{parseDate(dayPanel).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick={() => openNewSession('boulder', dayPanel)}>+ Aggiungi</button>
        <button class="btn btn-ghost btn-sm" onclick={() => dayPanel = null}>Chiudi</button>
      </div>
    </div>
    {#if dayList.length}
      {#each dayList as r}
        {@const grade = sessionGrade(r, r.disciplina)}
        <div class="session-mini" onclick={() => openEditSession(r)} style="cursor:pointer;">
          <div>
            <span class="chip chip-{r.disciplina}">{DISCIPLINE_LABELS[r.disciplina]}</span>
            {grade ? displaySessionGrade(r, grade) : ''}
            {#if r.luogo}· {r.luogo}{/if}
          </div>
          <div>{r.durata || '—'} min</div>
        </div>
      {/each}
    {:else}
      <div class="empty-state">Nessuna sessione questo giorno.</div>
    {/if}
  </div>
{/if}
