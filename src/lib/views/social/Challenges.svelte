<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { createChallenge, deleteChallenge, leaveChallenge } from '../../api/challenges.js';
  import { evaluateChallenge } from '../../utils/challenges.js';

  function toggleMember(id) {
    app.newChallengeMemberIds = app.newChallengeMemberIds.includes(id)
      ? app.newChallengeMemberIds.filter(x => x !== id)
      : [...app.newChallengeMemberIds, id];
  }

  function submit() {
    const payload = app.newChallengeType === 'most_sessions'
      ? { name: app.newChallengeName, type: 'most_sessions', start_date: new Date().toISOString().slice(0, 10), end_date: app.newChallengeEndDate }
      : { name: app.newChallengeName, type: 'first_to_grade', disciplina: app.newChallengeDisc, target_grade: app.newChallengeTargetGrade };
    createChallenge(payload, app.newChallengeMemberIds);
  }
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head">
    <div><h3>Sfide</h3><p class="sub">Sfida i tuoi amici: più sessioni nel periodo o primo a raggiungere un grado.</p></div>
    <button class="btn btn-primary btn-sm" onclick={() => app.showCreateChallenge = !app.showCreateChallenge}>{app.showCreateChallenge ? 'Annulla' : '+ Nuova sfida'}</button>
  </div>

  {#if app.showCreateChallenge}
    <div style="margin-top:14px;padding:16px;background:var(--bg-alt);border-radius:8px;">
      <div class="field"><label>Nome della sfida</label><input type="text" placeholder="es. Più sessioni di agosto" bind:value={app.newChallengeName}></div>
      <div class="field"><label>Tipo</label>
        <select bind:value={app.newChallengeType}>
          <option value="most_sessions">Chi fa più sessioni entro una data</option>
          <option value="first_to_grade">Primo a raggiungere un grado</option>
        </select>
      </div>
      {#if app.newChallengeType === 'most_sessions'}
        <div class="field"><label>Termina il</label><input type="date" bind:value={app.newChallengeEndDate}></div>
      {:else}
        <div class="field-row">
          <div class="field"><label>Disciplina</label>
            <select bind:value={app.newChallengeDisc}>
              {#each DISCIPLINES as d}<option value={d}>{DISCIPLINE_LABELS[d]}</option>{/each}
            </select>
          </div>
          <div class="field"><label>Grado obiettivo</label><input type="text" placeholder="es. 7A" bind:value={app.newChallengeTargetGrade}></div>
        </div>
      {/if}
      <label>Partecipanti</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        {#if app.friends?.length}
          {#each app.friends as f}
            <label style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;cursor:pointer;">
              <input type="checkbox" checked={app.newChallengeMemberIds.includes(f.id)} onchange={() => toggleMember(f.id)} style="width:auto;"> {f.username}
            </label>
          {/each}
        {:else}
          <span class="sub">Aggiungi prima qualche amico.</span>
        {/if}
      </div>
      <button class="btn btn-primary" onclick={submit}>Crea sfida</button>
    </div>
  {/if}

  {#if app.challenges?.length}
    {#each app.challenges as ch}
      {@const evalResult = evaluateChallenge(ch)}
      {@const isCreator = ch.creator_id === app.authUser?.id}
      <div class="challenge-card">
        <div class="panel-head" style="margin-bottom:8px;">
          <div><b>{ch.name}</b> <span class="sub">· {ch.type === 'most_sessions' ? `più sessioni entro ${ch.end_date ? ch.end_date.split('-').reverse().join('/') : '—'}` : `primo a ${ch.target_grade} (${DISCIPLINE_LABELS[ch.disciplina]})`}</span></div>
          {#if isCreator}
            <button class="btn btn-sm btn-danger" onclick={() => deleteChallenge(ch.id)}>Elimina</button>
          {:else}
            <button class="btn btn-sm btn-danger" onclick={() => leaveChallenge(ch.id)}>Abbandona</button>
          {/if}
        </div>
        {#if evalResult.winner}<div class="sub" style="color:var(--lime);margin-bottom:8px;">Vince {evalResult.winner.username}</div>{/if}
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Atleta</th><th>{ch.type === 'most_sessions' ? 'Sessioni' : 'Grado max'}</th></tr>
            </thead>
            <tbody>
              {#each evalResult.participants as p}
                <tr class={p.isMe ? 'grade-current' : ''}>
                  <td>{#if evalResult.winner?.id === p.id}<b style="color:var(--lime);">Vince — </b>{/if}<b>{p.username}</b></td>
                  <td>{ch.type === 'most_sessions' ? p.value : (p.display || '—')}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state" style="margin-top:14px;">Nessuna sfida attiva. Creane una per iniziare a sfidare gli amici.</div>
  {/if}
</div>
