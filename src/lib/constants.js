// Costanti di dominio, portate 1:1 dalla versione vanilla di Klind (index.html)
// per non perdere valori calibrati (scale gradi, conversioni, ecc.)

export const klindLogo = `<svg class="klind-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="48" fill="var(--lime)" />
  <path d="M 25 70 L 50 30 L 75 70 Z" fill="var(--bg)" />
  <circle cx="50" cy="25" r="10" fill="var(--bg)" />
</svg>`;

export const BOULDER_SCALE = ['4','5','5+','6A','6A+','6B','6B+','6C','6C+','7A','7A+','7B','7B+','7C','7C+','8A','8A+','8B','8B+','8C','8C+','9A'];
export const ROUTE_SCALE = ['4a','4b','4c','5a','5b','5c','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b','8b+','8c','8c+','9a','9a+','9b'];

export const KING_ROCK = [
  {id:'1', label:'1', range:'3C - 4A', color:'#5fb8c9'},
  {id:'2', label:'2', range:'4B - 4C', color:'#5fb8c9'},
  {id:'2+', label:'2+', range:'5A - 5B', color:'#7fc7d4'},
  {id:'3+', label:'3+', range:'5B+ - 6A', color:'#9fc23f'},
  {id:'4', label:'4', range:'6A+ - 6B', color:'#e7d23f'},
  {id:'4+', label:'4+', range:'6B+ - 6C', color:'#e7d23f'},
  {id:'5', label:'5', range:'6C+ - 7A', color:'#e8942f'},
  {id:'5+', label:'5+', range:'7A+ - 7B', color:'#e8602f'},
  {id:'6', label:'6', range:'7B+', color:'#d6497a'},
  {id:'6-', label:'6-', range:'7C', color:'#a8305c'},
  {id:'7', label:'7', range:'≥ 7C+', color:'#2a271c'}
];

// Ogni grado King Rock copre più gradi Font (è una scala più "larga"): le due
// tabelle sotto devono essere l'inversa esatta l'una dell'altra, altrimenti
// un blocco toccato con un grado King si ri-mostra con un grado King diverso
// da quello toccato (bug trovato il 4/9: King "3" veniva salvato come Font
// 6A ma rivisualizzato come "3+", perché le due tabelle non erano coerenti —
// mancava proprio un grado Font intermedio tra 5+ e 6A per poter distinguere
// King "3" da "3+", quindi li abbiamo uniti in un solo pulsante "3+").
// KING_TO_FONT usa sempre il primo grado Font di ciascun intervallo King,
// così il giro di andata/ritorno è sempre coerente per costruzione.
export const FONT_TO_KING = { '4':'1', '5':'2', '5+':'2+', '6A':'3+', '6A+':'4', '6B':'4', '6B+':'4+', '6C':'4+', '6C+':'5', '7A':'5', '7A+':'5+', '7B':'5+', '7B+':'6', '7C':'6-', '7C+':'7', '8A':'7', '8A+':'7', '8B':'7', '8B+':'7', '8C':'7', '8C+':'7', '9A':'7' };
export const KING_TO_FONT = { '1':'4', '2':'5', '2+':'5+', '3+':'6A', '4':'6A+', '4+':'6B+', '5':'6C+', '5+':'7A+', '6':'7B+', '6-':'7C', '7':'7C+' };

export const BOULDER_SCALES = [
  {id:'font', label:'Font (6A, 7B+)'},
  {id:'king', label:'King Rock (1, 2+, 3...)', native:true},
  {id:'french', label:'Francese (6a, 7b+)'},
  {id:'yds', label:'YDS (5.10a, 5.12b)'},
  {id:'v', label:'V-scale (V3, V8)'}
];

export const LEAD_SCALES = [
  {id:'french', label:'Francese (6a, 7b+)', native:true},
  {id:'yds', label:'YDS (5.10a, 5.12b)'},
  {id:'font', label:'Font (6A, 7B+)'},
  {id:'v', label:'V-scale (V3, V8)'}
];

