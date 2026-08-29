<script>
  import { DISCIPLINE_LABELS } from '../../constants.js';
  import { app } from '../../stores/appState.svelte.js';
  import { modal, cancelDelete, confirmDelete } from '../../stores/sessionModal.svelte.js';

  const session = $derived(app.sessions.find(s => s.id === modal.pendingDelete));
</script>

{#if modal.pendingDelete}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}>
    <div class="modal delete-confirm" onclick={(e) => e.stopPropagation()}>
      <div class="delete-mark">!</div>
      <h3>Eliminare questa sessione?</h3>
      <p>{session ? `${DISCIPLINE_LABELS[session.disciplina] || 'Sessione'} del ${session.data.split('-').reverse().join('/')}` : 'Questa sessione'} verrà rimossa definitivamente dai tuoi progressi.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick={cancelDelete}>Annulla</button>
        <button type="button" class="btn btn-danger" onclick={confirmDelete}>Elimina sessione</button>
      </div>
    </div>
  </div>
{/if}
