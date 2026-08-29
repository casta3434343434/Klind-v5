// Store minimale per il dialogo di conferma generico riusato da Amici e Gruppi
// (rimuovi amico / elimina gruppo / abbandona gruppo) — equivalente Svelte del
// vecchio state.pendingConfirm + tabella di dispatch per action/id.

export const confirmState = $state({ pending: null }); // { title, message, confirmLabel, onConfirm }

export function requestConfirm({ title, message, confirmLabel, onConfirm }) {
  confirmState.pending = { title, message, confirmLabel, onConfirm };
}

export function cancelConfirm() {
  confirmState.pending = null;
}

export async function runConfirm() {
  const pending = confirmState.pending;
  if (!pending) return;
  await pending.onConfirm();
  confirmState.pending = null;
}
