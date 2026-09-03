import { app } from './appState.svelte.js';
import { today } from '../utils/dates.js';
import { upsertSession, deleteSessionRemote } from '../api/sessions.js';
import { addCrag } from '../api/crags.js';
import { defaultScaleForDiscipline } from '../utils/grades.js';

export const modal = $state({
  showForm: false,
  formSession: null,
  editingClimbIndex: null,
  pendingDelete: null,
  activeDiscipline: 'boulder'
});

export function emptySession(date, disc) {
  const d = disc || 'boulder';
  return {
    id: null, data: date || today(), disciplina: d, discipline: [d], luogo: 'King Rock', salvaLuogo: false, luogoNome: '', luogoIndirizzo: '', durata: '', privacy: 'amici',
    // scala gradi è per-disciplina: una sessione può contenere più discipline
    // insieme (es. boulder + lead) e non devono condividere lo stesso valore,
    // altrimenti si sovrascrivono a vicenda. Le cadute invece sono per
    // singolo blocco/via (dentro blocchiByDiscipline), non qui.
    scalaByDiscipline: { [d]: defaultScaleForDiscipline(d, app.sessions) },
    blocchi: [], blocchiByDiscipline: { [d]: [] },
    boulder: { completati: 0 },
    lead: { vie: 0 },
    moonboard: { layout: '2024', angolo: '40°', grado: '', problemi: 0, benchmark: false },
    rpe: '', rpeLocale: '', statoMentale: '',
    note: '', showNote: false
  };
}

export function openNewSession(disc = 'boulder', date = today()) {
  modal.formSession = emptySession(date, disc);
  modal.editingClimbIndex = null;
  modal.activeDiscipline = disc;
  modal.showForm = true;
}

export function openEditSession(session) {
  modal.formSession = JSON.parse(JSON.stringify(session));
  const f = modal.formSession;
  if (!Array.isArray(f.blocchi)) f.blocchi = [];
  f.discipline = [...new Set(f.discipline || [f.disciplina])];
  f.blocchiByDiscipline ||= { [f.disciplina]: f.blocchi || [] };

  // Sessioni salvate prima della correzione avevano la scala condivisa a
  // livello di sessione invece che per disciplina: la portiamo dentro la
  // nuova mappa così non si perde nulla aprendo una sessione vecchia.
  f.scalaByDiscipline ||= {};
  if (f.scala && !f.scalaByDiscipline[f.disciplina]) f.scalaByDiscipline[f.disciplina] = f.scala;
  f.discipline.forEach(d => { f.scalaByDiscipline[d] ||= defaultScaleForDiscipline(d, app.sessions); });

  f.showNote = !!f.note;

  modal.activeDiscipline = f.discipline[0] || f.disciplina;
  modal.editingClimbIndex = null;
  modal.showForm = true;
}

// Aggiunge una disciplina alla sessione (o, se già presente, la rende
// semplicemente quella attiva/in modifica — non la aggiunge due volte).
export function addDiscipline(disc) {
  const f = modal.formSession;
  if (!f) return;
  const selected = f.discipline || [f.disciplina];
  if (!selected.includes(disc)) {
    f.discipline = [...selected, disc];
    f.blocchiByDiscipline ||= {};
    f.blocchiByDiscipline[disc] ||= [];
    f.scalaByDiscipline ||= {};
    f.scalaByDiscipline[disc] ||= defaultScaleForDiscipline(disc, app.sessions);
  }
  modal.activeDiscipline = disc;
}

// Rimuove esplicitamente una disciplina dalla sessione, insieme a tutti i
// blocchi/vie che aveva. Il pulsante × compare solo per le discipline che
// hanno davvero del contenuto (vedi SessionModal.svelte), quindi qui non
// serve più impedire di svuotarle tutte: una sessione rimasta senza nessun
// blocco viene comunque gestita da submitSession al momento del salvataggio.
export function removeDiscipline(disc) {
  const f = modal.formSession;
  if (!f) return;
  f.discipline = (f.discipline || []).filter(d => d !== disc);
  delete f.blocchiByDiscipline?.[disc];
  delete f.scalaByDiscipline?.[disc];
  if (modal.activeDiscipline === disc) {
    // torna a mostrare una disciplina con contenuto se ce n'è ancora una,
    // altrimenti semplicemente la prima rimasta (anche vuota) o boulder di default
    const withContent = (f.discipline || []).find(d => (f.blocchiByDiscipline?.[d] || []).length > 0);
    modal.activeDiscipline = withContent || f.discipline?.[0] || 'boulder';
  }
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
  const visited = [...new Set(f.discipline || [f.disciplina])];
  const completed = visited.filter(disc => (f.blocchiByDiscipline?.[disc] || []).length > 0);
  f.discipline = completed.length ? completed : [visited[0] || f.disciplina];
  f.disciplina = f.discipline[0];
  f.blocchi = f.blocchiByDiscipline?.[f.disciplina] || f.blocchi || [];
  // pulizia: non ci portiamo dietro impostazioni orfane di discipline tolte
  Object.keys(f.scalaByDiscipline || {}).forEach(d => { if (!f.discipline.includes(d)) delete f.scalaByDiscipline[d]; });
  if (f.salvaLuogo) {
    const nome = (f.luogoNome || f.luogo || '').trim();
    if (nome) {
      const savedCrag = await addCrag(nome, 'palestra', f.luogoIndirizzo || '', '');
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
