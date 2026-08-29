<script>
  import Chart from 'chart.js/auto';
  import { app } from '../stores/appState.svelte.js';
  import { today, parseDate, startOfWeek } from '../utils/dates.js';
  import { chartTheme, chartFill } from '../utils/charts.js';
  import { estimatedKcal } from '../utils/wellness.js';
  import { upsertWellness, deleteWellnessRemote } from '../api/wellness.js';

  const weekStart = startOfWeek(new Date());

  function values(items, key) { return items.map(i => parseFloat(i[key])).filter(v => Number.isFinite(v)); }
  function sum(items, key) { return values(items, key).reduce((a, b) => a + b, 0); }
  function average(items, key) { const l = values(items, key); return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; }

  const weekEntries = $derived(app.wellness.filter(w => parseDate(w.data) >= weekStart));

  let sleepMode = $state('all');   // 'all' | 'week' | 'custom'
  let sleepCustomStart = $state(today());
  let sleepCustomEnd = $state(today());
  let qualityMode = $state('all'); // 'all' | 'week'
  let waterMode = $state('all');   // 'all' | 'week'

  const sleepItems = $derived.by(() => {
    if (sleepMode === 'week') return weekEntries;
    if (sleepMode === 'custom') return app.wellness.filter(w => w.data >= sleepCustomStart && w.data <= sleepCustomEnd);
    return app.wellness;
  });
  const avgSleep = $derived(average(sleepItems, 'sonno'));

  const qualityItems = $derived(qualityMode === 'week' ? weekEntries : app.wellness);
  const avgQuality = $derived(average(qualityItems, 'sonnoQualita'));

  const waterItems = $derived(waterMode === 'week' ? weekEntries : app.wellness);
  const totalWater = $derived(sum(waterItems, 'idratazione'));

  function makeForm(date) {
    const e = app.wellness.find(w => w.data === date) || {};
    return {
      data: date,
      sonno: e.sonno ?? '',
      sonnoQualita: e.sonnoQualita ?? '',
      pesoCorporeo: e.pesoCorporeo ?? '',
      idratazione: e.idratazione ?? '',
      kcal: e.kcal ?? '',
      alimentazione: e.alimentazione ?? ''
    };
  }

  let editDate = $state(today());
  let form = $state(makeForm(editDate));
  let busy = $state(false);
  let foodMenuDate = $state(null);

  const editingExisting = $derived(app.wellness.some(w => w.data === editDate));

  let editPanel;

  function changeDate(newDate) {
    editDate = newDate;
    form = makeForm(newDate);
  }

  function selectEntry(date) {
    changeDate(date);
    editPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    busy = true;
    try {
      const entry = { ...form, kcal: form.kcal || estimatedKcal(app.sessions, form.data, form.pesoCorporeo) };
      const saved = await upsertWellness(entry);
      if (saved) {
        const idx = app.wellness.findIndex(w => w.data === saved.data);
        if (idx >= 0) app.wellness[idx] = saved; else app.wellness.unshift(saved);
        app.wellness.sort((a, b) => b.data.localeCompare(a.data));
        form = makeForm(editDate);
      }
    } finally {
      busy = false;
    }
  }

  function toggleFood(date) {
    foodMenuDate = foodMenuDate === date ? null : date;
  }

  const recentEntries = $derived([...app.wellness].slice(0, 10));

  let pendingDeleteDate = $state(null);
  const deletingEntry = $derived(app.wellness.find(w => w.data === pendingDeleteDate));
  function requestDelete(date) { pendingDeleteDate = date; }
  function cancelDelete() { pendingDeleteDate = null; }
  async function confirmDelete() {
    const date = pendingDeleteDate;
    if (!date) return;
    const entry = app.wellness.find(w => w.data === date);
    if (!entry) { pendingDeleteDate = null; return; }
    const ok = await deleteWellnessRemote(entry.id);
    if (ok) {
      app.wellness = app.wellness.filter(w => w.data !== date);
      if (editDate === date) changeDate(today());
    }
    pendingDeleteDate = null;
  }

  let weightCanvas;
  let chart;
  $effect(() => {
    void app.themeMode;
    if (!weightCanvas) return;
    chart?.destroy();
    const theme = chartTheme();
    const points = [...app.wellness]
      .filter(e => Number.isFinite(parseFloat(e.pesoCorporeo)))
      .sort((a, b) => a.data.localeCompare(b.data));
    chart = new Chart(weightCanvas, {
      type: 'line',
      data: {
        labels: points.map(p => p.data.split('-').reverse().join('/')),
        datasets: [{ label: 'Peso', data: points.map(p => parseFloat(p.pesoCorporeo)), borderColor: theme.accent, backgroundColor: chartFill(theme.accent, .14), fill: true, tension: .25, pointRadius: 4, pointBackgroundColor: theme.accent }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { ticks: { color: theme.text }, grid: { color: theme.grid }, title: { display: true, text: 'kg', color: theme.text } } } }
    });
    return () => chart?.destroy();
  });
</script>

