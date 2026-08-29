<script>
  import Chart from 'chart.js/auto';
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS, ROUTE_SCALE } from '../../constants.js';
  import { bestGrade, normalizedGradeValue } from '../../utils/grades.js';
  import { chartTheme, chartFill } from '../../utils/charts.js';

  let mode = $state('duo');       // 'duo' | 'group'
  let personA = $state('__me__');
  let personB = $state('');
  let groupId = $state('');

  let canvas;
  let chart;

  function sessionsFor(id) {
    return id === app.authUser?.id || id === '__me__' ? app.sessions : app.friendFeed.filter(s => s.authorId === id);
  }

  $effect(() => {
    if (!canvas) return;
    void mode; void personA; void personB; void groupId; void app.friends.length; void app.groups.length; void app.themeMode;
    chart?.destroy();
    const theme = chartTheme();
    const palette = [theme.rust, theme.moon, theme.speed, theme.vertical, theme.boulder, theme.accent];
    const me = app.authUser?.id;
    let datasets = [];

    if (mode === 'group') {
      const group = app.groups.find(g => g.id === groupId);
      if (group) {
        datasets = group.members.map((m, i) => {
          const sessions = sessionsFor(m.id);
          const data = DISCIPLINES.map(d => { const g = bestGrade(d, sessions); return g ? normalizedGradeValue(d, g) : 0; });
          const color = m.id === me ? theme.accent : palette[i % palette.length];
          return { label: m.id === me ? 'Tu' : (m.username || 'Utente'), data, backgroundColor: chartFill(color, .25), borderColor: color, borderWidth: 2, pointBackgroundColor: color };
        });
      }
    } else {
      const people = [{ id: '__me__', username: 'Tu', isMe: true }, ...app.friends];
      const a = people.find(p => p.id === personA) || people[0];
      const b = people.find(p => p.id === personB);
      datasets = [a, b].filter(Boolean).map(p => {
        const sessions = sessionsFor(p.id);
        const data = DISCIPLINES.map(d => { const g = bestGrade(d, sessions); return g ? normalizedGradeValue(d, g) : 0; });
        const idx = people.indexOf(p);
        const color = p.isMe ? theme.accent : palette[idx % palette.length];
        return { label: p.username || 'Utente', data, backgroundColor: chartFill(color, .25), borderColor: color, borderWidth: 2, pointBackgroundColor: color };
      });
    }

    chart = new Chart(canvas, {
      type: 'radar',
      data: { labels: DISCIPLINES.map(d => DISCIPLINE_LABELS[d]), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: theme.text } } },
        scales: { r: { min: 0, max: ROUTE_SCALE.length - 1, angleLines: { color: theme.grid }, grid: { color: theme.grid }, pointLabels: { color: theme.text }, ticks: { display: false, backdropColor: 'transparent' } } }
      }
    });
    return () => chart?.destroy();
  });
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head"><div><h3>Radar disciplina — {mode === 'group' ? 'Gruppo' : '1 a 1'}</h3><p class="sub">Punti forti e deboli per disciplina, {mode === 'group' ? 'tra tutti i membri del gruppo' : 'tra due atleti'}.</p></div></div>
  {#if app.friends.length}
    <div class="radar-people-picker">
      <div class="field" style="margin-bottom:0;min-width:160px;">
        <label>Confronta</label>
        <select bind:value={mode}>
          <option value="duo">1 a 1</option>
          <option value="group" disabled={!app.groups.length}>Gruppo{!app.groups.length ? ' (nessun gruppo)' : ''}</option>
        </select>
      </div>
      {#if mode === 'group'}
        <div class="field" style="margin-bottom:0;min-width:200px;">
          <label>Gruppo</label>
          <select bind:value={groupId}>
            <option value="">— scegli —</option>
            {#each app.groups as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
          </select>
        </div>
      {:else}
        <div class="field" style="margin-bottom:0;min-width:160px;">
          <label>Atleta 1</label>
          <select bind:value={personA}>
            <option value="__me__">Tu</option>
            {#each app.friends as f (f.id)}<option value={f.id}>{f.username}</option>{/each}
          </select>
        </div>
        <div class="field" style="margin-bottom:0;min-width:160px;">
          <label>Atleta 2</label>
          <select bind:value={personB}>
            <option value="">— scegli —</option>
            <option value="__me__">Tu</option>
            {#each app.friends as f (f.id)}<option value={f.id}>{f.username}</option>{/each}
          </select>
        </div>
      {/if}
    </div>
    <div class="chart-box"><canvas bind:this={canvas}></canvas></div>
  {:else}
    <div class="empty-state">Aggiungi qualche amico per confrontarti in un radar.</div>
  {/if}
</div>
