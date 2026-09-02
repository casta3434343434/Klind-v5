<script>
  import { app } from '../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS, ROUTE_SCALE } from '../constants.js';
  import { today, parseDate, localDateKey, startOfWeek } from '../utils/dates.js';
  import { sessionGrade, normalizedGradeValue, commonFrenchGradeFromNormalized, chartGradeLabel } from '../utils/grades.js';
  import { chartTheme, chartFill, discColor, disciplineThemeKey } from '../utils/charts.js';
  import { loadChart } from '../utils/chartLoader.js';
  import { buildHeatmap } from '../utils/heatmap.js';

  let hoursMode = $state('all');    // 'all' | 'week'
  let sessionsMode = $state('all');
  let avgHoursMode = $state('all');
  let progressFilter = $state('boulder'); // disciplina o 'summary'
  let progressRange = $state('week');     // per il grafico "media gradi"

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
            .filter(s => s.disciplina === disc && sessionGrade(s, disc))
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
          const summaryDates = [...new Set(filtered.filter(s => DISCIPLINES.includes(s.disciplina)).map(s => s.data))].sort();
          const datasets = DISCIPLINES.map(d => {
            const color = theme[disciplineThemeKey(d)];
            return {
              label: DISCIPLINE_LABELS[d],
              data: summaryDates.map(date => {
                const values = filtered.filter(s => s.data === date && s.disciplina === d).map(s => normalizedGradeValue(d, sessionGrade(s, d))).filter(v => v !== null);
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
          if (!DISCIPLINES.includes(s.disciplina)) return;
          const value = normalizedGradeValue(s.disciplina, sessionGrade(s, s.disciplina));
          if (value === null) return;
          (byDate[s.data] = byDate[s.data] || []).push(value);
        });
        const dates = Object.keys(byDate).sort();
        const values = dates.map(d => byDate[d].reduce((a, b) => a + b, 0) / byDate[d].length);
        charts.average = new Chart(avgCanvas, { type: 'line', data: { labels: dates.map(d => d.split('-').reverse().join('/')), datasets: [{ data: values, borderColor: theme.text, backgroundColor: chartFill(theme.text, .08), fill: true, tension: .25, pointRadius: 4, pointBackgroundColor: theme.text }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `Media: ${commonFrenchGradeFromNormalized(c.parsed.y)}` } } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { min: 0, max: ROUTE_SCALE.length - 1, grid: { color: theme.grid }, ticks: { color: theme.text, callback: v => commonFrenchGradeFromNormalized(v) } } } } });
      }

      if (distCanvas) {
        const counts = {};
        app.sessions.forEach(s => { counts[s.disciplina] = (counts[s.disciplina] || 0) + 1; });
        const labels = Object.keys(counts).map(d => DISCIPLINE_LABELS[d] || d);
        const colors = Object.keys(counts).map(discColor);
        charts.dist = new Chart(distCanvas, { type: 'doughnut', data: { labels, datasets: [{ data: Object.values(counts), backgroundColor: colors, borderColor: theme.surface, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, color: theme.text } } } } });
      }
    });

    return () => { cancelled = true; destroyCharts(); };
  });

  const heatmapCells = $derived(buildHeatmap(app.sessions));
  const heatmapColors = ['var(--surface-2)', 'rgba(182,66,45,0.35)', 'rgba(182,66,45,0.65)', 'var(--lime)'];
</script>

<div class="main-header"><div><h1>Progressi</h1><p class="sub">L'andamento della tua gradazione.</p></div></div>

<div class="cards-row" style="grid-template-columns:repeat(3,1fr);">
  <div class="stat-card">
    <div class="k">Ore {hoursMode === 'week' ? 'della settimana' : 'totali'}</div>
    <div class="v">{totalHours.toFixed(1)}<small> h</small></div>
    <button class="switch-control" title="Cambia periodo" onclick={() => hoursMode = hoursMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
  <div class="stat-card">
    <div class="k">Sessioni {sessionsMode === 'week' ? 'della settimana' : 'totali'}</div>
    <div class="v">{sessionsCount}</div>
    <button class="switch-control" title="Cambia periodo" onclick={() => sessionsMode = sessionsMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
  <div class="stat-card">
    <div class="k">Media ore allenamento {avgHoursMode === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{avgHours.toFixed(1)}<small> h</small></div>
    <button class="switch-control" title="Cambia periodo" onclick={() => avgHoursMode = avgHoursMode === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
</div>

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
