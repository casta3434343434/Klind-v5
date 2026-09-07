<script>
  import {
    BOULDER_SCALE, KING_ROCK, BOULDER_SCALES, LEAD_SCALES, LEAD_STYLES, MOON_TIPI,
    LEAD_ASCENT_MODES, WALL_ANGLES, GRIP_TYPES, MOON_LAYOUTS
  } from '../../constants.js';
  import { getScale, displayGrade } from '../../utils/grades.js';

  let { session, discipline } = $props();

  const disc = $derived(discipline || session.disciplina);
  const climbs = $derived(session.blocchiByDiscipline?.[disc] || []);
  const isBoulder = $derived(disc === 'boulder');
  const isLead = $derived(disc === 'lead');
  const isMoon = $derived(disc === 'moonboard');
  const isSpeed = $derived(disc === 'speed');
  const isCircuiti = $derived(disc === 'circuiti');
  const wallDisc = $derived(isBoulder || isLead || isMoon || isCircuiti);

  // Scala gradi è per-disciplina (una sessione può avere più discipline
  // insieme: boulder e lead non devono condividere lo stesso valore,
  // altrimenti si sovrascrivono a vicenda). Le cadute invece sono per
  // singolo blocco/via, non a livello di sessione o disciplina.
  session.scalaByDiscipline ||= {};
  const sessionScale = $derived(session.scalaByDiscipline[disc] || 'font');
  const scaleOptions = $derived((isLead || isCircuiti) ? LEAD_SCALES : BOULDER_SCALES);
  const sc = $derived(getScale(disc));

  function moonGradeOptions() {
    return BOULDER_SCALE;
  }

  // Elenco dei gradi da mostrare come pulsanti "tap per aggiungere" — stessa
  // lista che prima popolava la tendina, solo mostrata come pulsanti diretti.
  const tapGrades = $derived.by(() => {
    if (isBoulder && sessionScale === 'king') return KING_ROCK.map(k => ({ value: k.id, label: `${k.label} (${k.range})` }));
    if (isMoon) return moonGradeOptions().map(g => ({ value: g, label: displayGrade('moonboard', g, sessionScale) }));
    return sc.map(g => ({ value: g, label: displayGrade(disc, g, sessionScale) }));
  });

  // Bozza usata SOLO per arricchire un blocco già aggiunto (nome, foto,
  // tentativi, presa...). Il grado si imposta toccando un pulsante — non c'è
  // più un form da compilare prima di poter salvare un blocco.
  function blankDraft() {
    return {
      nome: '', grado: '', gradoSetter: '', gradoUser: '', tipo: '', modalita: 'primo',
      tentativi: '', rest: '', cadute: '', numPrese: '', ripetizioni: '', riposoCircuito: '', showRipetute: false,
      lunghezza: '', settore: '', stelle: 0, angolo: '', presa: '', notaBlocco: '',
      tempo: '', esito: 'Completata', percorso: 'Standard IFSC (15m)',
      fotoFiles: [], fotoExisting: []
    };
  }

  let draft = $state(blankDraft());
  let editingIndex = $state(null);
  // Per Circuiti, il numero di prese si imposta una volta prima di toccare il
  // grado (informazione principale, non più nascosta dentro "Dettagli") e si
  // applica al blocco che si aggiunge toccando il grado.
  let quickNumPrese = $state('');

  $effect(() => {
    void disc;
    draft = blankDraft();
    editingIndex = null;
    quickNumPrese = '';
  });

  // Tocca un grado → aggiunge subito un blocco, senza aprire nessun form.
  function quickAdd(grade) {
    const climb = { nome: '', grado: grade, tipo: '', modalita: 'primo', tentativi: '', rest: '', numPrese: isCircuiti ? quickNumPrese : '', ripetizioni: '', riposoCircuito: '', angolo: '', presa: '', notaBlocco: '', foto: [] };
    climbs.push(climb);
  }

  // Moonboard ha due righe di tap separate: il grado Setter (ufficiale, sulla
  // parete/app Moonboard) e il grado User (la tua valutazione personale — è
  // quello che conta davvero in Storico/Progressi/Social, vedi sessionGrade
  // in utils/grades.js). Toccare Setter aggiunge un problema nuovo (con lo
  // User impostato uguale, di partenza). Toccare User corregge lo User del
  // problema appena aggiunto, senza crearne uno nuovo — così il flusso resta
  // "tocca il grado ufficiale, poi eventualmente correggi il tuo".
  function quickAddSetter(grade) {
    climbs.push({ nome: '', grado: grade, gradoSetter: grade, gradoUser: grade, tipo: '', tentativi: '', numPrese: '', angolo: '', presa: '', notaBlocco: '', foto: [] });
  }

  function quickAddUser(grade) {
    if (climbs.length) {
      const last = climbs[climbs.length - 1];
      last.gradoUser = grade;
      last.grado = grade;
    } else {
      climbs.push({ nome: '', grado: grade, gradoSetter: grade, gradoUser: grade, tipo: '', tentativi: '', numPrese: '', angolo: '', presa: '', notaBlocco: '', foto: [] });
    }
  }

  function editClimb(i) {
    const c = climbs[i];
    draft = {
      ...blankDraft(),
      ...c,
      showRipetute: !!(c.ripetizioni || c.riposoCircuito),
      fotoFiles: [],
      fotoExisting: c.foto || []
    };
    editingIndex = i;
  }

  function removeClimb(i) {
    climbs.splice(i, 1);
    if (editingIndex === i) { editingIndex = null; draft = blankDraft(); }
  }

  function cancelEdit() {
    editingIndex = null;
    draft = blankDraft();
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
    const effectiveGrade = draft.gradoUser || draft.gradoSetter || draft.grado;

    if (isSpeed) {
      if (!draft.nome && !draft.tempo) return;
      const climb = { nome: draft.nome, tempo: draft.tempo, esito: draft.esito, percorso: draft.percorso, notaBlocco: draft.notaBlocco };
      if (editingIndex === null) climbs.push(climb); else climbs[editingIndex] = climb;
    } else {
      const climb = {
        nome: draft.nome, grado: effectiveGrade, gradoSetter: draft.gradoSetter, gradoUser: draft.gradoUser,
        tipo: draft.tipo, modalita: draft.modalita, tentativi: draft.tentativi, rest: draft.rest, cadute: draft.cadute,
        numPrese: draft.numPrese, ripetizioni: draft.ripetizioni, riposoCircuito: draft.riposoCircuito,
        lunghezza: draft.lunghezza, settore: draft.settore, stelle: draft.stelle, angolo: draft.angolo,
        presa: draft.presa, nota: draft.notaBlocco, foto
      };
      if (editingIndex === null) climbs.push(climb); else climbs[editingIndex] = climb;
    }
    draft = blankDraft();
    editingIndex = null;
  }

  const dominantPresa = $derived.by(() => {
    const counts = {};
    climbs.forEach(p => { if (p.presa) counts[p.presa] = (counts[p.presa] || 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0][0] : '';
  });

  function climbSummary(p) {
    if (isSpeed) return [p.tempo ? p.tempo + 's' : '', p.esito, p.percorso].filter(Boolean).join(' · ');
    const parts = [];
    if (isMoon && p.gradoUser) {
      const setterDiffers = p.gradoSetter && p.gradoSetter !== p.gradoUser;
      parts.push(displayGrade(disc, p.gradoUser, sessionScale) + (setterDiffers ? ' (setter: ' + displayGrade(disc, p.gradoSetter, sessionScale) + ')' : ''));
    } else if (isMoon && p.gradoSetter) {
      parts.push(displayGrade(disc, p.gradoSetter, sessionScale));
    }
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

{#if isSpeed}
  {#if climbs.length}
    <div class="climb-list">
      {#each climbs as p, i}
        <div class="climb-item">
          <div class="climb-item-main">
            <b>{p.nome || `Tentativo ${i + 1}`}</b>
            <div class="climb-item-meta">{climbSummary(p)}</div>
            {#if p.nota}<div class="climb-item-meta">{p.nota}</div>{/if}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => editClimb(i)}>Modifica</button>
            <button type="button" class="btn btn-danger btn-sm" onclick={() => removeClimb(i)}>Rimuovi</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
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
  <div style="display:flex;gap:8px;">
    <button type="button" class="btn btn-sm" onclick={addOrSaveClimb}>{editingIndex === null ? '+ Aggiungi' : 'Salva'} tentativo</button>
    {#if editingIndex !== null}<button type="button" class="btn btn-ghost btn-sm" onclick={cancelEdit}>Annulla</button>{/if}
  </div>
{:else}
  {#if !isMoon}
    <div class="field-row">
      <div class="field"><label>Scala gradi</label>
        <select bind:value={session.scalaByDiscipline[disc]}>
          {#each scaleOptions as opt}<option value={opt.id}>{opt.label}</option>{/each}
        </select>
      </div>
      {#if isCircuiti}
        <div class="field"><label>Numero di prese</label><input type="number" bind:value={quickNumPrese}></div>
      {/if}
    </div>
  {/if}

  {#if isMoon}
    <div class="grade-tap-label">Grado Setter <span class="sub">(ufficiale)</span></div>
    <div class="grade-tap-row">
      {#each tapGrades as g}
        <button type="button" class="grade-tap-btn" onclick={() => quickAddSetter(g.value)}>{g.label}</button>
      {/each}
    </div>
    <div class="grade-tap-label grade-tap-label-user">Il tuo grado <span class="sub">(conta per Storico e Progressi)</span></div>
    <div class="grade-tap-row">
      {#each tapGrades as g}
        <button type="button" class="grade-tap-btn grade-tap-btn-user" onclick={() => quickAddUser(g.value)}>{g.label}</button>
      {/each}
    </div>
    <p class="grade-tap-hint">Tocca prima il grado ufficiale del setter — aggiunge subito il problema. Se per te è diverso, tocca anche il tuo grado personale: correggerà l'ultimo problema aggiunto.</p>
  {:else}
    <div class="grade-tap-row">
      {#each tapGrades as g}
        <button type="button" class="grade-tap-btn" onclick={() => quickAdd(g.value)}>{g.label}</button>
      {/each}
    </div>
    <p class="grade-tap-hint">Tocca un grado per aggiungere {isBoulder ? 'un blocco' : isLead ? 'una via' : 'un problema'}. Dopo puoi aprirlo per aggiungere foto, tentativi o altri dettagli, se vuoi.</p>
  {/if}

  {#if climbs.length}
    {#if dominantPresa}<div class="sub" style="margin-bottom:8px;">Presa prevalente sessione: <b>{dominantPresa}</b></div>{/if}
    <div class="climb-list">
      {#each climbs as p, i}
        <div class="climb-item">
          <div class="climb-item-main">
            <b>{p.nome || '(senza nome)'}</b>
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
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => editingIndex === i ? cancelEdit() : editClimb(i)}>{editingIndex === i ? 'Chiudi' : 'Dettagli'}</button>
            <button type="button" class="btn btn-danger btn-sm" onclick={() => removeClimb(i)}>Rimuovi</button>
          </div>
        </div>
        {#if editingIndex === i}
          <div class="climb-detail-editor">
            {#if !isCircuiti}
              <div class="field"><label>Nome</label><input type="text" bind:value={draft.nome}></div>
              <div class="field">
                <label>Foto (max 3)</label>
                <div class="file-upload-wrap">
                  <label for="f_foto_{i}" class="file-upload-btn">Scegli file</label>
                  <input type="file" id="f_foto_{i}" accept="image/*" multiple onchange={onPhotoChange}>
                  <span class="file-upload-name">{draft.fotoFiles.length ? (draft.fotoFiles.length === 1 ? draft.fotoFiles[0].name : `${draft.fotoFiles.length} file selezionati`) : (draft.fotoExisting.length ? `${draft.fotoExisting.length} foto esistenti` : 'Nessun file scelto')}</span>
                </div>
              </div>
              <div class="field-row">
                {#if isMoon}
                  <div class="field"><label>Grado Setter</label>
                    <select bind:value={draft.gradoSetter}>
                      <option value="">—</option>
                      {#each moonGradeOptions() as g}<option value={g}>{displayGrade('moonboard', g, sessionScale)}</option>{/each}
                    </select>
                  </div>
                  <div class="field"><label>Grado User (se diverso)</label>
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
                        {#each KING_ROCK as k}<option value={k.id}>{k.label} ({k.range})</option>{/each}
                      {:else}
                        {#each sc as g}<option value={g}>{displayGrade(disc, g, sessionScale)}</option>{/each}
                      {/if}
                    </select>
                  </div>
                {/if}
              </div>
              <div class="field"><label>Tipo</label>
                <select bind:value={draft.tipo}>
                  <option value=""></option>
                  {#each isLead ? LEAD_STYLES : (isMoon || isBoulder) ? MOON_TIPI : [] as t}<option value={t}>{t}</option>{/each}
                </select>
              </div>
            {/if}
            {#if isCircuiti}
              {#if draft.showRipetute}
                <div class="field-row">
                  <div class="field"><label>Ripetizioni</label><input type="number" bind:value={draft.ripetizioni}></div>
                  <div class="field"><label>Recupero</label><input type="text" placeholder="es. 2 min" bind:value={draft.riposoCircuito}></div>
                </div>
              {:else}
                <button type="button" class="btn btn-ghost btn-sm" style="margin-bottom:16px;" onclick={() => draft.showRipetute = true}>+ Ripetute</button>
              {/if}
            {:else}
              <div class="field-row">
                <div class="field"><label>Tentativi</label><input type="number" bind:value={draft.tentativi}></div>
                {#if isLead}
                  <div class="field"><label>Rest (recupero)</label><input type="text" placeholder="es. 5 min" bind:value={draft.rest}></div>
                {/if}
              </div>
              {#if isLead}
                <div class="field"><label>Cadute</label><input type="number" bind:value={draft.cadute}></div>
              {/if}
            {/if}
            {#if isLead}
              <div class="field"><label>Modalità di salita</label>
                <select bind:value={draft.modalita}>
                  {#each LEAD_ASCENT_MODES as mode}<option value={mode.id}>{mode.label}</option>{/each}
                </select>
              </div>
            {/if}
            {#if !isCircuiti}
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
                <div class="field"><label>Presa prevalente</label>
                    <select bind:value={draft.presa}>
                      <option value=""></option>
                      {#each GRIP_TYPES as g}<option>{g}</option>{/each}
                    </select>
                </div>
              </div>
              <div class="field"><label>Nota</label><input type="text" bind:value={draft.notaBlocco}></div>
            {/if}
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
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-sm btn-primary" onclick={addOrSaveClimb}>Salva dettagli</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick={cancelEdit}>Chiudi senza salvare</button>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
{/if}
