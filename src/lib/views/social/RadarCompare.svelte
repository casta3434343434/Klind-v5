<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS, ROUTE_SCALE } from '../../constants.js';
  import { bestGrade, normalizedGradeValue } from '../../utils/grades.js';
  import { chartTheme, chartFill } from '../../utils/charts.js';
  import { loadChart } from '../../utils/chartLoader.js';

  let canvas = $state();
  let chart;

  $effect(() => {
    void app.sessions.length; void app.friendFeed.length; void app.friends.length;
    void app.radarMode; void app.radarPersonA; void app.radarPersonB; void app.radarGroupId; void app.groups.length;
    if (!canvas) return;
    let cancelled = false;
    const theme = chartTheme();
    const grid = theme.grid;
    const palette = [theme.rust, theme.moon, theme.speed, theme.vertical, theme.boulder, theme.accent];
    const discs = DISCIPLINES;
    const me = app.authUser?.id;
    let datasets = [];
    if (app.radarMode === 'group') {
      const group = (app.groups || []).find(g => g.id === app.radarGroupId);
      if (group) {
        datasets = group.members.map((m, i) => {
          const sessions = m.id === me ? app.sessions : (app.friendFeed || []).filter(s => s.authorId === m.id);
          const data = discs.map(d => { const g = bestGrade(d, sessions); return g ? normalizedGradeValue(d, g) : 0; });
          const color = m.id === me ? theme.accent : palette[i % palette.length];
          return { label: m.id === me ? 'Tu' : (m.username || 'Utente'), data, backgroundColor: chartFill(color, .25), borderColor: color, borderWidth: 2, pointBackgroundColor: color };
        });
      }
    } else {
      const people = [{ id: '__me__', username: 'Tu', isMe: true }, ...(app.friends || [])];
      const personA = people.find(p => p.id === app.radarPersonA) || people[0];
      const personB = people.find(p => p.id === app.radarPersonB);
      const sessionsFor = p => p.isMe ? app.sessions : (app.friendFeed || []).filter(s => s.authorId === p.id);
      datasets = [personA, personB].filter(Boolean).map((p) => {
        const sessions = sessionsFor(p);
        const data = discs.map(d => { const g = bestGrade(d, sessions); return g ? normalizedGradeValue(d, g) : 0; });
        const personIndex = people.indexOf(p);
        const color = p.isMe ? theme.accent : palette[personIndex % palette.length];
        return { label: p.username || 'Utente', data, backgroundColor: chartFill(color, .25), borderColor: color, borderWidth: 2, pointBackgroundColor: color };
      });
    }
    loadChart().then((Chart) => {
      if (cancelled) return;
      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'radar',
        data: { labels: discs.map(d => DISCIPLINE_LABELS[d]), datasets },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: theme.text } } }, scales: { r: { min: 0, max: ROUTE_SCALE.length - 1, angleLines: { color: grid }, grid: { color: grid }, pointLabels: { color: theme.text }, ticks: { display: false, backdropColor: 'transparent' } } } }
      });
    });
    return () => { cancelled = true; chart?.destroy(); chart = null; };
  });
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head"><div><h3>Radar disciplina — {app.radarMode === 'group' ? 'Gruppo' : '1 a 1'}</h3><p class="sub">Punti forti e deboli per disciplina, {app.radarMode === 'group' ? 'tra tutti i membri del gruppo' : 'tra due atleti'}.</p></div></div>
  {#if app.friends?.length}
    <div class="radar-people-picker">
      <div class="field" style="margin-bottom:0;min-width:160px;"><label>Confronta</label>
        <select bind:value={app.radarMode}>
          <option value="duo">1 a 1</option>
          <option value="group" disabled={!app.groups?.length}>Gruppo{!app.groups?.length ? ' (nessun gruppo)' : ''}</option>
        </select>
      </div>
      {#if app.radarMode === 'group'}
        <div class="field" style="margin-bottom:0;min-width:200px;"><label>Gruppo</label>
          <select bind:value={app.radarGroupId}>
            <option value="">— scegli —</option>
            {#each app.groups || [] as g}<option value={g.id}>{g.name}</option>{/each}
          </select>
        </div>
      {:else}
        <div class="field" style="margin-bottom:0;min-width:160px;"><label>Atleta 1</label>
          <select bind:value={app.radarPersonA}>
            <option value="__me__">Tu</option>
            {#each app.friends as f}<option value={f.id}>{f.username}</option>{/each}
          </select>
        </div>
        <div class="field" style="margin-bottom:0;min-width:160px;"><label>Atleta 2</label>
          <select bind:value={app.radarPersonB}>
            <option value="">— scegli —</option>
            <option value="__me__">Tu</option>
            {#each app.friends as f}<option value={f.id}>{f.username}</option>{/each}
          </select>
        </div>
      {/if}
    </div>
    <div class="chart-box"><canvas bind:this={canvas}></canvas></div>
  {:else}
    <div class="empty-state">Aggiungi qualche amico per confrontarti in un radar.</div>
  {/if}
</div>
