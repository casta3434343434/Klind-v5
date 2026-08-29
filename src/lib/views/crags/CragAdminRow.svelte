<script>
  import { updateCragDetails, deleteCrag } from '../../api/crags.js';

  let { c } = $props();

  let expanded = $state(false);
  let busy = $state(false);
  let locating = $state(false);

  let zona = $state('');
  let altitudine = $state('');
  let parcheggio = $state('');
  let avvicinamento = $state('');
  let esposizione = $state('');
  let tipoRoccia = $state('');
  let lat = $state('');
  let lng = $state('');
  let verificata = $state(false);

  function toggle() {
    expanded = !expanded;
    if (expanded) {
      zona = c.zona || '';
      altitudine = c.altitudine ?? '';
      parcheggio = c.parcheggio || '';
      avvicinamento = c.avvicinamento || '';
      esposizione = c.esposizione || '';
      tipoRoccia = c.tipo_roccia || '';
      lat = c.lat ?? '';
      lng = c.lng ?? '';
      verificata = !!c.verificata;
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { alert('Il tuo browser non supporta la geolocalizzazione.'); return; }
    locating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lat = pos.coords.latitude.toFixed(5);
        lng = pos.coords.longitude.toFixed(5);
        locating = false;
      },
      () => { alert('Non sono riuscito a rilevare la posizione.'); locating = false; }
    );
  }

  async function save() {
    const altNum = Number(altitudine);
    const latNum = Number(lat);
    const lngNum = Number(lng);
    busy = true;
    try {
      await updateCragDetails(c.id, {
        zona: zona.trim() || null,
        parcheggio: parcheggio.trim() || null,
        avvicinamento: avvicinamento.trim() || null,
        esposizione: esposizione.trim() || null,
        tipo_roccia: tipoRoccia.trim() || null,
        altitudine: Number.isFinite(altNum) && altitudine !== '' ? altNum : null,
        lat: Number.isFinite(latNum) && lat !== '' ? latNum : null,
        lng: Number.isFinite(lngNum) && lng !== '' ? lngNum : null,
        verificata: !!verificata
      });
    } finally {
      busy = false;
    }
  }

  async function remove() {
    busy = true;
    try {
      const ok = await deleteCrag(c.id);
      if (ok) expanded = false;
    } finally {
      busy = false;
    }
  }
</script>

<div class="crag-admin-row">
  <div class="session-mini" style="cursor:pointer;" onclick={toggle} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && toggle()}>
    <div>{c.nome}{#if c.zona} <span class="sub">· {c.zona}</span>{/if}</div>
    <span class="chip {c.verificata ? 'chip-boulder' : 'chip-speed'}">{c.verificata ? 'Verificata' : 'Da completare'}</span>
  </div>
  {#if expanded}
    <div class="crag-admin-edit">
      <div class="field-row">
        <div class="field"><label>Zona</label><input type="text" bind:value={zona}></div>
        <div class="field"><label>Altitudine (m)</label><input type="number" bind:value={altitudine}></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Parcheggio</label><input type="text" bind:value={parcheggio}></div>
        <div class="field"><label>Tempo di avvicinamento</label><input type="text" placeholder="es. 15 min a piedi" bind:value={avvicinamento}></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Esposizione</label><input type="text" placeholder="es. Sud, sole tutto il giorno" bind:value={esposizione}></div>
        <div class="field"><label>Tipo roccia</label><input type="text" placeholder="es. Calcare" bind:value={tipoRoccia}></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Latitudine</label><input type="text" bind:value={lat}></div>
        <div class="field"><label>Longitudine</label><input type="text" bind:value={lng}></div>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" disabled={locating} onclick={useMyLocation}>{locating ? 'Localizzazione...' : '📍 Usa la mia posizione'}</button>
      <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;">
        <input type="checkbox" bind:checked={verificata}> Segna come verificata
      </label>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn btn-primary btn-sm" disabled={busy} onclick={save}>Salva</button>
        <button type="button" class="btn btn-danger btn-sm" disabled={busy} onclick={remove}>Elimina falesia</button>
      </div>
    </div>
  {/if}
</div>
