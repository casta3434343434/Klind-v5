<script>
  import { BODY_PARTS, INJURY_LEVELS } from '../../constants.js';

  let { session } = $props();
  let open = $state(session.showSensazioni || false);

  if (!session.infortunio) session.infortunio = { zona: '', gravita: '', dettagli: '' };
</script>

<fieldset>
  <div class="details-toggle">
    <button type="button" class="btn btn-expand" onclick={() => open = !open}>{open ? 'Nascondi' : 'Mostra'} sensazioni e infortuni</button>
  </div>
  <div style={open ? '' : 'display:none;'}>
    <div class="field-row">
      <div class="field"><label>RPE (1-10)</label><input type="number" min="1" max="10" bind:value={session.rpe}></div>
      <div class="field"><label>RPE avambracci</label><input type="number" min="1" max="10" bind:value={session.rpeLocale}></div>
    </div>
    <div class="field"><label>Stato mentale (1-5)</label><input type="number" min="1" max="5" bind:value={session.statoMentale}></div>
    <div class="field-row">
      <div class="field"><label>Infortunio zona</label>
        <select bind:value={session.infortunio.zona}>
          {#each BODY_PARTS as z}<option value={z}>{z || '—'}</option>{/each}
        </select>
      </div>
      <div class="field"><label>Gravità</label>
        <select bind:value={session.infortunio.gravita}>
          {#each INJURY_LEVELS as g}<option value={g}>{g || '—'}</option>{/each}
        </select>
      </div>
    </div>
    <div class="field"><label>Dettagli infortunio</label><input type="text" bind:value={session.infortunio.dettagli}></div>
  </div>
</fieldset>