<div class="main-header"><div><h1>Benessere</h1><p class="sub">Sonno, alimentazione e recupero in una sezione dedicata.</p></div></div>

<div class="summary-grid">
  <div class="summary-card">
    <div class="k">Sonno medio a notte</div>
    <div class="v">{avgSleep ? avgSleep.toFixed(1) : '—'}<small> h</small></div>
    <select bind:value={sleepMode} style="margin-top:8px;width:100%;">
      <option value="all">Di sempre</option>
      <option value="week">Settimanale</option>
      <option value="custom">Personalizzato</option>
    </select>
    {#if sleepMode === 'custom'}
      <div class="field-row" style="margin-top:8px;">
        <div class="field" style="margin-bottom:0;"><input type="date" bind:value={sleepCustomStart}></div>
        <div class="field" style="margin-bottom:0;"><input type="date" bind:value={sleepCustomEnd}></div>
      </div>
    {/if}
  </div>
  <div class="summary-card">
    <div class="k">Qualità media {qualityMode === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{avgQuality ? avgQuality.toFixed(1) : '—'}<small> / 5</small></div>
    <button class="switch-control" title="Cambia periodo" aria-label="Cambia periodo" onclick={() => qualityMode = qualityMode === 'week' ? 'all' : 'week'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 0 0-14.7-4L3 10"></path><path d="M3 4v6h6"></path><path d="M4 13a8 8 0 0 0 14.7 4L21 14"></path><path d="M21 20v-6h-6"></path></svg>
    </button>
  </div>
  <div class="summary-card">
    <div class="k">Acqua totale {waterMode === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{totalWater ? totalWater.toFixed(1) : '—'}<small> l</small></div>
    <button class="switch-control" title="Cambia periodo" aria-label="Cambia periodo" onclick={() => waterMode = waterMode === 'week' ? 'all' : 'week'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 0 0-14.7-4L3 10"></path><path d="M3 4v6h6"></path><path d="M4 13a8 8 0 0 0 14.7 4L21 14"></path><path d="M21 20v-6h-6"></path></svg>
    </button>
  </div>
</div>

<div class="panel">
  <h3>Andamento del peso</h3>
  <div class="chart-box wellness-chart"><canvas bind:this={weightCanvas}></canvas></div>
</div>

<div class="panel" bind:this={editPanel}>
  <h3>
    {editingExisting ? 'Modifica' : 'Nuova'} voce —
    <input type="date" value={editDate} onchange={(e) => changeDate(e.target.value)} style="width:auto;display:inline-block;background:transparent;border:none;color:inherit;font:inherit;">
  </h3>
  <form onsubmit={onSubmit}>
    <div class="field-row">
      <div class="field"><label>Sonno (ore)</label><input type="number" step="0.5" bind:value={form.sonno}></div>
      <div class="field"><label>Qualità sonno (1-5)</label><input type="number" min="1" max="5" bind:value={form.sonnoQualita}></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Peso (kg)</label><input type="number" step="0.1" bind:value={form.pesoCorporeo}></div>
      <div class="field"><label>Idratazione (l)</label><input type="number" step="0.1" bind:value={form.idratazione}></div>
    </div>
    <div class="field"><label>Kcal bruciate (stima)</label><input type="number" bind:value={form.kcal}></div>
    <div class="field"><label>Alimentazione</label><textarea rows="3" bind:value={form.alimentazione}></textarea></div>
    <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva benessere'}</button>
  </form>
</div>

<div class="panel">
  <h3>Ultime voci</h3>
  {#if recentEntries.length}
    {#each recentEntries as w (w.data)}
      <div class="wellness-entry" style={editDate === w.data ? 'background:var(--surface-2);' : ''}>
        <div class="session-mini">
          <div>{w.data.split('-').reverse().join('/')}{w.sonno ? ` · Sonno ${w.sonno}h` : ''}{w.pesoCorporeo ? ` · Peso ${w.pesoCorporeo}kg` : ''} · Kcal {w.kcal || '—'}</div>
          <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => selectEntry(w.data)}>Modifica</button>
            <button type="button" class="btn btn-ghost btn-sm food-toggle" onclick={() => toggleFood(w.data)}>Cibo</button>
            <button type="button" class="btn btn-danger btn-sm" onclick={() => requestDelete(w.data)}>Elimina</button>
          </div>
        </div>
        <div class="food-menu {foodMenuDate === w.data ? 'open' : ''}">{w.alimentazione || 'Nessun alimento registrato.'}</div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna voce ancora.</div>
  {/if}
</div>

{#if pendingDeleteDate}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}>
    <div class="modal delete-confirm" onclick={(e) => e.stopPropagation()}>
      <div class="delete-mark">!</div>
      <h3>Eliminare questa voce?</h3>
      <p>La voce di benessere del {deletingEntry ? deletingEntry.data.split('-').reverse().join('/') : ''} verrà rimossa.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick={cancelDelete}>Annulla</button>
        <button type="button" class="btn btn-danger" onclick={confirmDelete}>Elimina voce</button>
      </div>
    </div>
  </div>
{/if}
