import { DISCIPLINE_COLORS } from '../constants.js';
import { app } from '../stores/appState.svelte.js';

// Stessa "Klind Identity" palette dell'originale (vedi THEME_PALETTES nella
// versione vanilla). Il chiaro/scuro qui non è legato ai temi del sistema
// operativo (--lime-dim, --circuiti, --falesia restano fissi, come
// nell'originale): sono le stesse variabili CSS sovrascritte via JS.
const THEME_PALETTES = {
  identity: {
    light: { bg: '#f3eee4', alt: '#e7dfd2', surface: '#fffaf2', surface2: '#d8c8b7', chalk: '#263746', muted: '#5e6d76', line: 'rgba(38,55,70,.18)', strong: 'rgba(38,55,70,.34)', lime: '#a93625', rust: '#842820' },
    dark: { bg: '#628b98', alt: '#527985', surface: '#385764', surface2: '#496d79', chalk: '#f7f0e3', muted: '#e0e7e8', line: 'rgba(247,240,227,.24)', strong: 'rgba(247,240,227,.38)', lime: '#e06446', rust: '#f08c75' }
  }
};

export function resolveThemeMode(mode) {
  if (mode !== 'system') return mode;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function themeModeLabel(mode) {
  return mode === 'light' ? 'Chiaro' : mode === 'system' ? 'Sistema' : 'Scuro';
}

export function getThemeMode() {
  return app.themeMode;
}

// Cambia il tema: aggiorna localStorage, applica subito le CSS variable, e
// aggiorna anche app.themeMode (stato reattivo Svelte) — questo terzo passo è
// quello che permette ai grafici Chart.js già disegnati di accorgersi del
// cambio e ridisegnarsi con i colori giusti (vedi commento in appState).
export function setThemeMode(mode) {
  localStorage.setItem('klindThemeMode', mode);
  applyTheme(mode);
  app.themeMode = mode;
}

export function applyTheme(modeOverride) {
  const palette = THEME_PALETTES.identity;
  const mode = modeOverride || getThemeMode();
  const resolved = resolveThemeMode(mode);
  const colors = palette[resolved];
  const root = document.documentElement;
  const isDark = resolved === 'dark';
  Object.entries({
    bg: colors.bg, 'bg-alt': colors.alt, surface: colors.surface, 'surface-2': colors.surface2,
    chalk: colors.chalk, muted: colors.muted, line: colors.line, 'line-strong': colors.strong,
    lime: colors.lime, rust: colors.rust,
    boulder: DISCIPLINE_COLORS.boulder[isDark ? 0 : 1],
    vertical: DISCIPLINE_COLORS.lead[isDark ? 0 : 1],
    moon: DISCIPLINE_COLORS.moonboard[isDark ? 0 : 1],
    speed: DISCIPLINE_COLORS.speed[isDark ? 0 : 1]
  }).forEach(([name, value]) => root.style.setProperty('--' + name, value));
  root.style.colorScheme = resolved;
}

const DISC_VAR = { boulder: 'boulder', lead: 'vertical', moonboard: 'moon', speed: 'speed', circuiti: 'circuiti', falesia: 'falesia' };

// Colore CSS effettivo (post-tema) di una disciplina — usato per il calendario
// (celle con più discipline nello stesso giorno) e altri usi puntuali fuori
// da Chart.js. Stessa 1:1 di discColor() nell'originale.
export function discColor(disc) {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--' + (DISC_VAR[disc] || 'muted')).trim();
  return value || '#9c9686';
}
