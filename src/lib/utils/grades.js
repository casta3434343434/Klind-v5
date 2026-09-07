import { BOULDER_SCALE, ROUTE_SCALE, KING_ROCK, FONT_TO_KING, KING_TO_FONT, BOULDER_SCALES, LEAD_SCALES } from '../constants.js';

// Elenco (senza duplicati) delle discipline presenti in una sessione. NON
// filtriamo su DISCIPLINES: una vecchia sessione falesia deve continuare a
// mostrare correttamente il proprio chip anche ora che falesia non è più
// selezionabile per le sessioni nuove.
export function sessionDisciplines(session) {
  const values = session?.discipline || session?.disciplines || (session?.disciplina ? [session.disciplina] : []);
  return [...new Set(values)];
}

export function sessionClimbs(session, disc) {
  return session?.blocchiByDiscipline?.[disc] || (session?.disciplina === disc ? session?.blocchi || [] : []);
}
export function getScale(disc) {
  if (disc === 'lead' || disc === 'circuiti') return ROUTE_SCALE;
  return BOULDER_SCALE;
}

// Scala predefinita per una disciplina: guarda le sessioni più recenti
// dell'utente per quella disciplina e riusa l'ultima scala che ha scelto
// davvero (così se di solito usi Font per il boulder, ti si ripropone Font,
// non un default fisso uguale per tutti). Se non c'è ancora nessuno storico
// per quella disciplina, usa la scala "nativa"/internazionale di riferimento
// (marcata `native:true` nelle costanti — King Rock per il boulder, essendo
// la scala di palestra usata qui, Francese per lead/circuiti). Il Moonboard
// non espone la scelta della scala all'utente: resta sempre Font.
export function defaultScaleForDiscipline(disc, sessions) {
  if (disc === 'moonboard') return 'font';
  const recent = (sessions || [])
    .filter(s => s.discipline?.includes(disc) && s.scalaByDiscipline?.[disc])
    .sort((a, b) => b.data.localeCompare(a.data));
  if (recent.length) return recent[0].scalaByDiscipline[disc];

  const options = (disc === 'lead' || disc === 'circuiti') ? LEAD_SCALES : BOULDER_SCALES;
  return options.find(o => o.native)?.id || options[0]?.id || 'font';
}

export function gradeIndex(scale, g) {
  return scale.indexOf(g);
}

export function fontToKing(font) { return FONT_TO_KING[font] || font; }
export function kingToFont(king) { return KING_TO_FONT[king] || king; }

export function getKingLabel(id) {
  const k = KING_ROCK.find(k => k.id === id);
  return k ? `${k.label} (${k.range})` : id;
}

// Indice di un grado King Rock nella propria scala, gestendo sia i blocchi
// nuovi (che salvano l'ID King direttamente, es. "3+") sia quelli vecchi
// salvati prima di questa correzione (che avevano il grado già convertito
// in Font, es. "6A" — li si riconosce perché non sono un ID King valido, e
// si convertono al volo per il confronto).
function kingGradeIndex(grade) {
  let idx = KING_ROCK.findIndex(k => k.id === grade);
  if (idx === -1) idx = KING_ROCK.findIndex(k => k.id === fontToKing(grade));
  return idx;
}

// Grado più alto raggiunto in una singola sessione, considerando tutti i
// blocchi/vie registrati per quella disciplina (per Moonboard conta il
// grado User se presente, altrimenti il Setter — vedi sessionClimbs).
export function sessionGrade(s, disc) {
  const sessionScale = s.scalaByDiscipline?.[disc];
  const isKingBoulder = disc === 'boulder' && sessionScale === 'king';
  const scale = getScale(disc);
  const idxOf = grade => isKingBoulder ? kingGradeIndex(grade) : gradeIndex(scale, grade);
  const grades = sessionClimbs(s, disc).map(item => item.gradoUser || item.grado || '').filter(Boolean);
  return grades.reduce((best, grade) => idxOf(grade) > idxOf(best) ? grade : best, '');
}

// Confronta il grado migliore tra più sessioni, anche se sono state
// registrate con scale diverse tra loro (es. una sessione in King Rock e
// un'altra in Font): il confronto passa dal valore normalizzato comune
// (vedi normalizedGradeValue), mentre il grado restituito resta quello
// "nativo" della sessione vincente, per mostrarlo così come l'utente l'ha
// registrato.
export function bestGrade(disc, sessions) {
  let best = null;
  let bestNorm = -1;
  sessions.filter(s => sessionDisciplines(s).includes(disc)).forEach(s => {
    const g = sessionGrade(s, disc);
    if (g) {
      const norm = normalizedGradeValue(disc, g);
      if (norm !== null && norm > bestNorm) { bestNorm = norm; best = g; }
    }
  });
  return best;
}

// È il grado più alto mai raggiunto da quell'amico in quella disciplina, tra le sessioni caricate nel feed?
export function isFeedRecord(session, friendFeed) {
  if (!session.authorId) return false;
  const disc = session.disciplina;
  const grade = sessionGrade(session, disc);
  if (!grade) return false;
  const friendSessions = (friendFeed || []).filter(s => s.authorId === session.authorId);
  const best = bestGrade(disc, friendSessions);
  return !!best && grade === best;
}

