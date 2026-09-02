<script>
  import { app } from '../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS, SESSION_MOODS } from '../constants.js';
  import { today, parseDate, localDateKey, startOfWeek } from '../utils/dates.js';
  import { bestGrade, displayGrade, sessionDisciplines } from '../utils/grades.js';
  import { openNewSession } from '../stores/sessionModal.svelte.js';

  let homePeriod = $state('all'); // 'all' | 'week'

  function computeStreak(sessions) {
    const days = new Set(sessions.map(s => s.data));
    let cur = new Date();
    if (!days.has(localDateKey(cur))) cur.setDate(cur.getDate() - 1);
    let streak = 0;
    while (days.has(localDateKey(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
    const sorted = [...days].sort();
    let best = 0, run = 0, prev = null;
    sorted.forEach(dateStr => {
      run = prev && (parseDate(dateStr) - parseDate(prev)) / 86400000 === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = dateStr;
    });
    return { current: streak, best };
  }

  const homeSessions = $derived(homePeriod === 'week'
    ? app.sessions.filter(s => parseDate(s.data) >= startOfWeek(new Date()))
    : app.sessions);

  const lastSession = $derived([...homeSessions].sort((a, b) => b.data.localeCompare(a.data))[0]);
  const lastMood = $derived(lastSession?.mood ? SESSION_MOODS.find(m => m.id === lastSession.mood) : null);

  const startPrevWeek = $derived.by(() => { const d = startOfWeek(new Date()); d.setDate(d.getDate() - 7); return d; });
  const recentSessions = $derived([...app.sessions]
    .filter(s => parseDate(s.data) >= startPrevWeek)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5));

  const totalHours = $derived(homeSessions.reduce((t, s) => t + (parseFloat(s.durata) || 0), 0) / 60);
  const streak = $derived(computeStreak(app.sessions));
  const bestByDisc = $derived(DISCIPLINES.map(disc => ({ disc, grade: bestGrade(disc, homeSessions) })));

</script>

<div class="main-header">
  <div>
    <h1>Ciao, {app.user}</h1>
    <p class="sub">Ecco il riepilogo.</p>
    <div class="home-period">
      <div class="field">
        <label for="homePeriod">Periodo</label>
        <select id="homePeriod" bind:value={homePeriod}>
          <option value="all">Di sempre</option>
          <option value="week">Della settimana</option>
        </select>
      </div>
    </div>
  </div>
  <button class="btn btn-primary" onclick={() => openNewSession('boulder')}>+ Registra sessione</button>
</div>

<div class="cards-row" style="grid-template-columns:repeat(4,1fr);">
  <div class="stat-card">
    <div class="k">{homePeriod === 'week' ? 'Obbiettivo settimanale' : 'Sessioni nel periodo'}</div>
    <div class="v">{homeSessions.length}{#if homePeriod === 'week'}<small> / {app.profile?.obiettivo || 3}</small>{/if}</div>
  </div>
  <div class="stat-card">
    <div class="k">Ore totali</div>
    <div class="v">{totalHours ? totalHours.toFixed(1) : '—'}{#if totalHours}{' '}<small>h</small>{/if}</div>
  </div>
  <div class="stat-card">
    <div class="k">Ultima sessione</div>
    <div class="v" style="font-size:22px;">{lastSession ? lastSession.data.split('-').reverse().join('/') : '—'}</div>
    {#if lastMood}
      <div class="sub" style="margin-top:4px;display:flex;align-items:center;gap:6px;">
        <img src={lastMood.img} alt={lastMood.label} style="width:20px;height:20px;border-radius:5px;object-fit:cover;">{lastMood.label}
      </div>
    {/if}
  </div>
  <div class="stat-card">
    <div class="k">Streak attuale</div>
    <div class="v">{streak.current}{' '}<small>{streak.current === 1 ? 'giorno' : 'giorni'}</small></div>
    {#if streak.best >= 7}
      <div class="sub" style="margin-top:4px;">Costanza: {streak.best >= 30 ? '30+' : '7+'} giorni di fila <span style="color:var(--muted);">(record: {streak.best})</span></div>
    {/if}
  </div>
</div>

<div class="cards-row" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">
  {#each bestByDisc as { disc, grade }}
    <div class="stat-card">
      <div class="k">Best {DISCIPLINE_LABELS[disc]}</div>
      <div class="v">{grade ? displayGrade(disc, grade, disc === 'boulder' ? 'king' : undefined) : '—'}</div>
    </div>
  {/each}
</div>

<div class="panel">
  <div class="panel-head"><h3>Ultime sessioni</h3><button class="btn btn-ghost btn-sm" onclick={() => app.appView = 'history'}>Vedi tutte</button></div>
  {#if recentSessions.length}
    {#each recentSessions as r}
      <div class="session-mini">
        <div>
          {#each sessionDisciplines(r) as disc}<span class="chip chip-{disc}">{DISCIPLINE_LABELS[disc]}</span>{/each}
          {r.data.split('-').reverse().join('/')}
        </div>
        <div>{r.luogo || ''}</div>
      </div>
    {/each}
  {:else}
    <div class="empty-state"><div class="big">Nessun dato</div>Nessuna sessione ancora.</div>
  {/if}
</div>
