<script>
  import { app } from '../stores/appState.svelte.js';
  import { klindLogo } from '../constants.js';

  function goLogin() { app.authMode = 'login'; app.authError = ''; app.view = 'auth'; }
  function goSignup() { app.authMode = 'signup'; app.authError = ''; app.view = 'auth'; }

  // Griglia decorativa dell'hero, portata 1:1 da drawHero() dell'originale:
  // una finta "via" di boulder tracciata su una griglia 9x9 di appigli.
  const cols = 9, rows = 9, pad = 30;
  const size = (360 - pad * 2) / (cols - 1);
  const path = [4, 13, 23, 31, 40, 49, 57, 66];
  const dots = Array.from({ length: rows * cols }, (_, idx) => {
    const c = idx % cols, r = Math.floor(idx / cols);
    const on = path.includes(idx);
    return { cx: pad + c * size, cy: pad + r * size, r: on ? 5 : 3, fill: on ? '#b6422d' : 'rgba(242,238,226,0.12)' };
  });
  const lines = path.slice(0, -1).map((a, i) => {
    const b = path[i + 1];
    return {
      x1: pad + (a % cols) * size, y1: pad + Math.floor(a / cols) * size,
      x2: pad + (b % cols) * size, y2: pad + Math.floor(b / cols) * size
    };
  });
</script>

<nav class="nav">
  <div class="brand">{@html klindLogo} KLIND</div>
  <div>
    <button class="btn btn-ghost" onclick={goLogin}>Accedi</button>
    <button class="btn btn-primary" onclick={goSignup}>Crea account</button>
  </div>
</nav>

<section class="hero">
  <div>
    <h1>Klind — Dal primo appiglio<br>al prossimo grado.</h1>
    <p>Registra ogni sessione, condividi con gli amici e monitora tutto: allenamento, sonno, alimentazione, tutto in una app.</p>
    <div class="hero-ctas">
      <button class="btn btn-primary" onclick={goSignup}>Inizia →</button>
      <button class="btn btn-ghost" onclick={goLogin}>Accedi</button>
    </div>
  </div>
  <div class="hero-grid">
    <svg viewBox="0 0 360 360">
      {#each dots as d}<circle cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />{/each}
      {#each lines as l}<line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#b8690a" stroke-width="1.5" stroke-dasharray="3 4" opacity="0.5" />{/each}
    </svg>
  </div>
</section>

<div class="stripe">
  <div><div class="num">6</div><div class="lbl">discipline tracciate</div></div>
  <div><div class="num">25°/40°</div><div class="lbl">angoli moonboard</div></div>
  <div><div class="num">∞</div><div class="lbl">sessioni salvate</div></div>
  <div><div class="num">Grafici</div><div class="lbl">grafici automatici</div></div>
</div>

<section class="section">
  <h2>Pensato per chi si allena sul serio</h2>
  <p class="sub">Non solo "sono andato in palestra". Ogni dettaglio è un punto in più sul grafico.</p>
  <div class="feature-grid">
    <div class="feature"><div class="tag">01</div><h3>Calendario</h3><p>Vedi le sessioni giorno per giorno.</p></div>
    <div class="feature"><div class="tag">02</div><h3>Dettaglio</h3><p>Campi specifici per ogni disciplina.</p></div>
    <div class="feature"><div class="tag">03</div><h3>Contesto</h3><p>Sonno, alimentazione, forma.</p></div>
    <div class="feature"><div class="tag">04</div><h3>Grafici</h3><p>Progressi nel tempo.</p></div>
    <div class="feature"><div class="tag">05</div><h3>Test</h3><p>Forza misurata, non stimata.</p></div>
    <div class="feature"><div class="tag">06</div><h3>Falesia</h3><p>Vie outdoor, settori e database condiviso.</p></div>
    <div class="feature"><div class="tag">🩺</div><h3>Prevenzione</h3><p>Traccia dolori e infortuni.</p></div>
  </div>
</section>

<div class="footer-cta">
  <h2>La tua prossima sessione merita di essere segnata bene.</h2>
  <button class="btn btn-primary" onclick={goSignup}>Crea il tuo account →</button>
</div>

<div class="foot"><span>KLIND — Log di arrampicata</span><span>v2 · Svelte</span></div>
