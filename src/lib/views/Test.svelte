<script>
  import { app } from '../stores/appState.svelte.js';
  import { TEST_LABELS, TEST_UNITS } from '../constants.js';
  import { chartTheme, chartFill } from '../utils/charts.js';
  import { loadChart } from '../utils/chartLoader.js';
  import { openNewTest, requestDeleteTest } from '../stores/testModal.svelte.js';
  import TestModal from './test/TestModal.svelte';
  import DeleteTestConfirm from './test/DeleteTestConfirm.svelte';

  const sorted = $derived([...app.tests].sort((a, b) => b.data.localeCompare(a.data)));

  let canvas;
  let chart;
  $effect(() => {
    void app.tests.length;
    if (!canvas) return;
    let cancelled = false;
    const theme = chartTheme();
    const pts = app.tests.filter(t => t.tipo === 'maxhang20').sort((a, b) => a.data.localeCompare(b.data));
    loadChart().then((Chart) => {
      if (cancelled) return;
      chart?.destroy();
      chart = new Chart(canvas, {
        type: 'line',
        data: { labels: pts.map(p => p.data.split('-').reverse().join('/')), datasets: [{ data: pts.map(p => p.valore), borderColor: theme.text, backgroundColor: chartFill(theme.text, .08), fill: true, tension: .25, pointRadius: 3, pointBackgroundColor: theme.text }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { ticks: { color: theme.text }, grid: { color: theme.grid }, title: { display: true, text: 'kg', color: theme.text } } } }
      });
    });
    return () => { cancelled = true; chart?.destroy(); chart = null; };
  });
</script>

<div class="main-header"><div><h1>Test</h1><p class="sub">Misura la tua forza nel tempo.</p></div><button class="btn btn-primary" onclick={openNewTest}>+ Nuovo test</button></div>

<div class="panel">
  <h3>Andamento max hang 20mm</h3>
  <div class="chart-box test-chart-large"><canvas bind:this={canvas}></canvas></div>
</div>

<div class="panel">
  <h3>Storico</h3>
  {#if sorted.length}
    <div class="table-scroll">
      <table>
      <thead>
        <tr><th>Data</th><th>Test</th><th>Valore</th><th>Setup</th><th></th></tr>
      </thead>
      <tbody>
        {#each sorted as t}
          <tr>
            <td>{t.data.split('-').reverse().join('/')}</td>
            <td>{TEST_LABELS[t.tipo] || t.tipo}</td>
            <td><b>{t.valore}</b> {TEST_UNITS[t.tipo] || ''}</td>
            <td style="color:var(--muted);">{t.edge ? t.edge + 'mm' : ''} {t.presa || ''}</td>
            <td><button class="btn btn-danger btn-sm" onclick={() => requestDeleteTest(t.id)}>Elimina</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  {:else}
    <div class="empty-state">Nessun test registrato.</div>
  {/if}
</div>

<TestModal />
<DeleteTestConfirm />
