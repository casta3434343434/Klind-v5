<script>
  import Chart from 'chart.js/auto';
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { bestGrade, displayGrade, normalizedGradeValue } from '../../utils/grades.js';
  import { chartTheme, chartFill } from '../../utils/charts.js';

  let canvas;
  let chart;
  $effect(() => {
    void app.themeMode;
    if (!canvas || !app.friends.length) return;
    chart?.destroy();
    const theme = chartTheme();
    const palette = [theme.rust, theme.moon, theme.speed, theme.vertical, theme.boulder, theme.accent];
    const people = [{ id: '__me__', username: 'Tu', isMe: true }, ...app.friends];
    const datasets = people.map((p, i) => {
      const sessions = p.isMe ? app.sessions : app.friendFeed.filter(s => s.authorId === p.id);
      const grades = DISCIPLINES.map(d => bestGrade(d, sessions));
      const data = grades.map((g, index) => g ? normalizedGradeValue(DISCIPLINES[index], g) : 0);
      const color = p.isMe ? theme.accent : palette[i % palette.length];
      return { label: p.username || 'Utente', data, rawGrades: grades, backgroundColor: chartFill(color, .7), borderColor: color, borderWidth: 1, borderRadius: 4 };
    });
    chart = new Chart(canvas, {
      type: 'bar',
      data: { labels: DISCIPLINES.map(d => DISCIPLINE_LABELS[d]), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: theme.text } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.dataset.rawGrades?.[c.dataIndex] ? displayGrade(DISCIPLINES[c.dataIndex], c.dataset.rawGrades[c.dataIndex], 'french') : '—'}` } } },
        scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { min: 0, ticks: { color: theme.text }, grid: { color: theme.grid } } }
      }
    });
    return () => chart?.destroy();
  });
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head"><div><h3>Confronto con gli amici</h3><p class="sub">Grado massimo raggiunto per disciplina, in base alle sessioni condivise.</p></div></div>
  {#if app.friends.length}
    <div class="chart-box"><canvas bind:this={canvas}></canvas></div>
  {:else}
    <div class="empty-state">Aggiungi qualche amico per iniziare a confrontare i progressi.</div>
  {/if}
</div>
