import { sessionGrade, bestGrade } from './grades.js';

// È il grado più alto mai raggiunto da quell'amico in quella disciplina, tra le
// sessioni caricate nel feed? Usato per evidenziare i "record" nel feed amici.
export function isFeedRecord(session, friendFeed) {
  if (!session.authorId) return false;
  const disc = session.disciplina;
  const grade = sessionGrade(session, disc);
  if (!grade) return false;
  const friendSessions = (friendFeed || []).filter(s => s.authorId === session.authorId);
  const best = bestGrade(disc, friendSessions);
  return !!best && grade === best;
}
