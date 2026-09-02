<script>
  import { app } from '../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS, ROUTE_SCALE, BOULDER_SCALE, BOULDER_SCALES, LEAD_SCALES, GRIP_TYPES } from '../constants.js';
  import { today, parseDate, localDateKey, startOfWeek } from '../utils/dates.js';
  import { sessionGrade, sessionDisciplines, sessionClimbs, normalizedGradeValue, commonFrenchGradeFromNormalized, chartGradeLabel, displayGrade } from '../utils/grades.js';
  import { chartTheme, chartFill, discColor, disciplineThemeKey } from '../utils/charts.js';
  import { loadChart } from '../utils/chartLoader.js';
  import { buildHeatmap } from '../utils/heatmap.js';

  let hoursMode = $state('all');    // 'all' | 'week'
  let sessionsMode = $state('all');
  let avgHoursMode = $state('all');
  let progressFilter = $state('boulder'); // disciplina o 'summary'
  let progressRange = $state('week');     // per il grafico "media gradi"
  let showGradeTable = $state(false);
  let showGripGuide = $state(false);
  let showGradePyramid = $state(false);
  let pyramidDiscipline = $state('boulder');
  let gradeTableDisc = $state('boulder');

  const weekStart = startOfWeek(new Date());

  const totalHours = $derived.by(() => {
    const s = hoursMode === 'week' ? app.sessions.filter(x => parseDate(x.data) >= weekStart) : app.sessions;
    return s.reduce((sum, x) => sum + (parseFloat(x.durata) || 0) / 60, 0);
  });
  const sessionsCount = $derived.by(() => {
    const s = sessionsMode === 'week' ? app.sessions.filter(x => parseDate(x.data) >= weekStart) : app.sessions;
    return s.length;
  });
  const avgHours = $derived.by(() => {
    const s = avgHoursMode === 'week' ? app.sessions.filter(x => parseDate(x.data) >= weekStart) : app.sessions;
    return s.length ? s.reduce((sum, x) => sum + (parseFloat(x.durata) || 0) / 60, 0) / s.length : 0;
  });

  function progressStartDate(range) {
    if (range === 'all') { const dates = app.sessions.map(s => s.data).filter(Boolean).sort(); return dates[0] || today(); }
    const latest = app.sessions.map(s => s.data).filter(Boolean).sort().pop();
    const start = latest ? parseDate(latest) : new Date();
    const offsets = { week: 7, month: 30, '3months': 90, '6months': 180, year: 365 };
    start.setDate(start.getDate() - (offsets[range] || 7));
    return localDateKey(start);
  }

  const rangedSessions = $derived.by(() => {
    const start = progressStartDate(progressRange);
    return app.sessions.filter(s => s.data >= start && s.data <= today());
  });

  const progressDisciplines = [...DISCIPLINES.map(id => ({ id, label: DISCIPLINE_LABELS[id] })), { id: 'summary', label: 'Sommaria' }];

  // --- grafici ---
  let gradeCanvas, avgCanvas, distCanvas;
  let charts = {};

  function destroyCharts() {
    Object.values(charts).forEach(c => c?.destroy());
    charts = {};
  }

  $effect(() => {
    const disc = progressFilter;
    const filtered = rangedSessions;
    void app.sessions.length; void disc; void progressRange;

    let cancelled = false;
    loadChart().then((Chart) => {
      if (cancelled) return;
      destroyCharts();
      const theme = chartTheme();
      Chart.defaults.color = theme.text;
      Chart.defaults.font.family = "'IBM Plex Mono', monospace";
      Chart.defaults.font.size = 12;

      if (gradeCanvas) {
        if (disc !== 'summary') {
          const pts = filtered
            .filter(s => sessionDisciplines(s).includes(disc) && sessionGrade(s, disc))
            .map(s => { const grado = sessionGrade(s, disc); return { x: s.data, y: normalizedGradeValue(disc, grado), grade: grado }; })
            .filter(p => p.y !== null && p.y >= 0)
            .sort((a, b) => a.x.localeCompare(b.x));

          if (pts.length) {
            charts.grade = new Chart(gradeCanvas, {
              type: 'line',
              data: { labels: pts.map(p => p.x.split('-').reverse().join('/')), datasets: [{ data: pts.map(p => p.y), rawGrades: pts.map(p => p.grade), borderColor: theme[disciplineThemeKey(disc)], backgroundColor: chartFill(theme[disciplineThemeKey(disc)], .14), fill: true, tension: .25, pointRadius: 4, pointBackgroundColor: theme[disciplineThemeKey(disc)] }] },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => chartGradeLabel(disc, c.dataset.rawGrades?.[c.dataIndex]) } } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { ticks: { color: theme.text, callback: v => commonFrenchGradeFromNormalized(v) }, grid: { color: theme.grid }, min: 0, max: ROUTE_SCALE.length - 1 } } }
            });
          } else {
            charts.grade = new Chart(gradeCanvas, { type: 'line', data: { labels: ['Nessun dato'], datasets: [{ data: [0], borderColor: theme.accent }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } } });
          }
        } else {
          const summaryDates = [...new Set(filtered.filter(s => sessionDisciplines(s).length).map(s => s.data))].sort();
          const datasets = DISCIPLINES.map(d => {
            const color = theme[disciplineThemeKey(d)];
            return {
              label: DISCIPLINE_LABELS[d],
              data: summaryDates.map(date => {
                const values = filtered.filter(s => s.data === date && sessionDisciplines(s).includes(d)).map(s => normalizedGradeValue(d, sessionGrade(s, d))).filter(v => v !== null);
                return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
              }),
              borderColor: color, backgroundColor: chartFill(color, .10), pointBackgroundColor: color, fill: true, tension: .25, spanGaps: true, pointRadius: 4
            };
          });
          charts.grade = new Chart(gradeCanvas, { type: 'line', data: { labels: summaryDates.map(d => d.split('-').reverse().join('/')), datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: theme.text } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y === null ? '—' : commonFrenchGradeFromNormalized(c.parsed.y)}` } } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { min: 0, max: ROUTE_SCALE.length - 1, grid: { color: theme.grid }, ticks: { color: theme.text, callback: v => commonFrenchGradeFromNormalized(v) } } } } });
        }
      }

      if (avgCanvas) {
        const byDate = {};
        filtered.forEach(s => {
          for (const disc of sessionDisciplines(s)) {
          const value = normalizedGradeValue(disc, sessionGrade(s, disc));
          if (value === null) continue;
          (byDate[s.data] = byDate[s.data] || []).push(value);
          }
        });
        const dates = Object.keys(byDate).sort();
        const values = dates.map(d => byDate[d].reduce((a, b) => a + b, 0) / byDate[d].length);
        charts.average = new Chart(avgCanvas, { type: 'line', data: { labels: dates.map(d => d.split('-').reverse().join('/')), datasets: [{ data: values, borderColor: theme.text, backgroundColor: chartFill(theme.text, .08), fill: true, tension: .25, pointRadius: 4, pointBackgroundColor: theme.text }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `Media: ${commonFrenchGradeFromNormalized(c.parsed.y)}` } } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { min: 0, max: ROUTE_SCALE.length - 1, grid: { color: theme.grid }, ticks: { color: theme.text, callback: v => commonFrenchGradeFromNormalized(v) } } } } });
      }

      if (distCanvas) {
        const counts = {};
        app.sessions.forEach(s => sessionDisciplines(s).forEach(disc => { counts[disc] = (counts[disc] || 0) + 1; }));
        const labels = Object.keys(counts).map(d => DISCIPLINE_LABELS[d] || d);
        const colors = Object.keys(counts).map(discColor);
        charts.dist = new Chart(distCanvas, { type: 'doughnut', data: { labels, datasets: [{ data: Object.values(counts), backgroundColor: colors, borderColor: theme.surface, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, color: theme.text } } } } });
      }
    });

    return () => { cancelled = true; destroyCharts(); };
  });

  const heatmapCells = $derived(buildHeatmap(app.sessions));
  const heatmapColors = ['var(--surface-2)', 'rgba(182,66,45,0.35)', 'rgba(182,66,45,0.65)', 'var(--lime)'];
  const pyramidRows = $derived.by(() => {
    const scale = ['lead', 'circuiti'].includes(pyramidDiscipline) ? ROUTE_SCALE : BOULDER_SCALE;
    const counts = {};
    const styled = ['lead', 'falesia'].includes(pyramidDiscipline);
    app.sessions.filter(session => sessionDisciplines(session).includes(pyramidDiscipline)).forEach(session => {
      sessionClimbs(session, pyramidDiscipline).forEach(block => {
        const grade = block.gradoUser || block.grado;
        if (!grade || !scale.includes(grade)) return;
        const style = styled ? (block.tipo || 'Altro') : 'Completati';
        counts[grade] ||= {};
        counts[grade][style] = (counts[grade][style] || 0) + 1;
      });
    });
    const rows = Object.entries(counts).map(([grade, styles]) => ({ grade, styles, total: Object.values(styles).reduce((sum, value) => sum + value, 0) }));
    return rows.sort((a, b) => scale.indexOf(a.grade) - scale.indexOf(b.grade));
  });
  const pyramidMax = $derived(Math.max(1, ...pyramidRows.map(row => row.total)));
  const pyramidStyles = $derived(['lead', 'falesia'].includes(pyramidDiscipline) ? ['Flash', 'Top/Progetto', 'Ripetizione', 'Altro'] : ['Completati']);
  const gripGuide = [
    { title: 'Tacche', description: 'Bordo sottile e netto: si afferra con la punta delle dita. Presa potente, da caricare progressivamente.' },
    { title: 'Svasi', description: 'Superficie arrotondata senza bordo: usa attrito, palmo aperto e peso del corpo sotto la presa.' },
    { title: 'Pinze', description: 'Presa tra pollice e dita, come una molletta. Richiede opposizione e controllo del pollice.' },
    { title: 'Maniglia', description: 'Presa grande e positiva che accoglie tutta la mano, utile per riposare e scuotere gli avambracci.' },
    { title: 'Tasca', description: 'Foro per una, due o tre dita: aumenta il carico lentamente e cura il riscaldamento.' },
    { title: 'Sottopresa', description: 'Si tira dal basso con il palmo verso l’alto. Piedi alti e corpo vicino alla parete aiutano il movimento.' },
    { title: 'Laterale', description: 'Presa verticale tirata di lato. Mantieni la spalla stabile e orienta il corpo nella direzione della trazione.' },
    { title: 'Volume', description: 'Superficie tridimensionale che si usa aderendo alla forma o cercando appigli nascosti sui suoi lati.' },
    { title: 'Piedi / Appoggio', description: 'Un buon appoggio scarica le braccia: usa punta e bordi della scarpetta con precisione.' }
  ];

  function gripIcon(title) {
    const common = 'viewBox="0 0 140 120" width="100%" height="120"';
    const hand = '<rect x="38" y="20" width="13" height="26" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/><rect x="58" y="14" width="13" height="30" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/><rect x="78" y="16" width="13" height="28" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/><rect x="98" y="22" width="13" height="24" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/>';
    const base = '<path d="M12 78 Q8 55 28 44 Q48 30 72 32 Q100 30 118 44 Q132 55 126 72 Q122 92 100 96 Q60 104 32 97 Q14 92 12 78Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><circle cx="70" cy="72" r="4" fill="none" stroke="var(--chalk)" stroke-width="1.5"/>';
    if (title === 'Tacche') return `<svg ${common}>${base}${hand}</svg>`;
    if (title === 'Svasi') return `<svg ${common}><path d="M20 60 Q15 30 48 20 Q85 10 112 32 Q132 50 122 78 Q108 102 72 105 Q35 106 20 85 Q12 72 20 60Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><rect x="32" y="35" width="12" height="20" rx="6" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2" transform="rotate(-15 38 45)"/><rect x="52" y="26" width="12" height="22" rx="6" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2"/><rect x="72" y="26" width="12" height="22" rx="6" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2"/><rect x="90" y="33" width="12" height="20" rx="6" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2" transform="rotate(15 96 43)"/><circle cx="75" cy="75" r="4" fill="none" stroke="var(--chalk)" stroke-width="1.5"/></svg>`;
    if (title === 'Pinze') return `<svg ${common}><path d="M70 10 Q40 15 32 45 Q26 70 38 92 Q50 110 72 108 Q60 95 58 70 Q56 40 70 10Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><rect x="6" y="42" width="13" height="26" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(-20 12 55)"/><rect x="66" y="42" width="12" height="24" rx="6" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(15 72 54)"/></svg>`;
    if (title === 'Maniglia') return `<svg ${common}><path d="M14 58 Q10 28 46 18 Q88 6 118 30 Q138 50 122 78 Q102 106 55 102 Q18 98 14 58Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><path d="M30 62 Q58 90 105 64 Q104 46 60 48 Q34 50 30 62Z" fill="var(--surface)" stroke="var(--chalk)" stroke-width="2"/>${hand}<circle cx="98" cy="35" r="4" fill="none" stroke="var(--chalk)" stroke-width="1.5"/></svg>`;
    if (title === 'Tasca') return `<svg ${common}><path d="M18 55 Q13 25 50 18 Q92 10 120 32 Q136 52 118 78 Q95 105 50 98 Q15 90 18 55Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><ellipse cx="70" cy="58" rx="22" ry="18" fill="var(--surface)" stroke="var(--lime)" stroke-width="2.5"/><rect x="63" y="30" width="13" height="26" rx="6.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/></svg>`;
    if (title === 'Sottopresa') return `<svg ${common}><path d="M18 28 Q45 10 85 16 Q118 20 125 45 Q130 64 105 68 Q60 72 28 60 Q10 50 18 28Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><rect x="34" y="64" width="11" height="26" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(10 40 77)"/><rect x="58" y="68" width="11" height="28" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5"/><rect x="82" y="64" width="11" height="26" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(-10 88 77)"/></svg>`;
    if (title === 'Laterale') return `<svg ${common}><path d="M48 10 Q28 14 24 42 Q20 70 26 92 Q32 110 55 106 Q72 100 68 75 Q75 45 62 18 Q56 10 48 10Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><rect x="72" y="38" width="11" height="24" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(70 77 50)"/><rect x="72" y="55" width="11" height="24" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2.5" transform="rotate(70 77 67)"/><path d="M108 56 L122 63 L108 70Z" fill="var(--chalk)"/></svg>`;
    if (title === 'Volume') return `<svg ${common}><path d="M22 92 L42 18 L118 32 L102 102Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 18 L72 40 L118 32" fill="none" stroke="var(--chalk)" stroke-width="2" stroke-linejoin="round"/><rect x="42" y="60" width="11" height="20" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2" transform="rotate(-10 47 70)"/><rect x="58" y="55" width="11" height="22" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2"/><rect x="74" y="58" width="11" height="20" rx="5.5" fill="var(--surface-2)" stroke="var(--lime)" stroke-width="2" transform="rotate(10 79 68)"/></svg>`;
    return `<svg ${common}><path d="M35 52 Q30 32 52 25 Q75 18 88 35 Q98 50 84 64 Q65 80 45 72 Q30 66 35 52Z" fill="var(--surface-2)" stroke="var(--chalk)" stroke-width="2.5"/><circle cx="60" cy="48" r="4" fill="none" stroke="var(--chalk)" stroke-width="1.5"/><path d="M58 74 Q56 90 66 100 Q76 108 90 102 Q98 98 92 90 L66 72Z" fill="var(--surface)" stroke="var(--lime)" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  }

  function bestGradeForTable(disc) {
    return app.sessions
      .filter(session => sessionDisciplines(session).includes(disc))
      .map(session => sessionGrade(session, disc))
      .filter(Boolean)
      .sort((a, b) => normalizedGradeValue(disc, b) - normalizedGradeValue(disc, a))[0] || '';
  }
</script>

<div class="main-header"><div><h1>Progressi</h1><p class="sub">L'andamento della tua gradazione.</p></div></div>

<div class="cards-row" style="grid-template-columns:repeat(3,1fr);">
  <div class="stat-card">
    <div class="k">Ore {hoursMode === 'week' ? 'della settimana' : 'totali'}</div>
    <div class="v">{totalHours.toFixed(1)}{' '}<small>h</small></div>
    <button class="switch-control" title="Cambia periodo" onclick={() => hoursMode = hoursMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
  <div class="stat-card">
    <div class="k">Sessioni {sessionsMode === 'week' ? 'della settimana' : 'totali'}</div>
    <div class="v">{sessionsCount}</div>
    <button class="switch-control" title="Cambia periodo" onclick={() => sessionsMode = sessionsMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
  <div class="stat-card">
    <div class="k">Media ore allenamento {avgHoursMode === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{avgHours.toFixed(1)}{' '}<small>h</small></div>
    <button class="switch-control" title="Cambia periodo" onclick={() => avgHoursMode = avgHoursMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
</div>

<div class="progress-tools-actions">
  <button class="btn btn-primary" type="button" onclick={() => showGradeTable = true}>Tabella gradi</button>
  <button class="btn btn-ghost" type="button" onclick={() => showGripGuide = true}>Prese</button>
  <button class="btn btn-ghost" type="button" onclick={() => showGradePyramid = true}>Piramide gradi</button>
</div>

{#if showGradeTable}
  <div class="modal-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && (showGradeTable = false)}>
    <div class="modal" onclick={(event) => event.stopPropagation()}>
      <div class="modal-head"><h3>Tabella gradi e conversioni</h3><button class="close-x" type="button" aria-label="Chiudi" onclick={() => showGradeTable = false}>×</button></div>
      <div class="grade-table-tabs">
        <button type="button" class:active={gradeTableDisc === 'boulder'} onclick={() => gradeTableDisc = 'boulder'}>Boulder</button>
        <button type="button" class:active={gradeTableDisc === 'lead'} onclick={() => gradeTableDisc = 'lead'}>Vertical</button>
      </div>
      <p class="sub">Conversioni indicative tra le scale utilizzate da Klind.</p>
      <div class="table-scroll">
        {#if gradeTableDisc === 'boulder'}
          <table><thead><tr><th>Font</th><th>Francese</th><th>YDS</th><th>V-scale</th><th>King Rock</th></tr></thead><tbody>
            {#each BOULDER_SCALE as grade}<tr class:grade-current={grade === bestGradeForTable('boulder')}><td><b>{grade}</b>{#if grade === bestGradeForTable('boulder')} <small>(tuo grado)</small>{/if}</td><td>{displayGrade('boulder', grade, 'french')}</td><td>{displayGrade('boulder', grade, 'yds')}</td><td>{displayGrade('boulder', grade, 'v')}</td><td>{displayGrade('boulder', grade, 'king')}</td></tr>{/each}
          </tbody></table>
        {:else}
          <table><thead><tr><th>Francese</th><th>Font</th><th>YDS</th><th>V-scale</th></tr></thead><tbody>
            {#each ROUTE_SCALE as grade}<tr class:grade-current={grade === bestGradeForTable('lead')}><td><b>{grade}</b>{#if grade === bestGradeForTable('lead')} <small>(tuo grado)</small>{/if}</td><td>{displayGrade('lead', grade, 'font')}</td><td>{displayGrade('lead', grade, 'yds')}</td><td>{displayGrade('lead', grade, 'v')}</td></tr>{/each}
          </tbody></table>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showGradePyramid}
  <div class="modal-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && (showGradePyramid = false)}>
    <div class="modal" onclick={(event) => event.stopPropagation()}>
      <div class="modal-head"><h3>Piramide dei gradi</h3><button class="close-x" type="button" aria-label="Chiudi" onclick={() => showGradePyramid = false}>×</button></div>
      <p class="sub">Quanti ne hai fatti per ogni grado, in questa disciplina.</p>
      <div class="field"><label for="pyramidDiscipline">Disciplina</label><select id="pyramidDiscipline" bind:value={pyramidDiscipline}>{#each DISCIPLINES as disc}<option value={disc}>{DISCIPLINE_LABELS[disc]}</option>{/each}</select></div>
      {#if pyramidRows.length}
        <div class="pyramid-chart">
          {#each pyramidRows as row}
            <div class="pyramid-row"><strong>{displayGrade(pyramidDiscipline, row.grade, pyramidDiscipline === 'boulder' ? 'king' : 'french')}</strong><div class="pyramid-bars">{#each pyramidStyles as style}{#if row.styles[style]}<div class="pyramid-bar" style="--bar-size:{(row.styles[style] / pyramidMax) * 100}%"><span>{style} {row.styles[style]}</span></div>{/if}{/each}</div></div>
          {/each}
        </div>
      {:else}<div class="empty-state">Nessun blocco o via con grado registrato.</div>{/if}
    </div>
  </div>
{/if}

{#if showGripGuide}
  <div class="modal-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && (showGripGuide = false)}>
    <div class="modal" onclick={(event) => event.stopPropagation()}>
      <div class="modal-head"><h3>Guida alle prese</h3><button class="close-x" type="button" aria-label="Chiudi" onclick={() => showGripGuide = false}>×</button></div>
      <p class="sub">Le principali tipologie di presa che puoi registrare in una sessione.</p>
      <div class="grip-guide-grid">{#each gripGuide as grip}<div class="grip-card"><div class="grip-icon">{@html gripIcon(grip.title)}</div><h4>{grip.title}</h4><p>{grip.description}</p></div>{/each}</div>
    </div>
  </div>
{/if}

<div class="panel">
  <h3>Gradazione massima nel tempo</h3>
  <div class="filters-row">
    <select bind:value={progressFilter}>
      {#each progressDisciplines as d}<option value={d.id}>{d.label}</option>{/each}
    </select>
  </div>
  <div class="chart-box"><canvas bind:this={gradeCanvas}></canvas></div>
</div>

<div class="progress-grid">
  <div class="panel">
    <div class="panel-head">
      <div><h3>Media dei gradi nel tempo</h3><p class="sub">Media giornaliera delle discipline convertita in una scala Font equivalente.</p></div>
      <select bind:value={progressRange}>
        <option value="week">1 settimana</option>
        <option value="month">1 mese</option>
        <option value="3months">3 mesi</option>
        <option value="6months">6 mesi</option>
        <option value="year">1 anno</option>
        <option value="all">day one</option>
      </select>
    </div>
    <div class="chart-box"><canvas bind:this={avgCanvas}></canvas></div>
  </div>
  <div class="panel">
    <h3>Distribuzione discipline</h3>
    <div class="chart-box"><canvas bind:this={distCanvas}></canvas></div>
  </div>
</div>

<div class="panel">
  <h3>Costanza — ultimo anno</h3>
  <p class="sub">Una cella per giorno: più scuro/acceso = più sessioni.</p>
  <div class="heatmap-wrap">
    <div class="heatmap-grid">
      {#each heatmapCells as c}
        <div class="heatmap-cell" title="{c.date.split('-').reverse().join('/')}: {c.count} session{c.count === 1 ? 'e' : 'i'}" style="background:{heatmapColors[c.level]}"></div>
      {/each}
    </div>
  </div>
  <div class="heatmap-legend">
    Meno
    {#each heatmapColors as color}<div class="heatmap-cell" style="background:{color}"></div>{/each}
    Più
  </div>
</div>
