<script>
  import { app } from '../stores/appState.svelte.js';
  import { DISCIPLINE_LABELS } from '../constants.js';
  import { sessionGrade, sessionDisciplines, sessionClimbs, displaySessionGrade } from '../utils/grades.js';
  import { openNewSession, openEditSession } from '../stores/sessionModal.svelte.js';

  const sorted = $derived([...app.sessions].sort((a, b) => b.data.localeCompare(a.data)));
</script>

<div class="main-header">
  <div><h1>Storico</h1><p class="sub">{sorted.length} sessioni.</p></div>
  <button class="btn btn-primary" onclick={() => openNewSession('boulder')}>+ Nuova</button>
</div>

<div class="panel">
  {#if sorted.length}
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Data</th><th>Disciplina</th><th>Grado</th><th>Linee</th><th>Durata</th><th></th></tr>
        </thead>
        <tbody>
          {#each sorted as r}
            {@const disciplines = sessionDisciplines(r)}
            <tr>
              <td>{r.data.split('-').reverse().join('/')}</td>
              <td><div class="session-disciplines">{#each disciplines as disc}<span class="chip chip-{disc}">{DISCIPLINE_LABELS[disc]}</span>{/each}</div></td>
              <td><div class="session-grades">{#each disciplines as disc}{#if sessionGrade(r, disc)}<span>{displaySessionGrade(r, sessionGrade(r, disc), undefined, disc)}</span>{/if}{/each}</div></td>
              <td>{disciplines.reduce((total, disc) => total + sessionClimbs(r, disc).length, 0)}</td>
              <td>{r.durata || '—'}min</td>
              <td><button class="btn btn-ghost btn-sm" onclick={() => openEditSession(r)}>Modifica</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">Nessuna sessione.</div>
  {/if}
</div>
