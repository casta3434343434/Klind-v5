import { DISCIPLINE_COLORS } from '../constants.js';

const THEME_PALETTES = {
  identity: {
    label: 'Klind Identity',
    light: { bg: '#f3eee4', alt: '#e7dfd2', surface: '#fffaf2', surface2: '#d8c8b7', chalk: '#263746', muted: '#5e6d76', line: 'rgba(38,55,70,.18)', strong: 'rgba(38,55,70,.34)', lime: '#a93625', rust: '#842820' },
    dark: { bg: '#628b98', alt: '#527985', surface: '#385764', surface2: '#496d79', chalk: '#f7f0e3', muted: '#e0e7e8', line: 'rgba(247,240,227,.24)', strong: 'rgba(247,240,227,.38)', lime: '#e06446', rust: '#f08c75' }
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