const CONVERSIONS = {
  font: {
    boulder: g => g,
    lead: g => ({'4a':'4','4b':'4','4c':'5','5a':'5','5b':'5+','5c':'5+','6a':'6A','6a+':'6A+','6b':'6B','6b+':'6B+','6c':'6C','6c+':'6C+','7a':'7A','7a+':'7A+','7b':'7B','7b+':'7B+','7c':'7C','7c+':'7C+','8a':'8A','8a+':'8A+','8b':'8B','8b+':'8B+','8c':'8C','8c+':'8C+','9a':'9A','9a+':'9A','9b':'9A'}[g] || g)
  },
  french: {
    boulder: g => ({'4':'4a','5':'4c','5+':'5b','6A':'6a','6A+':'6a+','6B':'6b','6B+':'6b+','6C':'6c','6C+':'6c+','7A':'7a','7A+':'7a+','7B':'7b','7B+':'7b+','7C':'7c','7C+':'7c+','8A':'8a','8A+':'8a+','8B':'8b','8B+':'8b+','8C':'8c','8C+':'8c+','9A':'9a'}[g] || g),
    lead: g => g
  },
  yds: {
    boulder: g => ({'4':'5.4','5':'5.6','5+':'5.7','6A':'5.10a','6A+':'5.10b','6B':'5.10c','6B+':'5.10d','6C':'5.11a','6C+':'5.11c','7A':'5.11d','7A+':'5.12a','7B':'5.12b','7B+':'5.12c','7C':'5.12d','7C+':'5.13a','8A':'5.13b','8A+':'5.13c','8B':'5.13d','8B+':'5.14a','8C':'5.14b','8C+':'5.14c','9A':'5.14d'}[g] || g),
    lead: g => ({'4a':'5.4','4b':'5.5','4c':'5.6','5a':'5.7','5b':'5.8','5c':'5.9','6a':'5.10a','6a+':'5.10b','6b':'5.10c','6b+':'5.10d','6c':'5.11a','6c+':'5.11c','7a':'5.11d','7a+':'5.12a','7b':'5.12b','7b+':'5.12c','7c':'5.12d','7c+':'5.13a','8a':'5.13b','8a+':'5.13c','8b':'5.13d','8b+':'5.14a','8c':'5.14b','8c+':'5.14c','9a':'5.14d','9a+':'5.15a','9b':'5.15b'}[g] || g)
  },
  v: {
    boulder: g => ({'4':'VB','5':'V0','5+':'V1','6A':'V3','6A+':'V3','6B':'V4','6B+':'V4','6C':'V5','6C+':'V5','7A':'V6','7A+':'V7','7B':'V8','7B+':'V8','7C':'V9','7C+':'V10','8A':'V11','8A+':'V12','8B':'V13','8B+':'V14','8C':'V15','8C+':'V16','9A':'V17'}[g] || g),
    lead: g => ({'4a':'VB','4b':'VB','4c':'V1','5a':'V1','5b':'V2','5c':'V2','6a':'V3','6a+':'V4','6b':'V4','6b+':'V5','6c':'V5','6c+':'V6','7a':'V6','7a+':'V7','7b':'V8','7b+':'V8','7c':'V9','7c+':'V10','8a':'V11','8a+':'V12','8b':'V13','8b+':'V14','8c':'V15','8c+':'V16','9a':'V17','9a+':'V17','9b':'V17'}[g] || g)
  }
};

export function displayGrade(disc, grade, scale, profileScale) {
  if (!grade) return '';
  const pref = scale || profileScale || (disc === 'lead' ? 'french' : 'font');
  const isBoulderFamily = !['lead', 'moonboard', 'circuiti', 'falesia'].includes(disc);
  const isNativeKing = isBoulderFamily && KING_ROCK.some(k => k.id === grade);

  if (pref === 'king' && isBoulderFamily) {
    return isNativeKing ? getKingLabel(grade) : getKingLabel(fontToKing(grade));
  }

  // Un grado registrato nativamente in King (es. "3+") non è di per sé un
  // grado Font: se l'utente vuole vederlo in un'altra scala, lo convertiamo
  // prima nel suo equivalente Font approssimato, poi procediamo come al
  // solito — la conversione tra sistemi di grading diversi è per natura
  // approssimata, qui succede solo quando serve davvero (scala diversa da
  // quella in cui è stato registrato).
  const fontGrade = isNativeKing ? kingToFont(grade) : grade;
  const map = CONVERSIONS[pref]?.[(disc === 'circuiti' || disc === 'falesia') ? 'lead' : disc];
  return map ? map(fontGrade) : fontGrade;
}

export function displaySessionGrade(session, grade, profileScale, disc = session.disciplina) {
  return displayGrade(disc, grade, disc === 'boulder' ? 'king' : session.scalaByDiscipline?.[disc], profileScale);
}

// Converte qualunque grado, di qualunque disciplina/scala, in un indice sulla
// scala francese (ROUTE_SCALE) — è la "valuta comune" usata dai grafici per
// confrontare discipline diverse sullo stesso asse.
export function normalizedGradeValue(disc, grade) {
  if (!grade) return null;
  const raw = String(grade).trim();
  const normalizedRaw = raw.toLowerCase();
  const frenchGrade = ROUTE_SCALE.includes(normalizedRaw)
    ? normalizedRaw
    : displayGrade(disc === 'speed' ? 'boulder' : disc, raw, 'french').toLowerCase();
  const index = ROUTE_SCALE.indexOf(frenchGrade);
  return index < 0 ? null : index;
}

export function commonFrenchGradeFromNormalized(value) {
  const index = Math.max(0, Math.min(ROUTE_SCALE.length - 1, Math.round(value)));
  return ROUTE_SCALE[index];
}

export function chartGradeLabel(disc, grade) {
  if (disc === 'boulder') {
    const king = KING_ROCK.find(item => item.id === fontToKing(grade));
    if (king) return `${king.label} (${king.range})`;
  }
  return displayGrade(disc, grade, 'french');
}
