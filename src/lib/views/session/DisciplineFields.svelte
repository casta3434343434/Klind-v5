<script>
  import {
    BOULDER_SCALE, KING_ROCK, BOULDER_SCALES, LEAD_SCALES, LEAD_STYLES, MOON_TIPI,
    LEAD_ASCENT_MODES, WALL_ANGLES, GRIP_TYPES, MOON_LAYOUTS
  } from '../../constants.js';
  import { getScale, kingToFont, displayGrade } from '../../utils/grades.js';

  let { session } = $props();

  const disc = $derived(session.disciplina);
  const isBoulder = $derived(disc === 'boulder');
  const isLead = $derived(disc === 'lead');
  const isMoon = $derived(disc === 'moonboard');
  const isSpeed = $derived(disc === 'speed');
  const isCircuiti = $derived(disc === 'circuiti');
  const isFalesia = $derived(disc === 'falesia');
  const wallDisc = $derived(isBoulder || isLead || isMoon || isCircuiti || isFalesia);

  const sessionScale = $derived(session.scala || 'font');
  const scaleOptions = $derived((isLead || isCircuiti || isFalesia) ? LEAD_SCALES : BOULDER_SCALES);
  const sc = $derived(getScale(disc));

  function moonGradeOptions() {
    return BOULDER_SCALE;
  }

  // Bozza del blocco/via in fase di inserimento — separata dalla sessione,
  // si azzera dopo ogni "Aggiungi".
  function blankDraft() {
    return {
      nome: '', grado: '', gradoSetter: '', gradoUser: '', tipo: '', modalita: 'primo',
      tentativi: '', rest: '', numPrese: '', ripetizioni: '', riposoCircuito: '',
      lunghezza: '', settore: '', stelle: 0, angolo: '', presa: '', notaBlocco: '',
      tempo: '', esito: 'Completata', percorso: 'Standard IFSC (15m)',
      fotoFiles: [], fotoExisting: []
    };
  }

  let draft = $state(blankDraft());
  let editingIndex = $state(null);

  function editClimb(i) {
    const c = session.blocchi[i];
    draft = {
      ...blankDraft(),
      ...c,
      fotoFiles: [],
      fotoExisting: c.foto || []
    };
    editingIndex = i;
  }

  function removeClimb(i) {
    session.blocchi.splice(i, 1);
    if (editingIndex === i) { editingIndex = null; draft = blankDraft(); }
  }

  function onPhotoChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 3);
    draft.fotoFiles = files;
  }

  async function filesToDataUrls(files) {
    return Promise.all(files.map(f => new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(f);
    })));
  }

  async function addOrSaveClimb() {
    const newFoto = draft.fotoFiles.length ? await filesToDataUrls(draft.fotoFiles) : [];
    const foto = newFoto.length ? newFoto : draft.fotoExisting;
    const effectiveGrade = draft.gradoUser || draft.grado;

    if (isSpeed) {
      if (!draft.nome && !draft.tempo) return;
      const climb = { nome: draft.nome, tempo: draft.tempo, esito: draft.esito, percorso: draft.percorso, notaBlocco: draft.notaBlocco };
      if (editingIndex === null) session.blocchi.push(climb); else session.blocchi[editingIndex] = climb;
    } else {
      if (!draft.nome && !effectiveGrade && !draft.gradoSetter && !foto.length) return;
      const climb = {
        nome: draft.nome, grado: effectiveGrade, gradoSetter: draft.gradoSetter, gradoUser: draft.gradoUser,
        tipo: draft.tipo, modalita: draft.modalita, tentativi: draft.tentativi, rest: draft.rest,
        numPrese: draft.numPrese, ripetizioni: draft.ripetizioni, riposoCircuito: draft.riposoCircuito,
        lunghezza: draft.lunghezza, settore: draft.settore, stelle: draft.stelle, angolo: draft.angolo,
        presa: draft.presa, nota: draft.notaBlocco, foto
      };
      if (editingIndex === null) session.blocchi.push(climb); else session.blocchi[editingIndex] = climb;
    }
    draft = blankDraft();
    editingIndex = null;
  }

  const dominantPresa = $derived.by(() => {
    const counts = {};
    (session.blocchi || []).forEach(p => { if (p.presa) counts[p.presa] = (counts[p.presa] || 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0][0] : '';
  });

  function climbSummary(p) {
    if (isSpeed) return [p.tempo ? p.tempo + 's' : '', p.esito, p.percorso].filter(Boolean).join(' · ');
    const parts = [];
    if (isMoon && p.gradoSetter) parts.push('Setter: ' + displayGrade(disc, p.gradoSetter, sessionScale));
    if (isMoon && p.gradoUser) parts.push('User: ' + displayGrade(disc, p.gradoUser, sessionScale));
    if (!isMoon && p.grado) parts.push(displayGrade(disc, p.grado, sessionScale));
    if (p.tipo) parts.push(p.tipo);
    if (p.modalita) parts.push(LEAD_ASCENT_MODES.find(m => m.id === p.modalita)?.label || p.modalita);
    if (p.tentativi) parts.push(p.tentativi + ' tent.');
    if (p.cadute) parts.push(p.cadute + ' cadute');
    if (p.rest) parts.push('rest ' + p.rest);
    if (p.numPrese) parts.push(p.numPrese + ' prese');
    if (p.ripetizioni) parts.push(p.ripetizioni + ' ripetizioni');
    if (p.riposoCircuito) parts.push('riposo ' + p.riposoCircuito);
    if (p.lunghezza) parts.push(p.lunghezza + 'm');
    if (p.settore) parts.push(p.settore);
    if (p.stelle) parts.push('★'.repeat(p.stelle));
    if (p.angolo) parts.push(p.angolo);
    if (p.presa) parts.push(p.presa);
    return parts.join(' · ');
  }
</script>

{#if session.blocchi?.length}
  {#if dominantPresa}<div class="sub" style="margin-bottom:8px;">Presa prevalente sessione: <b>{dominantPresa}</b></div>{/if}
  <div class="climb-list">
    {#each session.blocchi as p, i}
      <div class="climb-item">
        <div class="climb-item-main">
          <b>{p.nome || (isSpeed ? `Tentativo ${i + 1}` : '(senza nome)')}</b>
          <div class="climb-item-meta">{climbSummary(p)}</div>
          {#if p.nota}<div class="climb-item-meta">{p.nota}</div>{/if}
          {#if p.foto?.length}
            <div class="climb-photos">
              {#each p.foto.slice(0, 3) as src}<img class="climb-photo" src={src} alt="">{/each}
              {#if p.foto.length > 3}<span style="color:var(--muted);font-size:12px;">+{p.foto.length - 3}</span>{/if}
            </div>
          {/if}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => editClimb(i)}>Modifica</button>
          <button type="button" class="btn btn-danger btn-sm" onclick={() => removeClimb(i)}>Rimuovi</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if isSpeed}
  <div class="field"><label>Nome (facoltativo)</label><input type="text" bind:value={draft.nome} placeholder="es. Batteria 1"></div>
  <div class="field-row">
    <div class="field"><label>Tempo (secondi)</label><input type="number" step="0.01" bind:value={draft.tempo} placeholder="es. 8.45"></div>
    <div class="field"><label>Esito</label>
      <select bind:value={draft.esito}>
        <option value="Completata">Completata</option>
        <option value="Caduta">Caduta</option>
        <option value="Falsa partenza">Falsa partenza</option>
      </select>
    </div>
  </div>
  <div class="field"><label>Percorso</label>
    <select bind:value={draft.percorso}>
      <option value="Standard IFSC (15m)">Standard IFSC (15m)</option>
      <option value="Non standard">Non standard</option>
    </select>
  </div>
  <div class="field"><label>Nota</label><input type="text" bind:value={draft.notaBlocco}></div>
  <button type="button" class="btn btn-sm" onclick={addOrSaveClimb}>{editingIndex === null ? '+ Aggiungi' : 'Salva'} tentativo</button>
{:else}
  {#if wallDisc && !isMoon}
    <div class="field"><label>Scala gradi</label>
      <select bind:value={session.scala}>
        {#each scaleOptions as opt}<option value={opt.id}>{opt.label}</option>{/each}
      </select>
    </div>
  {/if}
  <div class="field"><label>Nome</label><input type="text" bind:value={draft.nome}></div>
  {#if wallDisc}
    <div class="field">
      <label>Foto (max 3)</label>
      <div class="file-upload-wrap">
        <label for="f_foto" class="file-upload-btn">Scegli file</label>
        <input type="file" id="f_foto" accept="image/*" multiple onchange={onPhotoChange}>
        <span class="file-upload-name">{draft.fotoFiles.length ? (draft.fotoFiles.length === 1 ? draft.fotoFiles[0].name : `${draft.fotoFiles.length} file selezionati`) : (draft.fotoExisting.length ? `${draft.fotoExisting.length} foto esistenti` : 'Nessun file scelto')}</span>
      </div>
    </div>
  {/if}
  <div class="field-row">
    {#if isMoon}
      <div class="field"><label>Grado Setter</label>
        <select bind:value={draft.gradoSetter}>
          <option value="">—</option>
          {#each moonGradeOptions() as g}<option value={g}>{displayGrade('moonboard', g, sessionScale)}</option>{/each}
        </select>
      </div>
      <div class="field"><label>Grado User</label>
        <select bind:value={draft.gradoUser}>
          <option value="">—</option>
          {#each moonGradeOptions() as g}<option value={g}>{displayGrade('moonboard', g, sessionScale)}</option>{/each}
        </select>
      </div>
    {:else}
      <div class="field"><label>Grado</label>
        <select bind:value={draft.grado}>
          <option value="">—</option>
          {#if isBoulder && sessionScale === 'king'}
            {#each KING_ROCK as k}<option value={kingToFont(k.id)}>{k.label} ({k.range})</option>{/each}
          {:else}
            {#each sc as g}<option value={g}>{displayGrade(disc, g, sessionScale)}</option>{/each}
          {/if}
        </select>
      </div>
    {/if}
  </div>
  {#if !isCircuiti}
    <div class="field"><label>Tipo</label>
      <select bind:value={draft.tipo}>
        <option value=""></option>
        {#each (isLead || isFalesia) ? LEAD_STYLES : (isMoon || isBoulder) ? MOON_TIPI : [] as t}<option value={t}>{t}</option>{/each}
      </select>
    </div>
  {/if}
  {#if isCircuiti}
    <div class="field-row">
      <div class="field"><label>Numero di prese</label><input type="number" bind:value={draft.numPrese}></div>
      <div class="field"><label>Ripetizioni</label><input type="number" bind:value={draft.ripetizioni}></div>
    </div>
    <div class="field"><label>Riposo tra ripetizioni</label><input type="text" placeholder="es. 2 min" bind:value={draft.riposoCircuito}></div>
  {:else}
    <div class="field-row">
      <div class="field"><label>Tentativi</label><input type="number" bind:value={draft.tentativi}></div>
      {#if !isBoulder && !isMoon}
        <div class="field"><label>Rest (recupero)</label><input type="text" placeholder="es. 5 min" bind:value={draft.rest}></div>
      {/if}
    </div>
  {/if}
  {#if isLead || isFalesia}
    <div class="field-row">
      <div class="field"><label>Modalità di salita</label>
        <select bind:value={draft.modalita}>
          {#each LEAD_ASCENT_MODES as mode}<option value={mode.id}>{mode.label}</option>{/each}
        </select>
      </div>
      <div class="field"><label>Cadute</label><input type="number" bind:value={session.cadute}></div>
    </div>
  {/if}
  {#if isFalesia}
    <div class="field"><label>Lunghezza via (m)</label><input type="number" bind:value={draft.lunghezza}></div>
    <div class="field"><label>Settore (facoltativo)</label><input type="text" placeholder="es. Edera" bind:value={draft.settore}></div>
    <div class="field"><label>Qualità via</label>
      <div class="star-picker">
        {#each [1, 2, 3, 4, 5] as n}<button type="button" class="star-btn {(draft.stelle || 0) >= n ? 'on' : ''}" onclick={() => draft.stelle = n}>★</button>{/each}
        {#if draft.stelle}<button type="button" class="star-clear" onclick={() => draft.stelle = 0}>✕</button>{/if}
      </div>
    </div>
  {/if}
  {#if wallDisc}
    <div class="field-row">
      <div class="field">
        <label>{isMoon ? 'Angolo moon' : 'Angolo parete'}</label>
        <select bind:value={draft.angolo}>
          {#if isMoon}
            <option value="">—</option><option>25°</option><option>40°</option>
          {:else}
            <option value=""></option>
            {#each WALL_ANGLES as a}<option>{a}</option>{/each}
          {/if}
        </select>
      </div>
      {#if !isFalesia}
        <div class="field"><label>Presa prevalente</label>
          <select bind:value={draft.presa}>
            <option value=""></option>
            {#each GRIP_TYPES as g}<option>{g}</option>{/each}
          </select>
        </div>
      {/if}
    </div>
  {/if}
  <div class="field"><label>Nota</label><input type="text" bind:value={draft.notaBlocco}></div>

  {#if isMoon}
    <div class="field-row">
      <div class="field"><label>Layout</label>
        <select bind:value={session.moonboard.layout}>
          {#each MOON_LAYOUTS as l}<option>{l}</option>{/each}
        </select>
      </div>
      <div style="display:flex; align-items:flex-end; padding-bottom:10px;">
        <label style="display:flex; align-items:center; gap:8px; font-size:14px; color:var(--muted); margin:0;">
          <input type="checkbox" bind:checked={session.moonboard.benchmark}> Benchmark
        </label>
      </div>
    </div>
  {/if}

  <button type="button" class="btn btn-sm" onclick={addOrSaveClimb}>{editingIndex === null ? '+ Aggiungi' : 'Salva'} {isBoulder ? 'blocco' : (isLead || isFalesia) ? 'via' : 'problema'}</button>
{/if}
