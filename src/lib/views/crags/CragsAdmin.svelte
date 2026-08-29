<script>
  import { app } from '../../stores/appState.svelte.js';
  import CragAdminRow from './CragAdminRow.svelte';

  let search = $state('');

  const list = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const all = app.crags || [];
    return q ? all.filter(c => c.nome.toLowerCase().includes(q)) : all;
  });
</script>

<div class="main-header">
  <div>
    <h1>Database falesie</h1>
    <p class="sub">Solo utenti Verificati: completa e verifica le info di ogni falesia.</p>
  </div>
</div>
<div class="panel">
  <div class="field"><label>Cerca falesia</label><input type="text" bind:value={search} placeholder="Cerca per nome..."></div>
  {#if list.length}
    {#each list as c (c.id)}
      <CragAdminRow {c} />
    {/each}
  {:else}
    <div class="empty-state">Nessuna falesia trovata.</div>
  {/if}
</div>
