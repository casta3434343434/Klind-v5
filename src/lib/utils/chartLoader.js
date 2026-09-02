// Chart.js pesa da solo la maggior parte del bundle principale (vedi PLAN.md,
// nota tecnica in Fase 7/11). Le viste che disegnano grafici (Progress,
// Test, Social) lo importano dinamicamente tramite questa funzione
// invece che con un `import` statico in cima al file: Vite lo isola così in
// un chunk separato, scaricato dal browser solo quando l'utente apre una di
// quelle viste, non nel bundle iniziale dell'app.
//
// La promise viene cachata: il modulo viene scaricato una sola volta, anche
// se più componenti (es. i grafici della pagina Social) lo richiedono nello
// stesso caricamento della pagina.
let chartModulePromise;

export function loadChart() {
  if (!chartModulePromise) {
    chartModulePromise = import('chart.js/auto').then((mod) => mod.default);
  }
  return chartModulePromise;
}
