<script>
  import { TEST_TYPES, TEST_LABELS } from '../../constants.js';
  import { testModal, closeTestModal, submitTest } from '../../stores/testModal.svelte.js';

  const t = $derived(testModal.formTest);
  let busy = $state(false);

  async function onSubmit(e) {
    e.preventDefault();
    busy = true;
    try { await submitTest(); } finally { busy = false; }
  }

  function overlayClick(e) { if (e.target === e.currentTarget) closeTestModal(); }
</script>

{#if testModal.showTest && t}
  <div class="modal-overlay" onclick={overlayClick}>
    <div class="modal" style="max-width:420px;" onclick={(e) => e.stopPropagation()}>
      <div class="modal-head"><h3>Nuovo test</h3><button class="close-x" onclick={closeTestModal} aria-label="Chiudi">×</button></div>
      <form onsubmit={onSubmit}>
        <div class="field"><label>Data</label><input type="date" bind:value={t.data}></div>
        <div class="field"><label>Tipo</label>
          <select bind:value={t.tipo}>
            {#each TEST_TYPES as x}<option value={x}>{TEST_LABELS[x]}</option>{/each}
          </select>
        </div>
        <div class="field"><label>Valore</label><input type="number" step="0.1" bind:value={t.valore}></div>
        <div class="field-row">
          <div class="field"><label>Tacca (mm)</label><input type="number" bind:value={t.edge}></div>
          <div class="field"><label>Presa</label>
            <select bind:value={t.presa}>
              <option>Mezzo crimp</option>
              <option>Crimp aperto</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Note</label><input type="text" bind:value={t.note}></div>
        <div class="modal-actions">
          <div></div>
          <div>
            <button type="button" class="btn btn-ghost" onclick={closeTestModal}>Annulla</button>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva'}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}
