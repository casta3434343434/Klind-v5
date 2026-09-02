import { app } from '../stores/appState.svelte.js';
import { bestGrade, normalizedGradeValue, displayGrade } from './grades.js';
import { today } from './dates.js';

// Calcola progressi/vincitore lato client in base alle sessioni già caricate (tue + amici).
export function evaluateChallenge(ch) {
  const participants = (ch.participantIds || []).map(id => {
    const isMe = id === app.authUser?.id;
    const friend = app.friends.find(f => f.id === id);
    const sessions = isMe ? app.sessions : (app.friendFeed || []).filter(s => s.authorId === id);
    const username = isMe ? 'Tu' : (friend?.username || 'Utente');
    if (ch.type === 'most_sessions') {
      const inRange = sessions.filter(s => s.data >= ch.start_date && (!ch.end_date || s.data <= ch.end_date));
      return { id, username, isMe, value: inRange.length, unit: 'sessioni' };
    } else {
      const g = bestGrade(ch.disciplina, sessions);
      const norm = g ? normalizedGradeValue(ch.disciplina, g) : 0;
      return { id, username, isMe, value: norm, display: g ? displayGrade(ch.disciplina, g) : '—' };
    }
  }).sort((a, b) => b.value - a.value);

  let winner = null;
  if (ch.type === 'most_sessions' && ch.end_date && ch.end_date < today()) {
    winner = participants[0];
  } else if (ch.type === 'first_to_grade') {
    const targetNorm = normalizedGradeValue(ch.disciplina, ch.target_grade);
    winner = participants.find(p => p.value >= targetNorm) || null;
  }
  return { participants, winner };
}
