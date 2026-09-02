import { app } from './appState.svelte.js';
import { today } from '../utils/dates.js';
import { insertTest, deleteTestRemote } from '../api/tests.js';

export const testModal = $state({
  showTest: false,
  formTest: null,
  pendingDeleteTest: null
});

export function emptyTest() {
  return { data: today(), tipo: 'maxhang20', valore: '', edge: '20', presa: 'Mezzo crimp', note: '' };
}

export function openNewTest() {
  testModal.formTest = emptyTest();
  testModal.showTest = true;
}

export function closeTestModal() {
  testModal.showTest = false;
  testModal.formTest = null;
}

export function requestDeleteTest(id) {
  testModal.pendingDeleteTest = id;
}

export function cancelDeleteTest() {
  testModal.pendingDeleteTest = null;
}

export async function confirmDeleteTest() {
  const id = testModal.pendingDeleteTest;
  if (!id) return;
  const ok = await deleteTestRemote(id);
  if (ok) app.tests = app.tests.filter(t => t.id !== id);
  testModal.pendingDeleteTest = null;
}

export async function submitTest() {
  const f = testModal.formTest;
  if (!f) return;
  const saved = await insertTest(f);
  if (saved) {
    app.tests = [saved, ...app.tests];
    closeTestModal();
  }
}
