import { localDateKey } from './dates.js';

export function buildHeatmap(sessions, weeksCount = 53) {
  const counts = {};
  sessions.forEach(s => { counts[s.data] = (counts[s.data] || 0) + 1; });
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - weeksCount * 7);
  const startDow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startDow);
  const cells = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = localDateKey(cur);
    const n = counts[key] || 0;
    const level = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
    cells.push({ date: key, level, count: n });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}
