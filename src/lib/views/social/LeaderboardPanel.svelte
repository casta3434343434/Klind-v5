<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { bestGrade, displayGrade, normalizedGradeValue } from '../../utils/grades.js';
  import DeveloperBadge from './DeveloperBadge.svelte';

  const rows = $derived.by(() => {
    if (!app.friends.length) return [];
    const list = [
      { id: '__me__', label: 'Tu', isMe: true, sessions: app.sessions },
      ...app.friends.map(f => ({ id: f.id, label: f.username || 'Utente', isMe: false, friend: f, sessions: app.friendFeed.filter(s => s.authorId === f.id) }))
    ];
    list.forEach(r => { r.rank = normalizedGradeValue('boulder', bestGrade('boulder', r.sessions) || '') || 0; });
    return list.sort((a, b) => b.rank - a.rank);
  });
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head"><div><h3>Classifica generale</h3><p class="sub">Tutti gli amici ordinati per grado massimo boulder raggiunto.</p></div></div>
  {#if rows.length}
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>#</th><th>Atleta</th>{#each DISCIPLINES as d}<th>{DISCIPLINE_LABELS[d]}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each rows as r, i (r.id)}
            <tr class={r.isMe ? 'grade-current' : ''}>
              <td>{i + 1}°</td>
              <td><b>{r.label}</b>{#if r.friend}<DeveloperBadge user={r.friend} />{/if}</td>
              {#each DISCIPLINES as d}
                {@const g = bestGrade(d, r.sessions)}
                <td>{g ? displayGrade(d, g) : '—'}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">Aggiungi qualche amico per iniziare a confrontare i progressi.</div>
  {/if}
</div>
