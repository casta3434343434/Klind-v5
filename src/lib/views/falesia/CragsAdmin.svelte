<script>
  import { app } from '../../stores/appState.svelte.js';
  import CragAdminRow from './CragAdminRow.svelte';

  const list = $derived.by(() => {
    const q = (app.cragsAdminSearch || '').trim().toLowerCase();
    return (app.crags || []).filter(c => !q || c.nome.toLowerCase().includes(q));
  });
</script>

<div class="main-header"><div><h1>Database falesie</h1><p class="sub">Solo utenti Verificati: completa e verifica le info di ogni falesia.</p></div></div>
<div class="panel">
  <div class="field"><label>Cerca falesia</label><input type="text" placeholder="Cerca per nome..." bind:value={app.cragsAdminSearch}></div>
  {#if list.length}
    {#each list as c (c.id)}<CragAdminRow crag={c} />{/each}
  {:else}
    <div class="empty-state">Nessuna falesia trovata.</div>
  {/if}
</div>
