<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { today } from '../../utils/dates.js';
  import { bestGrade, displayGrade, normalizedGradeValue } from '../../utils/grades.js';
  import { createChallenge, deleteChallenge, leaveChallenge } from '../../api/challenges.js';

  let showCreate = $state(false);
  let name = $state('');
  let type = $state('most_sessions'); // 'most_sessions' | 'first_to_grade'
  let endDate = $state('');
  let disc = $state('boulder');
  let targetGrade = $state('');
  let memberIds = $state([]);
  let busy = $state(false);

  function toggleCreate() {
    showCreate = !showCreate;
    if (showCreate) { name = ''; memberIds = []; targetGrade = ''; endDate = ''; }
  }

  function toggleMember(id) {
    memberIds = memberIds.includes(id) ? memberIds.filter(x => x !== id) : [...memberIds, id];
  }

  async function submit() {
    if (!name.trim()) { alert('Dai un nome alla sfida.'); return; }
    busy = true;
    try {
      if (type === 'most_sessions') {
        if (!endDate) { alert('Scegli una data di fine.'); return; }
        await createChallenge({ name: name.trim(), type, start_date: today(), end_date: endDate }, memberIds);
      } else {
        if (!targetGrade.trim()) { alert('Indica un grado obiettivo.'); return; }
        await createChallenge({ name: name.trim(), type, disciplina: disc, target_grade: targetGrade.trim() }, memberIds);
      }
      showCreate = false;
    } finally {
      busy = false;
    }
  }

  function askDelete(id) {
    if (confirm('Eliminare questa sfida?')) deleteChallenge(id);
  }
  function askLeave(id) {
    if (confirm('Abbandonare questa sfida?')) leaveChallenge(id);
  }

  // Calcola progressi/vincitore lato client in base alle sessioni già caricate (tue + amici).
  function evaluateChallenge(ch) {
    const participants = (ch.participantIds || []).map(id => {
      const isMe = id === app.authUser?.id;
      const friend = app.friends.find(f => f.id === id);
      const sessions = isMe ? app.sessions : app.friendFeed.filter(s => s.authorId === id);
      const username = isMe ? 'Tu' : (friend?.username || 'Utente');
      if (ch.type === 'most_sessions') {
        const inRange = sessions.filter(s => s.data >= ch.start_date && (!ch.end_date || s.data <= ch.end_date));
        return { id, username, isMe, value: inRange.length, unit: 'sessioni' };
      } else {
        const g = bestGrade(ch.disciplina, sessions);
        const norm = g ? normalizedGradeValue(ch.disciplina, g) : 0;
        return { id, username, isMe, value: norm, display: g ? displayGrade(ch.disciplina, g) : '—' };
      }
    }).sort((a, b) => b.value - a.value);
    let winner = null;
    if (ch.type === 'most_sessions' && ch.end_date && ch.end_date < today()) {
      winner = participants[0];
    } else if (ch.type === 'first_to_grade') {
      const targetNorm = normalizedGradeValue(ch.disciplina, ch.target_grade);
      winner = participants.find(p => p.value >= targetNorm) || null;
    }
    return { participants, winner };
  }
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head">
    <div><h3>Sfide</h3><p class="sub">Sfida i tuoi amici: più sessioni nel periodo o primo a raggiungere un grado.</p></div>
    <button class="btn btn-primary btn-sm" onclick={toggleCreate}>{showCreate ? 'Annulla' : '+ Nuova sfida'}</button>
  </div>

  {#if showCreate}
    <div style="margin-top:14px;padding:16px;background:var(--bg-alt);border-radius:8px;">
      <div class="field"><label>Nome della sfida</label><input type="text" placeholder="es. Più sessioni di agosto" bind:value={name}></div>
      <div class="field"><label>Tipo</label>
        <select bind:value={type}>
          <option value="most_sessions">Chi fa più sessioni entro una data</option>
          <option value="first_to_grade">Primo a raggiungere un grado</option>
        </select>
      </div>
      {#if type === 'most_sessions'}
        <div class="field"><label>Termina il</label><input type="date" bind:value={endDate}></div>
      {:else}
        <div class="field-row">
          <div class="field"><label>Disciplina</label>
            <select bind:value={disc}>
              {#each DISCIPLINES as d}<option value={d}>{DISCIPLINE_LABELS[d]}</option>{/each}
            </select>
          </div>
          <div class="field"><label>Grado obiettivo</label><input type="text" placeholder="es. 7A" bind:value={targetGrade}></div>
        </div>
      {/if}
      <label>Partecipanti</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        {#if app.friends.length}
          {#each app.friends as f (f.id)}
            <label style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;cursor:pointer;">
              <input type="checkbox" checked={memberIds.includes(f.id)} onchange={() => toggleMember(f.id)} style="width:auto;"> {f.username}
            </label>
          {/each}
        {:else}
          <span class="sub">Aggiungi prima qualche amico.</span>
        {/if}
      </div>
      <button class="btn btn-primary" disabled={busy} onclick={submit}>{busy ? 'Creazione…' : 'Crea sfida'}</button>
    </div>
  {/if}

  {#if app.challenges.length}
    {#each app.challenges as ch (ch.id)}
      {@const { participants, winner } = evaluateChallenge(ch)}
      {@const isCreator = ch.creator_id === app.authUser?.id}
      <div class="challenge-card">
        <div class="panel-head" style="margin-bottom:8px;">
          <div><b>{ch.name}</b> <span class="sub">· {ch.type === 'most_sessions' ? `più sessioni entro ${ch.end_date ? ch.end_date.split('-').reverse().join('/') : '—'}` : `primo a ${ch.target_grade} (${DISCIPLINE_LABELS[ch.disciplina]})`}</span></div>
          {#if isCreator}
            <button class="btn btn-sm btn-danger" onclick={() => askDelete(ch.id)}>Elimina</button>
          {:else}
            <button class="btn btn-sm btn-danger" onclick={() => askLeave(ch.id)}>Abbandona</button>
          {/if}
        </div>
        {#if winner}<div class="sub" style="color:var(--lime);margin-bottom:8px;">Vince {winner.username}</div>{/if}
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Atleta</th><th>{ch.type === 'most_sessions' ? 'Sessioni' : 'Grado max'}</th></tr>
            </thead>
            <tbody>
              {#each participants as p (p.id)}
                <tr class={p.isMe ? 'grade-current' : ''}>
                  <td>{#if winner?.id === p.id}<b style="color:var(--lime);">Vince — </b>{/if}<b>{p.username}</b></td>
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
