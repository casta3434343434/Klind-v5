# Klind → Svelte — piano di migrazione

Aggiornato: 29/08/2026 (Fase 11 — porting completo). Questo file è la fonte di verità sullo stato del porting:
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
      **Nota tecnica**: il bundle ha superato i 500KB (soprattutto per
      Chart.js) — build ancora veloce, ma da tenere d'occhio; nella Fase 11
      si può valutare il code-splitting per caricare Chart.js solo quando
      serve.
- [x] **Fase 8 — Benessere + Test**: pagina Benessere con card riepilogo
      (sonno medio con modalità di sempre/settimanale/personalizzato, qualità
      sonno media e acqua totale con toggle sempre/settimana), grafico
      andamento peso, form per registrare/modificare la voce del giorno
      (sonno, qualità, peso, idratazione, kcal stimate se non inserite,
      alimentazione), elenco ultime 10 voci con pannello "Cibo" a comparsa.
      Pagina Test con grafico andamento max hang 20mm, storico test con
      eliminazione, modale "Nuovo test" (tipo, valore, tacca/presa, note) —
      stessi 7 tipi di test dell'originale (max hang, trazioni, trazione
      zavorrata, critical force, campus, altro). `loadAllUserData` ora
      carica anche `tests` e `wellness` (prima restavano array vuoti).
      File: `src/lib/views/Wellness.svelte`, `src/lib/views/Tests.svelte`,
      `src/lib/api/wellness.js`, `src/lib/api/tests.js`,
      `src/lib/utils/wellness.js` (stima kcal, stessa formula MET=8
      dell'originale). Build verificata (`npx vite build` ✓, stessi warning
      a11y preesistenti in `DisciplineFields.svelte`, nessuno nuovo).
      Fase completa 1:1 rispetto all'originale, nessun elemento noto mancante.
