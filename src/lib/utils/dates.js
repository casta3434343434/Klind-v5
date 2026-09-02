export function localDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today() {
  return localDateKey(new Date());
}

export function fmt(d) {
  return localDateKey(d);
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7;
  const r = new Date(d);
  r.setDate(d.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function estimatedKcal(sessions, date, weight) {
  const minutes = sessions.filter(s => s.data === date).reduce((sum, s) => sum + (parseFloat(s.durata) || 0), 0);
  const kg = parseFloat(weight);
  if (!minutes || !kg) return '';
  return Math.round(8 * 3.5 * kg / 200 * minutes);
}
