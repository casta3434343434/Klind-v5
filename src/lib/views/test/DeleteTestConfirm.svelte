<script>
  import { testModal, cancelDeleteTest, confirmDeleteTest } from '../../stores/testModal.svelte.js';
</script>

{#if testModal.pendingDeleteTest}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelDeleteTest(); }}>
    <div class="modal delete-confirm" onclick={(e) => e.stopPropagation()}>
      <div class="delete-mark">!</div>
      <h3>Eliminare questo test?</h3>
      <p>Il test verrà rimosso definitivamente dal tuo storico.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick={cancelDeleteTest}>Annulla</button>
        <button type="button" class="btn btn-danger" onclick={confirmDeleteTest}>Elimina test</button>
      </div>
    </div>
  </div>
{/if}
