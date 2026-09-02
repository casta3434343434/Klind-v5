<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { bestGrade, displayGrade } from '../../utils/grades.js';
  import { createGroup, deleteGroup, leaveGroup, removeGroupMember } from '../../api/groups.js';
  import GroupCompareChart from './GroupCompareChart.svelte';

  function toggleMember(id) {
    app.newGroupMemberIds = app.newGroupMemberIds.includes(id)
      ? app.newGroupMemberIds.filter(x => x !== id)
      : [...app.newGroupMemberIds, id];
  }

  function submitGroup() {
    createGroup(app.newGroupName, app.newGroupMemberIds);
  }

  function sessionsFor(memberId) {
    return memberId === app.authUser?.id ? app.sessions : (app.friendFeed || []).filter(s => s.authorId === memberId);
  }
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head">
    <div><h3>Gruppi</h3><p class="sub">Crea gruppi con i tuoi amici per confrontare le statistiche insieme.</p></div>
    <button class="btn btn-primary btn-sm" onclick={() => app.showCreateGroup = !app.showCreateGroup}>{app.showCreateGroup ? 'Annulla' : '+ Nuovo gruppo'}</button>
  </div>

  {#if app.showCreateGroup}
    <div style="margin-top:14px;padding:16px;background:var(--bg-alt);border-radius:8px;">
      <div class="field"><label>Nome del gruppo</label><input type="text" placeholder="es. Team boulder" bind:value={app.newGroupName}></div>
      <label>Aggiungi amici</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        {#if app.friends?.length}
          {#each app.friends as f}
            <label style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;cursor:pointer;">
              <input type="checkbox" checked={app.newGroupMemberIds.includes(f.id)} onchange={() => toggleMember(f.id)} style="width:auto;"> {f.username}
            </label>
          {/each}
        {:else}
          <span class="sub">Aggiungi prima qualche amico per poterlo inserire in un gruppo.</span>
        {/if}
      </div>
      <button class="btn btn-primary" onclick={submitGroup}>Crea gruppo</button>
    </div>
  {/if}

  {#if app.groups?.length}
    {#each app.groups as g}
      {@const isOwner = g.owner_id === app.authUser?.id}
      {@const isActive = app.activeGroupId === g.id}
      <div style="margin-top:14px;">
        <div class="session-mini">
          <div><b>{g.name}</b> <span class="sub">· {g.members.length} {g.members.length === 1 ? 'membro' : 'membri'}</span></div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm" onclick={() => app.activeGroupId = isActive ? null : g.id}>{isActive ? 'Chiudi' : 'Vedi statistiche'}</button>
            {#if isOwner}
              <button class="btn btn-sm btn-danger" onclick={() => deleteGroup(g.id)}>Elimina gruppo</button>
            {:else}
              <button class="btn btn-sm btn-danger" onclick={() => leaveGroup(g.id)}>Abbandona</button>
            {/if}
          </div>
        </div>
        {#if isActive}
          <div style="padding:16px;background:var(--bg-alt);border-radius:8px;margin-top:8px;">
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
              {#each g.members as m}
                <span style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;">
                  {m.username}{#if m.is_developer}<span class="developer-badge">Developer</span>{/if}
                  {#if isOwner && m.id !== app.authUser?.id}
                    <button onclick={() => removeGroupMember(g.id, m.id)} style="background:none;border:none;color:var(--rust);cursor:pointer;padding:0;font-size:14px;line-height:1;">×</button>
                  {/if}
                </span>
              {/each}
            </div>
            <GroupCompareChart group={g} />
            <div class="table-scroll" style="margin-top:16px;">
              <table>
                <thead>
                  <tr><th>Membro</th>{#each DISCIPLINES as d}<th>{DISCIPLINE_LABELS[d]}</th>{/each}</tr>
                </thead>
                <tbody>
                  {#each g.members as m}
                    {@const sessions = sessionsFor(m.id)}
                    <tr class={m.id === app.authUser?.id ? 'grade-current' : ''}>
                      <td><b>{m.id === app.authUser?.id ? 'Tu' : m.username}</b></td>
                      {#each DISCIPLINES as d}
                        {@const gr = bestGrade(d, sessions)}
                        <td>{gr ? displayGrade(d, gr) : '—'}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div class="empty-state" style="margin-top:14px;">Non fai parte di nessun gruppo. Creane uno per iniziare.</div>
  {/if}
</div>