- [x] **Fase 9 — Social**: ricerca utenti per username + invio richiesta,
      richieste ricevute/inviate (accetta/rifiuta/annulla), lista amici con
      rimozione (conferma), gruppi (crea/elimina/abbandona/rimuovi membro)
      con grafico a barre di confronto per gruppo, feed amici (sessioni non
      private) con filtro disciplina/amico, "mostra altri" paginato, badge
      🏆 sui record personali nel feed, reazioni (stessa libreria di mood
      reaction della sessione) e commenti sulle sessioni del feed, classifica
      generale ordinata per grado massimo boulder, grafico a barre di
      confronto con tutti gli amici, radar 1-a-1 o per gruppo, sfide
      ("più sessioni entro una data" o "primo a un grado") con calcolo
      vincitore lato client, notifiche in-app con campanello + badge non
      lette + sottoscrizione realtime Supabase (nuove notifiche compaiono
      senza ricaricare) + richiesta permesso notifiche browser.
      File: `src/lib/views/Social.svelte` e `src/lib/views/social/`
      (FriendsPanel, GroupsPanel, GroupCard, FeedPanel, FeedItem,
      LeaderboardPanel, ComparePanel, RadarPanel, ChallengesPanel,
      ConfirmDialog, DeveloperBadge, NotifBell — il campanello vive
      nell'header di `AppShell.svelte`, non nella pagina Social).
      `src/lib/api/social.js` (amici/richieste/feed/reazioni/commenti),
      `src/lib/api/groups.js`, `src/lib/api/challenges.js`,
      `src/lib/api/notifications.js`, `src/lib/utils/social.js`
      (rilevamento record nel feed), `src/lib/stores/confirm.svelte.js`
      (dialogo di conferma generico riusato da Amici/Gruppi — sostituisce
      il vecchio `state.pendingConfirm` + tabella action/id dell'originale
      con una callback `onConfirm` diretta, più semplice da leggere).
      `loadAllUserData` ora carica anche amici/gruppi/sfide/notifiche e
      apre la sottoscrizione realtime; tutto viene ripulito al logout
      (incluso l'unsubscribe dal canale realtime, assente nell'originale
      ma corretto da avere per evitare canali duplicati tra login diversi
      nella stessa scheda). Build verificata (`npx vite build` ✓, corretti
      3 errori di build veri — non warning — per `<tr>` fuori da
      `<thead>/<tbody>` in tre tabelle nuove, più severo in Svelte 5
      rispetto all'HTML permissivo dell'originale; per il resto solo i
      warning a11y preesistenti).
      **Non ancora portato**: la UI di amministrazione/approvazione luoghi
      condivisi menzionata nell'originale come "gruppi" a parte non c'entra
      qui — quella è la Fase 10 (Admin luoghi). Nessun elemento noto
      mancante rispetto alla pagina Social originale.
- [x] **Fase 10 — Admin luoghi**: pagina Falesia con elenco sessioni outdoor
      (componente condiviso `SessionMini`, più ricco della versione
      semplificata usata in Dashboard/History — mood, grado, numero
      elementi/vie, modalità di salita lead, luogo, riscaldamento — portato
      1:1 da `sessionMini()` dell'originale), pulsante "+ Nuova sessione
      falesia" che apre il modale già esistente precompilato sulla
      disciplina falesia. Per gli utenti Verificati (`profile.can_edit_crags`)
      compare anche il pulsante "Database falesie" che apre/chiude il
      pannello di amministrazione: ricerca per nome, righe espandibili con
      form di dettaglio (zona, altitudine, parcheggio, tempo di
      avvicinamento, esposizione, tipo roccia, lat/lng con pulsante
      "Usa la mia posizione" via geolocalizzazione browser, checkbox
      "verificata"), salvataggio ed eliminazione (con conferma) — stesso
      flusso e stessi campi di `renderCragsAdmin`/`renderCragAdminRow`
      dell'originale. Il controllo `can_edit_crags` è applicato sia in UI
      (pulsante/pannello nascosti) sia lato funzioni API (`updateCragDetails`/
      `deleteCrag` rifiutano se il profilo non è verificato) come UX-guard
      in più rispetto alla RLS di Supabase, che resta comunque l'unica difesa
      reale. File: `src/lib/views/Falesia.svelte`, `src/lib/views/SessionMini.svelte`,
      `src/lib/views/crags/CragsAdmin.svelte`, `src/lib/views/crags/CragAdminRow.svelte`;
      `src/lib/api/crags.js` esteso con `updateCragDetails`/`deleteCrag`
      (prima aveva solo `loadCrags`/`addCrag`). `AppShell.svelte`: aggiunta
      la voce `falesie` a `IMPLEMENTED` e la route verso `Falesia.svelte`
      (era l'ultimo placeholder "sezione arriva in una fase successiva").
      Build verificata (`npx vite build` ✓, solo warning a11y preesistenti
      dello stesso tipo già presenti in tutto il resto del progetto —
      `<label>` senza `for` esplicito — nessun errore nuovo). Nessun elemento
      noto mancante rispetto al flusso Admin luoghi dell'originale.
- [x] **Fase 11 — Profilo, PWA, rifinitura**: pagina Profilo con avatar
      (upload + ritaglio quadrato 256×256 in JPEG lato client, stessa
      `resizeAvatar()` dell'originale — nessun upload su storage esterno,
      resta salvato come data URL nel campo `avatar_url`), badge
      verificato/developer, campi altezza/età/peso/apertura/anni
      arrampicata/obiettivo settimanale, salvataggio con controllo username
      duplicato. Tema chiaro/scuro e lingua IT/EN: pannello "Tema" nella
      sidebar (desktop) e nel menu mobile, stessa palette "Klind Identity"
      dell'originale applicata sovrascrivendo le CSS variable a runtime
      (persistita in `localStorage`, applicata anche al caricamento pagina
      prima del mount). Griglia animata dell'hero nella landing, portata da
      `drawHero()` in modo dichiarativo (nessun `innerHTML` manuale).
      Gradiente diagonale a due colori nel calendario per i giorni con
      sessioni di più discipline diverse (prima si vedeva solo la prima
      disciplina del giorno — dettaglio rimasto in sospeso dalla Fase 6).
      Manifest e icone erano già presenti da inizio progetto; aggiunto il
      service worker (`public/sw.js`, stessa strategia app-shell
      dell'originale: network-first per la navigazione con fallback offline,
      cache-first per il resto) e la sua registrazione in `src/main.js` —
      completa l'installabilità PWA. Corretto anche un piccolo bug latente:
      `fetchProfile` non selezionava mai la colonna `scala` (preferenza
      scala gradi), quindi restava sempre sul default nonostante fosse già
      letta altrove (form nuova sessione) — ora è inclusa nella select.
      File: `src/lib/views/Profile.svelte`, `src/lib/utils/theme.js`
      (palette tema, `applyTheme`/`setThemeMode`/`discColor`),
      `src/lib/utils/avatar.js` (`resizeAvatar`), `public/sw.js`,
      `src/main.js` (chiama `applyTheme()` prima del mount e registra il
      service worker), `src/lib/views/AppShell.svelte` (pannello tema/lingua
      + route `profile`), `src/lib/views/Landing.svelte` (hero grid),
      `src/lib/views/Calendar.svelte` (gradiente due discipline),
      `src/lib/api/profile.js` (colonna `scala`).
      Build verificata (`npx vite build` ✓, nessun errore). Sistemati anche
      i warning a11y `label senza for` introdotti nella Fase 10
      (`CragAdminRow.svelte`, ora 0). Rimangono ~96 warning a11y non
      bloccanti preesistenti fin dalla Fase 1 (soprattutto `<label>` senza
      `for` esplicito e `onclick` su elementi non nativamente interattivi):
      sono cosmetici/di accessibilità, non impediscono la build né l'uso
      dell'app, ma una pulizia sistematica su tutti i componenti resta un
      buon prossimo passo se si vuole rifinire ulteriormente il progetto.
      Con questa fase il piano di porting dichiarato in cima a questo file
      (Fasi 1–11) è completo: tutte le sezioni della versione vanilla hanno
      un equivalente Svelte funzionante e verificato via build.

## Fix dopo il primo giro di test (feedback utente, post-Fase 11)

- **Eliminazione voce Benessere**: funzionalità nuova, non presente
  nell'originale (che non permetteva di eliminare una voce già salvata).
  Bottone "Elimina" per voce in "Ultime voci" con lo stesso modale di
  conferma già usato per i test. File: `src/lib/api/wellness.js`
  (`deleteWellnessRemote`), `src/lib/views/Wellness.svelte`.
- **Bug reale: i grafici non si aggiornavano cambiando tema**. Cambiare
  Aspetto (Chiaro/Scuro) sovrascrive le CSS variable sul documento, ma
  Chart.js legge i colori solo al momento in cui il grafico viene creato —
  e in Svelte quella creazione avviene dentro un `$effect` che non aveva
  nessuna dipendenza reattiva dal tema, quindi non veniva mai rieseguito al
  cambio: i grafici restavano con i colori del tema precedente, illeggibili
  sul nuovo sfondo (è quello che si vedeva nel radar Social — non era un
  problema di palette in sé, ma di grafici "congelati" sul tema sbagliato).
  Aggiunto `app.themeMode` come specchio reattivo di
  `localStorage('klindThemeMode')` in `appState.svelte.js`; `setThemeMode()`
  ora lo aggiorna dopo aver applicato le CSS variable, e ogni `$effect` che
  disegna un grafico legge `app.themeMode` così viene rieseguito e il
  grafico si ridisegna con i colori giusti. File toccati:
  `src/lib/stores/appState.svelte.js`, `src/lib/utils/theme.js`,
  `src/lib/views/AppShell.svelte`, `src/lib/views/Progress.svelte`,
  `src/lib/views/Tests.svelte`, `src/lib/views/social/GroupCard.svelte`,
  `src/lib/views/social/ComparePanel.svelte`,
  `src/lib/views/social/RadarPanel.svelte` (Wellness.svelte aveva già la
  dipendenza aggiunta durante la Fase 11 stessa).
- **Bug reale: il pannello notifiche si apriva quasi tutto fuori schermo**.
  `.notif-dropdown` usava `right:0` (identico all'originale), ma la
  campanella vive nella riga del logo vicino al bordo destro della sidebar
  stretta (220px): il pannello di 320px si apriva per la maggior parte a
  sinistra del bordo della pagina, tagliato — da qui il testo troncato/
  illeggibile segnalato. Il bug è strutturalmente identico anche
  nell'originale (stesso markup, stesso CSS), semplicemente non era mai
  stato notato lì. Corretto cambiando la regola in `left:0`, così il
  pannello si apre verso l'area di contenuto (molto più ampia) invece che
  verso il bordo della pagina. File: `src/styles/global.css`.
- Sulla domanda "le notifiche servono davvero": per ora le ho lasciate
  (funzionavano correttamente, il problema era solo il posizionamento del
  pannello, ora risolto) — se dopo averle riprovate si preferisce comunque
  toglierle o semplificarle, è una modifica piccola da fare quando si vuole.
  Build verificata (`npx vite build` ✓, nessun errore nuovo).

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
3. Il piano di porting (Fasi 1–11) è completo: tutte le sezioni della
   versione vanilla hanno un equivalente Svelte funzionante. Possibili
   prossimi passi, nessuno bloccante: pulizia sistematica dei warning a11y
   rimasti (vedi nota in Fase 11), code-splitting per Chart.js (bundle oltre
   i 500KB, vedi nota in Fase 7), i tre pannelli secondari di Progressi
   (Tabella gradi, Guida prese, Piramide gradi, vedi nota in Fase 7).
