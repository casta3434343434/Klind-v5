<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import FeedItem from './FeedItem.svelte';

  let filterDiscipline = $state('all');
  let filterFriend = $state('all');
  let visibleCount = $state(8);

  const filtered = $derived(app.friendFeed.filter(r =>
    (filterDiscipline === 'all' || r.disciplina === filterDiscipline) &&
    (filterFriend === 'all' || r.authorId === filterFriend)
  ));
  const shown = $derived(filtered.slice(0, visibleCount));

  function onFilterChange() {
    visibleCount = 8;
  }
</script>

<div class="panel" style="grid-column:1 / -1;">
  <h3>Feed amici</h3>
  <div class="field-row">
    <div class="field">
      <label>Disciplina</label>
      <select bind:value={filterDiscipline} onchange={onFilterChange}>
        <option value="all">Tutte</option>
        {#each DISCIPLINES as d}<option value={d}>{DISCIPLINE_LABELS[d]}</option>{/each}
      </select>
    </div>
    <div class="field">
      <label>Amico</label>
      <select bind:value={filterFriend} onchange={onFilterChange}>
        <option value="all">Tutti</option>
        {#each app.friends as f (f.id)}<option value={f.id}>{f.username || 'Utente'}</option>{/each}
      </select>
    </div>
  </div>
  {#if shown.length}
    {#each shown as r (r.id)}
      <FeedItem r={r} />
    {/each}
    {#if filtered.length > visibleCount}
      <button type="button" class="btn btn-ghost btn-block" style="margin-top:12px;" onclick={() => visibleCount += 8}>Mostra altri ({filtered.length - visibleCount} rimasti)</button>
    {/if}
  {:else}
    <div class="empty-state">Nessuna sessione da mostrare con questi filtri.</div>
  {/if}
</div>
