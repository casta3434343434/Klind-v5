// Stima delle kcal bruciate nel giorno in base ai minuti totali di allenamento
// registrati quel giorno e al peso corporeo. Stessa formula MET=8 della versione
// vanilla (8 * 3.5 * kg / 200 * minuti).
export function estimatedKcal(sessions, date, weight) {
  const minutes = sessions
    .filter(s => s.data === date)
    .reduce((sum, s) => sum + (parseFloat(s.durata) || 0), 0);
  const kg = parseFloat(weight);
  if (!minutes || !kg) return '';
  return Math.round(8 * 3.5 * kg / 200 * minutes);
}
