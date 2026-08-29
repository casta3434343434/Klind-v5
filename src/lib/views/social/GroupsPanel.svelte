<script>
  import { app } from '../../stores/appState.svelte.js';
  import { createGroup } from '../../api/groups.js';
  import GroupCard from './GroupCard.svelte';

  let showCreate = $state(false);
  let name = $state('');
  let memberIds = $state([]);
  let busy = $state(false);

  function toggleCreate() {
    showCreate = !showCreate;
    if (showCreate) { name = ''; memberIds = []; }
  }

  function toggleMember(id) {
    memberIds = memberIds.includes(id) ? memberIds.filter(x => x !== id) : [...memberIds, id];
  }

  async function submit() {
    busy = true;
    try {
      await createGroup(name, memberIds);
      showCreate = false;
    } finally {
      busy = false;
    }
  }
</script>

<div class="panel" style="grid-column:1 / -1;">
  <div class="panel-head">
    <div><h3>Gruppi</h3><p class="sub">Crea gruppi con i tuoi amici per confrontare le statistiche insieme.</p></div>
    <button class="btn btn-primary btn-sm" onclick={toggleCreate}>{showCreate ? 'Annulla' : '+ Nuovo gruppo'}</button>
  </div>

  {#if showCreate}
    <div style="margin-top:14px;padding:16px;background:var(--bg-alt);border-radius:8px;">
      <div class="field"><label>Nome del gruppo</label><input type="text" placeholder="es. Team boulder" bind:value={name}></div>
      <label>Aggiungi amici</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        {#if app.friends.length}
          {#each app.friends as f (f.id)}
            <label style="display:flex;align-items:center;gap:6px;background:var(--surface-2);padding:6px 12px;border-radius:999px;font-size:14px;cursor:pointer;">
              <input type="checkbox" checked={memberIds.includes(f.id)} onchange={() => toggleMember(f.id)} style="width:auto;"> {f.username}
            </label>
          {/each}
        {:else}
          <span class="sub">Aggiungi prima qualche amico per poterlo inserire in un gruppo.</span>
        {/if}
      </div>
      <button class="btn btn-primary" disabled={busy} onclick={submit}>{busy ? 'Creazione…' : 'Crea gruppo'}</button>
    </div>
  {/if}

  {#if app.groups.length}
    {#each app.groups as g (g.id)}
      <GroupCard group={g} />
    {/each}
  {:else}
    <div class="empty-state" style="margin-top:14px;">Non fai parte di nessun gruppo. Creane uno per iniziare.</div>
  {/if}
</div>
