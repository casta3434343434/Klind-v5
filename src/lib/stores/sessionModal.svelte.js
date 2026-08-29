import { app } from './appState.svelte.js';
import { today } from '../utils/dates.js';
import { upsertSession, deleteSessionRemote } from '../api/sessions.js';
import { addCrag } from '../api/crags.js';

export const modal = $state({
  showForm: false,
  formSession: null,
  editingClimbIndex: null,
  pendingDelete: null // id della sessione da confermare in eliminazione
});

export function emptySession(date, disc) {
  return {
    id: null, data: date || today(), disciplina: disc || 'boulder', luogo: 'King Rock', salvaLuogo: false, luogoNome: '', luogoIndirizzo: '', durata: '', privacy: 'amici',
    showSensazioni: false,
    scala: app.profile?.scala || 'font',
    blocchi: [],
    boulder: { completati: 0 },
    lead: { vie: 0 }, cadute: '',
    moonboard: { layout: '2024', angolo: '40°', grado: '', problemi: 0, benchmark: false },
    rpe: '', rpeLocale: '', statoMentale: '', riscaldamento: '',
    infortunio: { zona: '', gravita: '', dettagli: '' },
    note: ''
  };
}

export function openNewSession(disc = 'boulder', date = today()) {
  modal.formSession = emptySession(date, disc);
  modal.editingClimbIndex = null;
  modal.showForm = true;
}

export function openEditSession(session) {
  modal.formSession = JSON.parse(JSON.stringify(session));
  if (!Array.isArray(modal.formSession.blocchi)) modal.formSession.blocchi = [];
  modal.editingClimbIndex = null;
  modal.showForm = true;
}

export function closeModal() {
  modal.showForm = false;
  modal.formSession = null;
  modal.editingClimbIndex = null;
}

export function requestDelete(id) {
  modal.pendingDelete = id;
}

export function cancelDelete() {
  modal.pendingDelete = null;
}

export async function confirmDelete() {
  const id = modal.pendingDelete;
  if (!id) return;
  const ok = await deleteSessionRemote(id);
  if (ok) {
    app.sessions = app.sessions.filter(s => s.id !== id);
    if (modal.formSession?.id === id) closeModal();
  }
  modal.pendingDelete = null;
}

export async function submitSession() {
  const f = modal.formSession;
  if (!f) return;
  if (f.salvaLuogo) {
    const nome = (f.luogoNome || f.luogo || '').trim();
    if (nome) {
      const tipo = f.disciplina === 'falesia' ? 'falesia' : 'palestra';
      const savedCrag = await addCrag(nome, tipo, f.luogoIndirizzo || '', '');
      if (savedCrag) f.luogo = savedCrag.nome;
    }
  }
  const saved = await upsertSession(f);
  if (saved) {
    const idx = app.sessions.findIndex(s => s.id === saved.id);
    if (idx >= 0) app.sessions[idx] = saved; else app.sessions.push(saved);
    closeModal();
  }
}
