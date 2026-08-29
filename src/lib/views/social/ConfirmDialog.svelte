<script>
  import { confirmState, cancelConfirm, runConfirm } from '../../stores/confirm.svelte.js';

  let busy = $state(false);

  async function onConfirm() {
    busy = true;
    try { await runConfirm(); } finally { busy = false; }
  }
</script>

{#if confirmState.pending}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) cancelConfirm(); }}>
    <div class="modal delete-confirm" onclick={(e) => e.stopPropagation()}>
      <div class="delete-mark">!</div>
      <h3>{confirmState.pending.title}</h3>
      <p>{confirmState.pending.message}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick={cancelConfirm}>Annulla</button>
        <button type="button" class="btn btn-danger" disabled={busy} onclick={onConfirm}>{busy ? 'Attendere…' : confirmState.pending.confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}
