<script>
  import { DISCIPLINES, DISCIPLINE_LABELS } from '../../constants.js';
  import { modal, closeModal, submitSession, requestDelete } from '../../stores/sessionModal.svelte.js';
  import CragPicker from './CragPicker.svelte';
  import DisciplineFields from './DisciplineFields.svelte';
  import SensazioniPanel from './SensazioniPanel.svelte';

  const f = $derived(modal.formSession);
  const isFalesia = $derived(f?.disciplina === 'falesia');
  const availableDiscs = $derived(isFalesia ? ['falesia'] : DISCIPLINES.filter(d => d !== 'falesia'));

  let busy = $state(false);

  async function onSubmit(e) {
    e.preventDefault();
    busy = true;
    try { await submitSession(); } finally { busy = false; }
  }

  function overlayClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }
</script>

{#if f}
  <div class="modal-overlay" onclick={overlayClick}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-head">
        <h3>{f.id ? 'Modifica' : 'Nuova'} sessione — {f.data.split('-').reverse().join('/')}</h3>
        <button class="close-x" onclick={closeModal} aria-label="Chiudi">×</button>
      </div>
      <form onsubmit={onSubmit}>
        <div class="discipline-toggle">
          {#each availableDiscs as d}
            <button type="button" class="disc-btn {f.disciplina === d ? 'on' : ''}" onclick={() => f.disciplina = d}>{DISCIPLINE_LABELS[d]}</button>
          {/each}
        </div>

        <div class="field-row">
          <div class="field"><label>Data</label><input type="date" bind:value={f.data}></div>
        </div>
        <div class="field-row">
          <CragPicker session={f} />
          <div class="field"><label>Durata (min)</label><input type="number" bind:value={f.durata}></div>
        </div>
        <div class="field"><label>Riscaldamento (min)</label><input type="number" bind:value={f.riscaldamento}></div>
        <div class="field"><label>Chi può vedere questa sessione</label>
          <select bind:value={f.privacy}>
            <option value="privato">Solo io</option>
            <option value="amici">Amici</option>
            <option value="pubblico">Pubblico</option>
          </select>
        </div>
        <div class="field"><label>Note sessione</label><textarea rows="2" bind:value={f.note}></textarea></div>

        <fieldset>
          <legend>{DISCIPLINE_LABELS[f.disciplina]}</legend>
          <DisciplineFields session={f} />
        </fieldset>

        <SensazioniPanel session={f} />

        <div class="modal-actions">
          <div>{#if f.id}<button type="button" class="btn btn-danger" onclick={() => requestDelete(f.id)}>Elimina</button>{/if}</div>
          <div>
            <button type="button" class="btn btn-ghost" onclick={closeModal}>Annulla</button>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva'}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
{/if}
