<script>
  import Chart from 'chart.js/auto';
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { bestGrade, displayGrade, normalizedGradeValue } from '../../utils/grades.js';
  import { chartTheme, chartFill } from '../../utils/charts.js';
  import { requestConfirm } from '../../stores/confirm.svelte.js';
  import { deleteGroup, leaveGroup, removeGroupMember } from '../../api/groups.js';
  import DeveloperBadge from './DeveloperBadge.svelte';

  let { group } = $props();

  const isOwner = $derived(group.owner_id === app.authUser?.id);
  let active = $state(false);

  function sessionsFor(memberId) {
    return memberId === app.authUser?.id ? app.sessions : (app.friendFeed || []).filter(s => s.authorId === memberId);
  }

  function askDelete() {
    requestConfirm({
      title: 'Eliminare questo gruppo?',
      message: 'Verrà eliminato per tutti i membri, non solo per te.',
      confirmLabel: 'Elimina gruppo',
      onConfirm: () => deleteGroup(group.id)
    });
  }
  function askLeave() {
    requestConfirm({
      title: 'Abbandonare questo gruppo?',
      message: 'Potrai essere aggiunto di nuovo in futuro da chi lo gestisce.',
      confirmLabel: 'Abbandona',
      onConfirm: () => leaveGroup(group.id)
    });
  }

  let canvas;
  let chart;
  $effect(() => {
    void app.themeMode;
    if (!active || !canvas) return;
    chart?.destroy();
    const theme = chartTheme();
    const palette = [theme.rust, theme.moon, theme.speed, theme.vertical, theme.boulder, theme.accent];
    const me = app.authUser?.id;
    const datasets = group.members.map((m, i) => {
      const sessions = sessionsFor(m.id);
      const grades = DISCIPLINES.map(d => bestGrade(d, sessions));
      const data = grades.map((g, index) => g ? normalizedGradeValue(DISCIPLINES[index], g) : 0);
      const color = m.id === me ? theme.accent : palette[i % palette.length];
      return { label: m.id === me ? 'Tu' : (m.username || 'Utente'), data, rawGrades: grades, backgroundColor: chartFill(color, .7), borderColor: color, borderWidth: 1, borderRadius: 4 };
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

<div style="margin-top:14px;">
  <div class="session-mini">
    <div><b>{group.name}</b> <span class="sub">· {group.members.length} {group.members.length === 1 ? 'membro' : 'membri'}</span></div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-sm" onclick={() => active = !active}>{active ? 'Chiudi' : 'Vedi statistiche'}</button>
      {#if isOwner}
        <button class="btn btn-sm btn-danger" onclick={askDelete}>Elimina gruppo</button>
      {:else}
        <button class="btn btn-sm btn-danger" onclick={askLeave}>Abbandona</button>
      {/if}
    </div>
  </div>
  {#if active}
    <div style="padding:16px;background:var(--bg-alt);border-radius:8px;margin-top:8px;">
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        {#each group.members as m (m.id)}
          <span style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;">
            {m.username}<DeveloperBadge user={m} />
            {#if isOwner && m.id !== app.authUser?.id}
              <button onclick={() => removeGroupMember(group.id, m.id)} style="background:none;border:none;color:var(--rust);cursor:pointer;padding:0;font-size:14px;line-height:1;">×</button>
            {/if}
          </span>
        {/each}
      </div>
      <div class="chart-box"><canvas bind:this={canvas}></canvas></div>
      <div class="table-scroll" style="margin-top:16px;">
        <table>
          <thead>
            <tr><th>Membro</th>{#each DISCIPLINES as d}<th>{DISCIPLINE_LABELS[d]}</th>{/each}</tr>
          </thead>
          <tbody>
            {#each group.members as m (m.id)}
              <tr class={m.id === app.authUser?.id ? 'grade-current' : ''}>
                <td><b>{m.id === app.authUser?.id ? 'Tu' : m.username}</b></td>
                {#each DISCIPLINES as d}
                  {@const g = bestGrade(d, sessionsFor(m.id))}
                  <td>{g ? displayGrade(d, g) : '—'}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
