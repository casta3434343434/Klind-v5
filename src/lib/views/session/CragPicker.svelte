<script>
  import { app } from '../../stores/appState.svelte.js';

  let { session } = $props();

  let query = $state(session.luogo || '');
  let pickerOpen = $state(false);

  const isFalesia = $derived(session.disciplina === 'falesia');
  const tipo = $derived(isFalesia ? 'falesia' : 'palestra');

  const matches = $derived.by(() => {
    const places = (app.crags || []).filter(c => (c.tipo || 'falesia') === tipo);
    const q = query.trim().toLowerCase();
    return (q ? places.filter(c => c.nome.toLowerCase().includes(q)) : places).slice(0, 8);
  });

  function onInput(e) {
    query = e.target.value;
    session.luogo = query;
    pickerOpen = query.trim().length > 0;
  }

  function pick(nome) {
    session.luogo = nome;
    query = nome;
    pickerOpen = false;
  }

  function toggleSalvaLuogo(e) {
    session.salvaLuogo = e.target.checked;
    if (session.salvaLuogo && !session.luogoNome) session.luogoNome = session.luogo || '';
  }
</script>

<div class="field crag-field">
  <div class="place-label-row">
    <label>Luogo</label>
    <label class="save-place-label">
      <input type="checkbox" checked={session.salvaLuogo} onchange={toggleSalvaLuogo}>
      {isFalesia ? 'Salva falesia' : 'Salva palestra'}
    </label>
  </div>
  <input type="text" autocomplete="off" value={query} oninput={onInput} onfocus={() => pickerOpen = query.trim().length > 0} placeholder="Cerca o scrivi una falesia/palestra...">
  {#if pickerOpen}
    <div class="crag-dropdown">
      {#each matches as c}
        <button type="button" class="crag-option" onclick={() => pick(c.nome)}>{c.nome}</button>
      {/each}
      {#if !matches.length}
        <div class="crag-option-empty">{isFalesia ? 'Nessuna falesia trovata.' : 'Nessuna palestra trovata.'}</div>
      {/if}
    </div>
  {/if}
  {#if session.salvaLuogo}
    <div class="crag-add-form" style="margin-top:8px;">
      <div class="field" style="margin-bottom:8px;"><label>Nome</label><input type="text" bind:value={session.luogoNome}></div>
      <div class="field" style="margin-bottom:0;"><label>Indirizzo</label><input type="text" placeholder="es. Via Muro Padri, Verona" bind:value={session.luogoIndirizzo}></div>
      <p class="sub" style="font-size:12px;margin-top:6px;">Verrà aggiunto al database in attesa di verifica: un utente Verificato completerà le altre info in seguito.</p>
    </div>
  {/if}
</div>
