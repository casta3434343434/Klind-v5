export function chartTheme() {
  const styles = getComputedStyle(document.documentElement);
  const color = name => styles.getPropertyValue(name).trim();
  return {
    text: color('--chalk'), muted: color('--muted'), grid: color('--line'), accent: color('--lime'),
    rust: color('--rust'), boulder: color('--boulder'), vertical: color('--vertical'),
    moon: color('--moon'), speed: color('--speed'), circuiti: color('--circuiti'), falesia: color('--falesia'),
    surface: color('--surface')
  };
}

export function chartFill(color, opacity) {
  const value = (color || '').replace('#', '');
  if (value.length !== 6) return color || 'rgba(156,150,134,' + opacity + ')';
  const r = parseInt(value.slice(0, 2), 16), g = parseInt(value.slice(2, 4), 16), b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function discColor(d) {
  const key = { boulder: 'boulder', lead: 'vertical', moonboard: 'moon', speed: 'speed', circuiti: 'circuiti', falesia: 'falesia' }[d] || 'muted';
  return getComputedStyle(document.documentElement).getPropertyValue('--' + key).trim() || '#9c9686';
}

export function disciplineThemeKey(disc) {
  return disc === 'lead' ? 'vertical' : disc === 'moonboard' ? 'moon' : disc;
}