export const DISCIPLINES = ['boulder','lead','moonboard','speed','circuiti'];
// 'falesia' non è più selezionabile per nuove sessioni (non è in DISCIPLINES,
// quindi non compare in nessun selettore), ma resta qui SOLO per mostrare
// correttamente l'etichetta sulle vecchie sessioni già salvate con quella
// disciplina — altrimenti il loro chip apparirebbe vuoto/"undefined".
export const DISCIPLINE_LABELS = {boulder:'Boulder',lead:'Vertical',moonboard:'Moonboard',speed:'Speed',circuiti:'Circuiti',falesia:'Falesia'};
export const LEAD_ASCENT_MODES = [{id:'primo',label:'Da primo'},{id:'secondo',label:'Da secondo'},{id:'autodelay',label:"Autodelay (sicura dall'alto)"}];
export const DOW = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
export const BOULDER_STYLES = ['Crimpy','Svasi/sloper','Dinamico','Coordinazione','Compressione','Tecnico/equilibrio','Volumi','Powerful/esplosivo'];
export const WALL_ANGLES = ['Placca (<90°)','Verticale (90°)','Leggero strapiombo','Strapiombo (120-135°)','Tetto (>135°)'];
export const LEAD_STYLES = ['Flash','Top/Progetto','Ripetizione'];
export const MOON_LAYOUTS = ['2016','2017','2019','2024','Mini 2025'];
export const MOON_TIPI = ['Flash','Top','Ripetizione'];
export const GRIP_TYPES = ['Tacche','Svasi','Pinze'];
export const SUPPLEMENTARY = ['Hangboard/travetto','Campus board','ARC','4x4/circuiti','Ripetute','Antagonisti','Pesi','Mobilità/stretching','Corsa/cardio'];
export const DITA_PROTOCOLS = ['Max hang 7s','Repeaters 7/3','Minimum edge','Continuous hang','Trazione assistita','Altro'];
export const DITA_PRESE = ['Mezzo crimp','Crimp aperto','Open hand','Pinza','Tacca/pocket'];
export const BODY_PARTS = ['','Dita A2','Dita A4','Dita altro','Polso','Gomito','Spalla','Schiena','Ginocchio','Caviglia','Pelle','Altro'];
export const TEST_TYPES = ['maxhang20','maxhangbw','pullup','pullupweighted','critforce','campus','other'];
export const TEST_LABELS = {maxhang20:'Max hang 20mm',maxhangbw:'Max hang % peso',pullup:'Trazioni max',pullupweighted:'Trazione zavorrata',critforce:'Critical Force',campus:'Campus reach',other:'Altro'};
export const TEST_UNITS = {maxhang20:'kg',maxhangbw:'%',pullup:'reps',pullupweighted:'kg',critforce:'kg',campus:'gradini',other:''};

export const DISCIPLINE_COLORS = {boulder:['#c66a3e','#d98b5e'],lead:['#78c6d5','#3c91a4'],moonboard:['#dca52f','#f6cf58'],speed:['#55a873','#398956'],circuiti:['#a06fc9','#c79ce8'],falesia:['#7a9e5c','#a3c98a']};

export const SESSION_MOODS = [
  {id:'slow', img:'/reactions/mood-slow.webp', label:'A ritmo di lumaca'},
  {id:'whipper', img:'/reactions/mood-whipper.webp', label:'Volo epico'},
  {id:'pumped', img:'/reactions/mood-pumped.webp', label:'Carico a mille'},
  {id:'psyched', img:'/reactions/mood-psyched.webp', label:'Top forma'},
  {id:'slab', img:'/reactions/mood-slab.webp', label:'Odio lo slab'},
  {id:'crash', img:'/reactions/mood-crash.webp', label:'Volato giù'},
  {id:'beta', img:'/reactions/mood-beta.webp', label:'Trovato il beta'},
  {id:'grind', img:'/reactions/mood-grind.webp', label:'Grind del giorno'},
  {id:'sunny', img:'/reactions/mood-sunny.webp', label:'Giornata perfetta'},
  {id:'hot', img:'/reactions/mood-hot.webp', label:'Sciolto dal caldo'}
];

export const DEVELOPER_USER_ID = 'ab710c04-f587-4a1d-b5a3-817ade473b20';

export const I18N = {
  it: {
    nav_home:'Home', nav_calendar:'Calendario', nav_progress:'Progressi', nav_tests:'Test',
    nav_crags_admin:'Database luoghi', nav_bugs:'Segnala bug', nav_profile:'Profilo',
    nav_social:'Social', nav_history:'Storico',
    title_home:'Ciao', title_calendar:'Calendario', title_progress:'Progressi', title_tests:'Test',
    title_crags_admin:'Database luoghi',
    title_bugs:'Segnala un bug', title_profile:'Profilo', title_social:'Profilo & Social', title_history:'Storico',
    btn_save:'Salva', btn_cancel:'Annulla', btn_delete:'Elimina', btn_edit:'Modifica', btn_close:'Chiudi',
    btn_new_session:'+ Registra sessione',
    lang_label:'Lingua'
  },
  en: {
    nav_home:'Home', nav_calendar:'Calendar', nav_progress:'Progress', nav_tests:'Tests',
    nav_crags_admin:'Places database', nav_bugs:'Report a bug', nav_profile:'Profile',
    nav_social:'Social', nav_history:'History',
    title_home:'Hi', title_calendar:'Calendar', title_progress:'Progress', title_tests:'Tests',
    title_crags_admin:'Places database',
    title_bugs:'Report a bug', title_profile:'Profile', title_social:'Profile & Social', title_history:'History',
    btn_save:'Save', btn_cancel:'Cancel', btn_delete:'Delete', btn_edit:'Edit', btn_close:'Close',
    btn_new_session:'+ Log session',
    lang_label:'Language'
  }
};
