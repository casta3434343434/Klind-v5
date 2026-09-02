<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DOW, MONTHS } from '../../constants.js';
  import { today, fmt, parseDate } from '../../utils/dates.js';
  import { sessionDisciplines } from '../../utils/grades.js';

  let { value = $bindable(today()), label = 'Data' } = $props();
  let open = $state(false);
  let viewDate = $state(parseDate(value || today()));

  const cells = $derived.by(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
  });

  const sessionsByDate = $derived.by(() => {
    const map = {};
    app.sessions.forEach(session => { (map[session.data] ||= []).push(session); });
    return map;
  });

  function disciplinesFor(date) {
    return [...new Set((sessionsByDate[date] || []).flatMap(session => sessionDisciplines(session)))];
  }

  function dayStyle(disciplines) {
    if (!disciplines.length) return '';
    const colors = disciplines.map(disc => `color-mix(in srgb, var(--${disc === 'lead' ? 'vertical' : disc === 'moonboard' ? 'moon' : disc}) 24%, transparent)`);
    if (colors.length === 1) return `background:${colors[0]};`;
    if (colors.length === 2) return `background:linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%);`;
    const step = 100 / colors.length;
    const stops = colors.map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`).join(', ');
    return `background:conic-gradient(from -45deg, ${stops});`;
  }

  function selectDay(day) {
    value = fmt(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    open = false;
  }

  function moveMonth(delta) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
  }

  function openPicker() {
    viewDate = parseDate(value || today());
    open = !open;
  }
</script>

<div class="field dp">
  <label>{label}</label>
  <button type="button" class="dp-trigger" class:open aria-expanded={open} onclick={openPicker}>
    <span>{value ? value.split('-').reverse().join('/') : 'gg/mm/aaaa'}</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path></svg>
  </button>
  {#if open}
    <div class="dp-panel" onclick={(event) => event.stopPropagation()}>
      <div class="dp-head">
        <button type="button" class="dp-nav-btn" aria-label="Mese precedente" onclick={() => moveMonth(-1)}>‹</button>
        <div class="dp-month">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
        <button type="button" class="dp-nav-btn" aria-label="Mese successivo" onclick={() => moveMonth(1)}>›</button>
      </div>
      <div class="dp-grid">
        {#each DOW as dayName}<div class="dp-dow">{dayName}</div>{/each}
        {#each cells as day}
          {#if day === null}
            <div class="dp-day muted"></div>
          {:else}
            {@const date = fmt(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
            {@const disciplines = disciplinesFor(date)}
            <button type="button" class="dp-day {date === today() ? 'today' : ''} {date === value ? 'selected' : ''} {disciplines.length ? 'has-session' : ''}" style={dayStyle(disciplines)} title={disciplines.length ? `${disciplines.join(', ')}: sessione già registrata` : ''} onclick={() => selectDay(day)}>{day}</button>
          {/if}
        {/each}
      </div>
      <div class="dp-foot">
        <button type="button" onclick={() => { value = ''; open = false; }}>Cancella</button>
        <button type="button" onclick={() => { value = today(); viewDate = parseDate(value); open = false; }}>Oggi</button>
      </div>
    </div>
  {/if}
</div>
