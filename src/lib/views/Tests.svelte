<script>
  import Chart from 'chart.js/auto';
  import { app } from '../stores/appState.svelte.js';
  import { TEST_TYPES, TEST_LABELS, TEST_UNITS } from '../constants.js';
  import { today } from '../utils/dates.js';
  import { chartTheme, chartFill } from '../utils/charts.js';
  import { insertTest, deleteTestRemote } from '../api/tests.js';

  const sorted = $derived([...app.tests].sort((a, b) => b.data.localeCompare(a.data)));

  function emptyTest() {
    return { data: today(), tipo: 'maxhang20', valore: '', edge: '20', presa: 'Mezzo crimp', note: '' };
  }

  let formTest = $state(null);
  let busy = $state(false);
  let pendingDeleteId = $state(null);

  const deletingTest = $derived(app.tests.find(t => t.id === pendingDeleteId));

  function openNewTest() { formTest = emptyTest(); }
  function closeModal() { formTest = null; }

  async function onSubmit(e) {
    e.preventDefault();
    busy = true;
    try {
      const saved = await insertTest(formTest);
      if (saved) { app.tests.push(saved); closeModal(); }
    } finally {
      busy = false;
    }
  }

  function requestDelete(id) { pendingDeleteId = id; }
  function cancelDelete() { pendingDeleteId = null; }
  async function confirmDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    const ok = await deleteTestRemote(id);
    if (ok) app.tests = app.tests.filter(t => t.id !== id);
    pendingDeleteId = null;
  }

  let testCanvas;
  let chart;
  $effect(() => {
    void app.themeMode;
    if (!testCanvas) return;
    chart?.destroy();
    const theme = chartTheme();
    const pts = app.tests.filter(t => t.tipo === 'maxhang20').sort((a, b) => a.data.localeCompare(b.data));
    chart = new Chart(testCanvas, {
      type: 'line',
      data: {
        labels: pts.map(p => p.data.split('-').reverse().join('/')),
        datasets: [{ data: pts.map(p => p.valore), borderColor: theme.text, backgroundColor: chartFill(theme.text, .08), fill: true, tension: .25, pointRadius: 3, pointBackgroundColor: theme.text }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { ticks: { color: theme.text }, grid: { color: theme.grid }, title: { display: true, text: 'kg', color: theme.text } } } }
    });
    return () => chart?.destroy();
  });
</script>

<div class="main-header"><div><h1>Test</h1><p class="sub">Misura la tua forza nel tempo.</p></div><button class="btn btn-primary" onclick={openNewTest}>+ Nuovo test</button></div>

<div class="panel"><h3>Andamento max hang 20mm</h3><div class="chart-box"><canvas bind:this={testCanvas}></canvas></div></div>

<div class="panel">
  <h3>Storico</h3>
  {#if sorted.length}
    <div class="table-scroll">
      <table>
        <thead><tr><th>Data</th><th>Test</th><th>Valore</th><th>Setup</th><th></th></tr></thead>
        <tbody>
          {#each sorted as t (t.id)}
            <tr>
              <td>{t.data.split('-').reverse().join('/')}</td>
              <td>{TEST_LABELS[t.tipo] || t.tipo}</td>
              <td><b>{t.valore}</b> {TEST_UNITS[t.tipo] || ''}</td>
              <td style="color:var(--muted);">{t.edge ? t.edge + 'mm' : ''} {t.presa || ''}</td>
              <td><button class="btn btn-danger btn-sm" onclick={() => requestDelete(t.id)}>Elimina</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">Nessun test registrato.</div>
  {/if}
</div>

{#if formTest}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
    <div class="modal" style="max-width:420px;" onclick={(e) => e.stopPropagation()}>
      <div class="modal-head"><h3>Nuovo test</h3><button class="close-x" onclick={closeModal} aria-label="Chiudi">×</button></div>
      <form onsubmit={onSubmit}>
        <div class="field"><label>Data</label><input type="date" bind:value={formTest.data}></div>
        <div class="field"><label>Tipo</label>
          <select bind:value={formTest.tipo}>
            {#each TEST_TYPES as x}<option value={x}>{TEST_LABELS[x]}</option>{/each}
          </select>
        </div>
        <div class="field"><label>Valore</label><input type="number" step="0.1" bind:value={formTest.valore}></div>
        <div class="field-row">
          <div class="field"><label>Tacca (mm)</label><input type="number" bind:value={formTest.edge}></div>
          <div class="field"><label>Presa</label>
            <select bind:value={formTest.presa}>
              <option>Mezzo crimp</option>
              <option>Crimp aperto</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Note</label><input type="text" bind:value={formTest.note}></div>
        <div class="modal-actions">
          <div></div>
          <div>
            <button type="button" class="btn btn-ghost" onclick={closeModal}>Annulla</button>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva'}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if pendingDeleteId}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}>
    <div class="modal delete-confirm" onclick={(e) => e.stopPropagation()}>
      <div class="delete-mark">!</div>
      <h3>Eliminare questo test?</h3>
      <p>{deletingTest ? `${TEST_LABELS[deletingTest.tipo] || 'Test'} del ${deletingTest.data.split('-').reverse().join('/')}` : 'Questo test'} verrà rimosso.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick={cancelDelete}>Annulla</button>
        <button type="button" class="btn btn-danger" onclick={confirmDelete}>Elimina test</button>
      </div>
    </div>
  </div>
{/if}
