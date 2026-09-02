<script>
  import { app } from '../stores/appState.svelte.js';
  import { DOW, MONTHS, DISCIPLINE_LABELS } from '../constants.js';
  import { today, fmt, parseDate } from '../utils/dates.js';
  import { sessionDisciplines, sessionGrade, displaySessionGrade } from '../utils/grades.js';
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

  function dayDisciplines(sessions) {
    return [...new Set(sessions.flatMap(session => sessionDisciplines(session)))];
  }

  function dayBackground(disciplines) {
    if (disciplines.length < 2) return '';
    const colors = disciplines.map(disc => `color-mix(in srgb, var(--${disc === 'lead' ? 'vertical' : disc === 'moonboard' ? 'moon' : disc}) 24%, transparent)`);
    if (colors.length === 2) return `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)`;
    const step = 100 / colors.length;
    const stops = colors.map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`).join(', ');
    return `conic-gradient(from -45deg, ${stops})`;
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
        {@const disciplines = dayDisciplines(sess)}
        {@const disc = disciplines[0]}
        <div
          class="cal-cell {ds === todayS ? 'today' : ''} {disc ? `has-session-${disc}` : ''} {disciplines.length > 1 ? 'has-multi-session' : ''} {ds === dayPanel ? 'selected-day' : ''}"
          style={dayBackground(disciplines) ? `background:${dayBackground(disciplines)};` : undefined}
          onclick={() => openDay(ds)}
        >
          <div class="d">{d}</div>
          {#if sess.length}<div style="font-size:14px;color:var(--muted);">{sess.length}</div>{/if}
        </div>
      {/if}
    {/each}
  </div>
  <div class="calendar-legend">
    <span><span class="legend-dot" style="background:var(--boulder);"></span>Boulder</span>
    <span><span class="legend-dot" style="background:var(--vertical);"></span>Vertical</span>
    <span><span class="legend-dot" style="background:var(--moon);"></span>Moonboard</span>
    <span><span class="legend-dot" style="background:var(--speed);"></span>Speed</span>
    <span><span class="legend-dot" style="background:var(--circuiti);"></span>Circuiti</span>
    <span><span class="legend-dot" style="background:var(--falesia);"></span>Falesia</span>
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
        <div class="session-mini" onclick={() => openEditSession(r)} style="cursor:pointer;">
          <div>
            {#each sessionDisciplines(r) as disc}<span class="chip chip-{disc}">{DISCIPLINE_LABELS[disc]}</span> {#if sessionGrade(r, disc)}<b>{displaySessionGrade(r, sessionGrade(r, disc), undefined, disc)}</b> {/if}{/each}
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
