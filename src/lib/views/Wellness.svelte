<script>
  import { app } from '../stores/appState.svelte.js';
  import { today, parseDate, startOfWeek, estimatedKcal } from '../utils/dates.js';
  import { chartTheme, chartFill } from '../utils/charts.js';
  import { loadChart } from '../utils/chartLoader.js';
  import { upsertWellness } from '../api/wellness.js';

  let editDate = $state(today());
  let foodOpenDate = $state(null);
  let sleepMode = $state('all'); // 'all' | 'week' | 'custom'
  let sleepCustomStart = $state(today());
  let sleepCustomEnd = $state(today());
  const summaryModes = $state({ quality: 'all', water: 'all' });

  const entry = $derived(app.wellness?.find(w => w.data === editDate) || {});
  const weekStart = startOfWeek(new Date());
  const weekEntries = $derived((app.wellness || []).filter(w => parseDate(w.data) >= weekStart));
  const allEntries = $derived(app.wellness || []);

  function values(items, key) { return items.map(item => parseFloat(item[key])).filter(v => Number.isFinite(v)); }
  function sum(items, key) { return values(items, key).reduce((t, v) => t + v, 0); }
  function average(items, key) { const l = values(items, key); return l.length ? l.reduce((t, v) => t + v, 0) / l.length : 0; }

  const qualityValue = $derived.by(() => {
    const items = summaryModes.quality === 'week' ? weekEntries : allEntries;
    return average(items, 'sonnoQualita');
  });
  const waterValue = $derived.by(() => {
    const items = summaryModes.water === 'week' ? weekEntries : allEntries;
    return sum(items, 'idratazione');
  });

  const sleepItems = $derived.by(() => {
    if (sleepMode === 'week') return weekEntries;
    if (sleepMode === 'custom') return allEntries.filter(w => w.data >= sleepCustomStart && w.data <= sleepCustomEnd);
    return allEntries;
  });
  const avgSleep = $derived(average(sleepItems, 'sonno'));

  // --- form ---
  let f_sonno = $state('');
  let f_sonnoQ = $state('');
  let f_peso = $state('');
  let f_idratazione = $state('');
  let f_kcal = $state('');
  let f_alimentazione = $state('');
  let busy = $state(false);

  $effect(() => {
    const e = entry;
    f_sonno = e.sonno || '';
    f_sonnoQ = e.sonnoQualita || '';
    f_peso = e.pesoCorporeo || '';
    f_idratazione = e.idratazione || '';
    f_kcal = e.kcal || '';
    f_alimentazione = e.alimentazione || '';
  });

  async function submit(e) {
    e.preventDefault();
    busy = true;
    try {
      const payload = { data: editDate, sonno: f_sonno, sonnoQualita: f_sonnoQ, pesoCorporeo: f_peso, idratazione: f_idratazione, kcal: f_kcal || estimatedKcal(app.sessions, editDate, f_peso), alimentazione: f_alimentazione };
      const saved = await upsertWellness(payload);
      if (saved) {
        const idx = app.wellness.findIndex(w => w.data === saved.data);
        if (idx >= 0) app.wellness[idx] = saved; else app.wellness = [saved, ...app.wellness].sort((a, b) => b.data.localeCompare(a.data));
      }
    } finally { busy = false; }
  }

  function editEntry(date) { editDate = date; }
  function toggleFood(date) { foodOpenDate = foodOpenDate === date ? null : date; }

  // --- grafico peso ---
  let weightCanvas;
  let weightChart;
  $effect(() => {
    void app.wellness.length;
    if (!weightCanvas) return;
    let cancelled = false;
    const theme = chartTheme();
    const points = (app.wellness || []).filter(e => Number.isFinite(parseFloat(e.pesoCorporeo))).sort((a, b) => a.data.localeCompare(b.data));
    loadChart().then((Chart) => {
      if (cancelled) return;
      weightChart?.destroy();
      weightChart = new Chart(weightCanvas, {
        type: 'line',
        data: { labels: points.map(p => p.data.split('-').reverse().join('/')), datasets: [{ label: 'Peso', data: points.map(p => parseFloat(p.pesoCorporeo)), borderColor: theme.accent, backgroundColor: chartFill(theme.accent, .14), fill: true, tension: .25, pointRadius: 4, pointBackgroundColor: theme.accent }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: theme.text }, grid: { color: theme.grid } }, y: { ticks: { color: theme.text }, grid: { color: theme.grid }, title: { display: true, text: 'kg', color: theme.text } } } }
      });
    });
    return () => { cancelled = true; weightChart?.destroy(); weightChart = null; };
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
    <div class="k">Qualità media {summaryModes.quality === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{qualityValue ? qualityValue.toFixed(1) : '—'}<small> / 5</small></div>
    <button class="switch-control" title="Cambia periodo" aria-label="Cambia periodo" onclick={() => summaryModes.quality = summaryModes.quality === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
  <div class="summary-card">
    <div class="k">Acqua totale {summaryModes.water === 'week' ? 'settimanale' : 'di sempre'}</div>
    <div class="v">{waterValue ? waterValue.toFixed(1) : '—'}<small> l</small></div>
    <button class="switch-control" title="Cambia periodo" aria-label="Cambia periodo" onclick={() => summaryModes.water = summaryModes.water === 'week' ? 'all' : 'week'}>⇄</button>
  </div>
</div>

<div class="panel">
  <h3>Andamento del peso</h3>
  <div class="chart-box wellness-chart"><canvas bind:this={weightCanvas}></canvas></div>
</div>

<div class="panel">
  <h3>{entry.data ? 'Modifica' : 'Nuova'} voce — <input type="date" bind:value={editDate} style="width:auto;display:inline-block;background:transparent;border:none;color:inherit;font:inherit;"></h3>
  <form onsubmit={submit}>
    <div class="field-row">
      <div class="field"><label>Sonno (ore)</label><input type="number" step="0.5" bind:value={f_sonno}></div>
      <div class="field"><label>Qualità sonno (1-5)</label><input type="number" min="1" max="5" bind:value={f_sonnoQ}></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Peso (kg)</label><input type="number" step="0.1" bind:value={f_peso}></div>
      <div class="field"><label>Idratazione (l)</label><input type="number" step="0.1" bind:value={f_idratazione}></div>
    </div>
    <div class="field"><label>Kcal bruciate (stima)</label><input type="number" bind:value={f_kcal}></div>
    <div class="field"><label>Alimentazione</label><textarea rows="3" bind:value={f_alimentazione}></textarea></div>
    <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva benessere'}</button>
  </form>
</div>

<div class="panel">
  <h3>Ultime voci</h3>
  {#if app.wellness?.length}
    {#each app.wellness.slice(0, 10) as w}
      <div class="wellness-entry">
        <div class="session-mini" style="cursor:pointer;" role="button" tabindex="0" onclick={() => editEntry(w.data)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && editEntry(w.data)}>
          <div>{w.data.split('-').reverse().join('/')}{w.sonno ? ` · Sonno ${w.sonno}h` : ''}{w.pesoCorporeo ? ` · Peso ${w.pesoCorporeo}kg` : ''} · Kcal {w.kcal || '—'}</div>
          <button type="button" class="btn btn-ghost btn-sm" onclick={(e) => { e.stopPropagation(); toggleFood(w.data); }}>Cibo</button>
        </div>
        <div class="food-menu {foodOpenDate === w.data ? 'open' : ''}">{w.alimentazione || 'Nessun alimento registrato.'}</div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">Nessuna voce ancora.</div>
  {/if}
</div>
