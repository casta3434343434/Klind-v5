<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { bestGrade, displayGrade, normalizedGradeValue } from '../../utils/grades.js';

  const rows = $derived.by(() => {
    const list = [
      { id: '__me__', label: 'Tu', isMe: true, sessions: app.sessions },
      ...app.friends.map(f => ({ id: f.id, label: f.username || 'Utente', isMe: false, friend: f, sessions: (app.friendFeed || []).filter(s => s.authorId === f.id) }))
    ];
    list.forEach(r => { r.rank = normalizedGradeValue('boulder', bestGrade('boulder', r.sessions) || '') ?? -1; });
    list.sort((a, b) => b.rank - a.rank);
    return list;
  });
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head"><div><h3>Classifica generale</h3><p class="sub">Tutti gli amici ordinati per grado massimo boulder raggiunto.</p></div></div>
  {#if app.friends?.length}
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>#</th><th>Atleta</th>{#each DISCIPLINES as d}<th>{DISCIPLINE_LABELS[d]}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each rows as r, i}
            <tr class={r.isMe ? 'grade-current' : ''}>
              <td>{i + 1}°</td>
              <td><b>{r.label}</b>{#if r.friend?.is_developer}<span class="developer-badge">Developer</span>{/if}</td>
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
