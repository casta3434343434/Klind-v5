<script>
  import { app } from '../../stores/appState.svelte.js';
  import { sessionDisciplines } from '../../utils/grades.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import FeedItem from './FeedItem.svelte';

  const filtered = $derived((app.friendFeed || []).filter(r =>
    (app.feedFilterDiscipline === 'all' || sessionDisciplines(r).includes(app.feedFilterDiscipline)) &&
    (app.feedFilterFriend === 'all' || r.authorId === app.feedFilterFriend)
  ));
  const visible = $derived(app.feedVisibleCount || 8);
  const shown = $derived(filtered.slice(0, visible));
</script>

<div class="panel" style="grid-column:1 / -1;">
  <h3>Feed amici</h3>
  <div class="field-row">
    <div class="field"><label>Disciplina</label>
      <select bind:value={app.feedFilterDiscipline}>
        <option value="all">Tutte</option>
        {#each DISCIPLINES as d}<option value={d}>{DISCIPLINE_LABELS[d]}</option>{/each}
      </select>
    </div>
    <div class="field"><label>Amico</label>
      <select bind:value={app.feedFilterFriend}>
        <option value="all">Tutti</option>
        {#each app.friends as f}<option value={f.id}>{f.username || 'Utente'}</option>{/each}
      </select>
    </div>
  </div>
  {#if shown.length}
    {#each shown as r (r.id)}<FeedItem r={r} />{/each}
  {:else}
    <div class="empty-state">Nessuna sessione da mostrare con questi filtri.</div>
  {/if}
  {#if filtered.length > visible}
    <button type="button" class="btn btn-ghost btn-block" style="margin-top:12px;" onclick={() => app.feedVisibleCount += 8}>Mostra altri ({filtered.length - visible} rimasti)</button>
  {/if}
</div>
