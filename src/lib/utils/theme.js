import { DISCIPLINE_COLORS } from '../constants.js';

const THEME_PALETTES = {
  identity: {
    label: 'Klind Identity',
    light: { bg: '#f3eee4', alt: '#e7dfd2', surface: '#fffaf2', surface2: '#d8c8b7', chalk: '#263746', muted: '#5e6d76', line: 'rgba(38,55,70,.18)', strong: 'rgba(38,55,70,.34)', lime: '#a93625', rust: '#842820' },
    // Vero opposto della chiara: stessa identità calda (crema/ruggine), toni
    // ribaltati invece del blu-teal scollegato di prima. Il testo scuro
    // riusa letteralmente lo stesso crema dello sfondo chiaro (#f3eee4).
    // "rust" è la stessa tinta di "lime" in scuro: bottoni al passaggio del
    // mouse, badge e notifiche devono avere lo stesso arancio del logo e
    // delle scritte attive, non una tonalità leggermente diversa.
    dark: { bg: '#1c1713', alt: '#221c17', surface: '#2a231d', surface2: '#3d332a', chalk: '#f3eee4', muted: '#b3a495', line: 'rgba(243,238,228,.14)', strong: 'rgba(243,238,228,.26)', lime: '#e2624a', rust: '#e2624a' }
  }
};

export function resolveThemeMode(mode) {
  if (mode !== 'system') return mode;
  return (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
}

export function themeModeLabel(mode) {
  return mode === 'light' ? 'Chiaro' : mode === 'system' ? 'Sistema' : 'Scuro';
}

export function getThemeMode() {
  return (typeof localStorage !== 'undefined' && localStorage.getItem('klindThemeMode')) || 'dark';
}

export function applyTheme() {
  if (typeof document === 'undefined') return;
  const palette = THEME_PALETTES.identity;
  const mode = getThemeMode();
  const resolved = resolveThemeMode(mode);
  const colors = palette[resolved];
  const root = document.documentElement;
  const dark = resolved === 'dark';
  const vars = {
    bg: colors.bg, 'bg-alt': colors.alt, surface: colors.surface, 'surface-2': colors.surface2,
    chalk: colors.chalk, muted: colors.muted, line: colors.line, 'line-strong': colors.strong,
    lime: colors.lime, 'lime-dim': colors.lime, rust: colors.rust,
    boulder: DISCIPLINE_COLORS.boulder[dark ? 0 : 1],
    vertical: DISCIPLINE_COLORS.lead[dark ? 0 : 1],
    moon: DISCIPLINE_COLORS.moonboard[dark ? 0 : 1],
    speed: DISCIPLINE_COLORS.speed[dark ? 0 : 1]
  };
  Object.entries(vars).forEach(([name, value]) => root.style.setProperty('--' + name, value));
  root.style.colorScheme = resolved;
}

export function setThemeMode(mode) {
  if (typeof localStorage !== 'undefined') localStorage.setItem('klindThemeMode', mode);
  applyTheme();
}
