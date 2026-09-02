# Klind → Svelte — piano di migrazione

Aggiornato: 02/09/2026. Questo file è la fonte di verità sullo stato del porting:
se riprendiamo la sessione in un secondo momento, leggi da qui per capire dove
ci siamo fermati, cosa manca e le decisioni già prese.

## Decisioni prese

- **Framework**: Vite + Svelte 5 (runes: `$state`, `$derived`, `$effect`).
  Nessun altro state manager esterno — lo stato globale è un oggetto reattivo
  in `src/lib/stores/appState.svelte.js`, concettualmente equivalente al
  vecchio oggetto `state` mutabile della versione vanilla, ma senza bisogno
  di richiamare `render()` a mano.
- **Backend**: stesso progetto Supabase della versione vanilla (stessa URL,
  stessa chiave pubblica). Nessuna migrazione dati: le due versioni possono
  convivere e leggere/scrivere sullo stesso database durante il test.
- **Design**: CSS portato 1:1 (`src/styles/global.css`, variabili e stili
  originali) come base, poi migliorato dove ha senso mano a mano che si
  costruiscono i componenti (richiesta esplicita dell'utente).
- **Organizzazione codice**:
  - `src/lib/constants.js` — costanti di dominio (scale gradi, discipline, i18n)
  - `src/lib/utils/` — funzioni pure (date, conversione gradi)
  - `src/lib/api/` — un file per area, tutte le chiamate Supabase
  - `src/lib/stores/` — stato globale reattivo
  - `src/lib/views/` — un componente per schermata/sezione dell'app

## Stato di avanzamento

- [x] **Fase 1 — Scaffold**: progetto Vite+Svelte inizializzato, dipendenze
      installate (`@supabase/supabase-js`, `chart.js`), CSS globale portato,
      struttura cartelle. Build verificata (`npx vite build` ✓, solo warning
      di accessibilità non bloccanti).
- [x] **Fase 2 — Autenticazione**: login, signup (con username via metadata
      Supabase, coerente con la versione vanilla), restore sessione, logout,
      "ricordami". File: `src/lib/api/auth.js`, `src/lib/api/profile.js`,
      `src/lib/views/Auth.svelte`, `src/lib/views/Landing.svelte`.
- [x] **Fase 3 — App shell**: sidebar/nav mobile, badge verificato/developer,
      logout. Le voci di menu non ancora implementate mostrano un placeholder
      invece di rompersi. File: `src/lib/views/AppShell.svelte`.
- [x] **Fase 4 — Dashboard**: statistiche reali (sessioni nel periodo, ore
      totali, ultima sessione + mood, streak con record, best grade per
      disciplina, ultime sessioni). Manca ancora: selettore periodo "custom"
      (per ora solo Di sempre/Settimana) e il dettaglio ricco di `sessionMini`
      (per ora versione semplificata). File: `src/lib/views/Dashboard.svelte`,
      `src/lib/utils/grades.js` (conversione gradi, portata per intero).
- [x] **Fase 5 — Registrazione sessione**: form completo multi-disciplina
      (boulder/lead/moonboard/speed/circuiti/falesia), con tutti i campi
      specifici per disciplina, lista blocchi/vie con aggiungi/modifica/rimuovi,
      upload foto (max 3, come nell'originale), pannello sensazioni/infortuni,
      selezione luogo con autocomplete dal database condiviso + salvataggio
      nuovo luogo (nome+indirizzo, in attesa di verifica — stesso flusso appena
      introdotto nella versione vanilla), eliminazione sessione con conferma.
      Nuovo/modifica sessione ora funzionano dalla Dashboard.
      File: `src/lib/stores/sessionModal.svelte.js`, `src/lib/api/crags.js`,
      `src/lib/views/session/` (SessionModal, CragPicker, DisciplineFields,
      SensazioniPanel, DeleteConfirm). `src/lib/api/sessions.js` esteso con
      `upsertSession`/`deleteSessionRemote`.
      **Non ancora portato dall'originale**: home-period "custom" nel form
      (qui c'è solo Di sempre/Settimana). Il selettore data è presente
      (campo semplice `<input type="date">`), ma manca ancora il flusso
      "+ Aggiungi" dal pannello giorno del Calendario (arriva con la Fase 6)
      e il pulsante "+ Nuova sessione falesia" dedicato nella pagina Falesia.
- [x] **Fase 6 — Storico + Calendario**: tabella storico con tutte le
      sessioni (click "Modifica" apre il modale di modifica), calendario
      mensile con navigazione, pannello giorno che elenca le sessioni di
      quel giorno e permette di aggiungerne una nuova già con quella data
      precompilata. File: `src/lib/views/History.svelte`,
      `src/lib/views/Calendar.svelte`.
      **Non ancora portato**: il gradiente diagonale a due colori per i
      giorni con sessioni di più discipline diverse (nell'originale un
      giorno con sia boulder che lead aveva uno sfondo diviso in due colori
      — qui per ora si vede solo il colore della prima disciplina di quel
      giorno). Dettaglio estetico minore, va nella Fase 11.
- [x] **Fase 7 — Progressi/Grafici**: 3 statistiche periodo (ore, sessioni,
      media ore) con toggle sempre/settimana, grafico gradazione massima nel
      tempo per disciplina (o "Sommaria" per tutte insieme), grafico media
      gradi con selettore range (settimana/mese/3-6 mesi/anno/da sempre),
      grafico a ciambella distribuzione discipline, heatmap costanza ultimo
      anno. Tutti i grafici con Chart.js, temi colore letti dalle CSS
      variables come nell'originale. File: `src/lib/views/Progress.svelte`,
      `src/lib/utils/charts.js`, `src/lib/utils/heatmap.js`, più le funzioni
      di normalizzazione gradi aggiunte a `src/lib/utils/grades.js`.
      **Non ancora portato**: Tabella gradi, Guida prese, Piramide gradi
      (tre pannelli/modali secondari della pagina Progressi nell'originale)
      — rimandati alla rifinitura finale, non sono nel percorso critico.
      **Nota tecnica**: il bundle superava i 500KB (soprattutto per
      Chart.js) — risolto in seguito con code-splitting (vedi sezione
      "Porting completato" più sotto).
- [x] **Fase 8 — Benessere + Test**: tracking sonno/peso/idratazione/
      alimentazione con card riepilogo (periodo di sempre/settimanale/
      personalizzato) e grafico andamento peso; test di forza (max hang,
      trazioni, zavorrate, critical force, campus) con grafico andamento
      max hang 20mm e storico con eliminazione. File:
      `src/lib/api/wellness.js`, `src/lib/api/tests.js`,
      `src/lib/stores/testModal.svelte.js`, `src/lib/views/Wellness.svelte`,
      `src/lib/views/Test.svelte`, `src/lib/views/test/`.
- [x] **Fase 9 — Social**: ricerca amici per username, richieste
      (ricevute/inviate), lista amici, gruppi con statistiche di confronto
      a barre, feed amici filtrabile con reazioni (mood) e commenti,
      badge "record" sulle sessioni che sono il grado massimo dell'amico,
      classifica generale, grafico di confronto a barre, radar 1-a-1/gruppo,
      sfide (più sessioni entro una data / primo a un grado) con valutazione
      vincitore lato client, notifiche realtime (Supabase Realtime) con
      campanella e dropdown. File: `src/lib/api/friends.js`, `groups.js`,
      `challenges.js`, `feed.js`, `notifications.js`, `utils/challenges.js`,
      `views/Social.svelte`, `views/social/*`, `views/NotifBell.svelte`.
- [x] **Fase 10 — Admin luoghi**: vista Falesia con storico sessioni outdoor
      e pannello "Database falesie" (visibile solo a `can_edit_crags`) per
      completare/verificare zona, altitudine, parcheggio, avvicinamento,
      esposizione, tipo roccia, coordinate (con geolocalizzazione) ed
      eliminare falesie. File: `src/lib/api/crags.js` (estese
      `updateCragDetails`/`deleteCrag`), `src/lib/views/Falesia.svelte`,
      `src/lib/views/falesia/`.
- [x] **Fase 11 — Profilo, PWA, rifinitura**: pagina profilo con upload/
      resize avatar (dataURL 256×256, come nell'originale) e dati personali;
      tema chiaro/scuro dinamico via CSS custom properties (`utils/theme.js`,
      applicato a `main.js` prima del mount — prima il CSS statico mostrava
      solo la palette di fallback, mai quella "identity" dark applicata
      dalla versione vanilla); selettore lingua IT/EN nella sidebar;
      service worker (`public/sw.js`, mancava — manifest e icone erano già
      a posto) registrato in `main.js`; griglia animata nella hero della
      landing (prima era un SVG vuoto). File: `src/lib/views/Profile.svelte`,
      `src/lib/utils/avatar.js`, `src/lib/utils/theme.js`, `public/sw.js`.
      **Non portato** (rifinitura estetica minore, fuori dal percorso
      critico): Tabella gradi/Guida prese/Piramide gradi in Progressi
      (già annotato in Fase 7), gradiente diagonale multi-disciplina nel
      calendario (già annotato in Fase 6). Warning a11y residui (label
      senza `for`/`id`, pattern usato ovunque nel progetto fin dalla Fase 2)
      lasciati come nel resto della codebase; corretti invece i casi più
      concreti nei file nuovi (div cliccabili senza `onkeydown`/`role`,
      `img` senza `alt`, due canvas non dichiarati `$state`).

## Porting completato

Tutte le fasi 1-11 del piano sono state portate. Build di produzione
verificata (`npx vite build` ✓, 217 moduli, solo warning a11y non
bloccanti pre-esistenti).

**Bundle ottimizzato** (era la nota tecnica aperta dalla Fase 7):
Chart.js non è più importato staticamente nei componenti — ogni vista
che disegna grafici (Progress, Wellness, Test, e i tre grafici di
Social: FriendCompareChart, RadarCompare, GroupCompareChart) lo carica
con un `import()` dinamico tramite `src/lib/utils/chartLoader.js`
(promise cachata, così il modulo viene scaricato una sola volta anche
se più grafici lo richiedono nello stesso caricamento pagina). Risultato:
il chunk principale è sceso da 591KB a 390KB (sotto la soglia dei 500KB,
warning sparito), e Chart.js (202KB) è isolato in un chunk separato
scaricato solo quando l'utente apre una vista con grafici — non più nel
bundle iniziale dell'app (dashboard, login, ecc. partono più leggeri).

Ricontrollare lato Supabase, quando possibile:
- RLS sulle nuove tabelle usate in questa sessione (`wellness`, `tests`,
  `friendships`, `groups`, `group_members`, `challenges`,
  `challenge_participants`, `feed_reactions`, `feed_comments`,
  `notifications`, `crags`) — il porting a Svelte non la sistema da
  sola, è indipendente dal frontend usato (stessa nota già fatta per
  `profiles`/`sessions` nella Fase 1-7).
- Che la Realtime replication sia abilitata sulla tabella `notifications`
  (necessaria per `subscribeNotifications()` in `src/lib/api/notifications.js`).

## Cose notate durante il porting (da tenere a mente)

- Il campo `luogoIndirizzo` e altri (`placeSaveOpen`, `placeSaveNome`,
  `placeSaveIndirizzo`) nella versione vanilla erano già scaffolding
  abbandonato per la stessa funzionalità di "salva luogo con indirizzo" che
  abbiamo implementato lì di recente — segno che l'idea era già emersa in
  passato. Nel porting a Svelte la implementeremo pulita fin dall'inizio,
  nella Fase 5.
- `fetchProfile` seleziona solo i campi usati dall'app (non `select('*')`),
  stesso fix già applicato alla versione vanilla.
- La RLS su Supabase (tabelle `profiles`, `sessions`) va comunque verificata
  lato database — il porting a Svelte non la sistema da sola, è indipendente
  dal frontend usato.

## Come continuare da qui

1. `npm install` nella cartella del progetto (se non già fatto)
2. `npm run dev` per sviluppare con hot reload, `npm run build` per la build
   di produzione
3. Il porting è completo e il bundle è ottimizzato: prossimo lavoro
   naturale è testare a fondo con dati reali (specialmente Social/notifiche
   realtime, che richiedono più utenti), poi eventuale rifinitura a11y
   generale su tutto il progetto (non solo le Fasi 8-11).
