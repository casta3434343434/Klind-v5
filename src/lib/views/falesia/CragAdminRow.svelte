<script>
  import { app } from '../../stores/appState.svelte.js';
  import { updateCragDetails, deleteCrag } from '../../api/crags.js';

  let { crag } = $props();

  const expanded = $derived(app.cragsAdminExpandedId === crag.id);

  let zona = $state('');
  let altitudine = $state('');
  let parcheggio = $state('');
  let avvicinamento = $state('');
  let esposizione = $state('');
  let tipoRoccia = $state('');
  let lat = $state('');
  let lng = $state('');
  let verificata = $state(false);

  $effect(() => {
    zona = crag.zona || '';
    altitudine = crag.altitudine || '';
    parcheggio = crag.parcheggio || '';
    avvicinamento = crag.avvicinamento || '';
    esposizione = crag.esposizione || '';
    tipoRoccia = crag.tipo_roccia || '';
    lat = crag.lat || '';
    lng = crag.lng || '';
    verificata = !!crag.verificata;
  });

  function toggle() {
    app.cragsAdminExpandedId = expanded ? null : crag.id;
  }

  function useMyLocation() {
    if (!navigator.geolocation) { alert('Geolocalizzazione non disponibile su questo dispositivo.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { lat = pos.coords.latitude.toFixed(6); lng = pos.coords.longitude.toFixed(6); },
      () => alert('Impossibile ottenere la posizione.')
    );
  }

  async function save() {
    await updateCragDetails(crag.id, {
      zona, altitudine: altitudine || null, parcheggio, avvicinamento, esposizione,
      tipo_roccia: tipoRoccia, lat: lat || null, lng: lng || null, verificata
    });
  }
</script>

<div class="crag-admin-row">
  <div class="session-mini" style="cursor:pointer;" role="button" tabindex="0" onclick={toggle} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}>
    <div>{crag.nome}{#if crag.zona} <span class="sub">· {crag.zona}</span>{/if}</div>
    <span class="chip {crag.verificata ? 'chip-boulder' : 'chip-speed'}">{crag.verificata ? 'Verificata' : 'Da completare'}</span>
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
      <button type="button" class="btn btn-ghost btn-sm" onclick={useMyLocation}>📍 Usa la mia posizione</button>
      <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;"><input type="checkbox" bind:checked={verificata}> Segna come verificata</label>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn btn-primary btn-sm" onclick={save}>Salva</button>
        <button type="button" class="btn btn-danger btn-sm" onclick={() => deleteCrag(crag.id)}>Elimina falesia</button>
      </div>
    </div>
  {/if}
</div>
