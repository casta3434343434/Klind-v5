# Setup rapido

npm install
npm run dev       # sviluppo con hot reload
npm run build     # build di produzione (cartella dist/)

## Asset mancanti in questo pacchetto

Non ho i file binari delle icone e delle reaction (non erano tra i file
caricati in chat). Prima di girare l'app copia dentro public/ le due
cartelle che hai già nel progetto vanilla:

  public/icons/       (dalla vecchia cartella icons/)
  public/reactions/   (dalla vecchia cartella reactions/)

Il service worker (Fase 11 del PLAN.md) non è stato ancora portato:
per ora l'app funziona come sito normale, non come PWA installabile.
Vedi PLAN.md per il resto della roadmap.
