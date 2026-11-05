# Ghe sem · Concorezzo

Sito statico: HTML, CSS e JavaScript, senza build né dipendenze.

```
index.html      contenuti e struttura
css/style.css   stile (palette e font in cima al file)
js/main.js      comportamento (orari in cima al file)
img/logo-ghe-sem.svg   logo (ricalcato dall'insegna), usato nel menu e nel footer
favicon.svg            icona della scheda (il calice del logo)
favicon-32.png, apple-touch-icon.png   la stessa icona in PNG, per Safari e iPhone
```

## Vederlo in locale

```bash
python3 -m http.server 5173
```

Poi apri http://127.0.0.1:5173

## Pubblicarlo su Vercel

Non serve nessuna configurazione. Dalla cartella del progetto:

```bash
npx vercel
```

Oppure trascina la cartella su vercel.com/new.

## Cose da aggiornare

**Menu del giorno**. Lo aggiorna il locale dal foglio Google "Ghe sem · Menu del giorno" (anche dall'app Fogli sul telefono): una riga "Data del menu" e poi una riga per piatto, con Categoria (Primi, Secondi, Contorni, Dolce), Piatto e Descrizione. Il sito legge il foglio a ogni visita tramite il link CSV in `MENU_CSV`, in cima a `js/main.js`; le modifiche si vedono entro qualche minuto. Se il link è vuoto o il foglio non risponde, il sito mostra il menu scritto in `index.html` (sezione `id="menu"`, con la data nei punti `data-menu-date`): conviene aggiornarlo ogni tanto, perché è quello che vede chi ha JavaScript spento.

**Orari**. Vanno cambiati in quattro posti:
1. la tabella in `id="dove"` (`index.html`)
2. l'oggetto `HOURS` in cima a `js/main.js` (alimenta "Aperto ora / Chiuso")
3. i dati strutturati `openingHoursSpecification` nel `<head>` (per Google)
4. il riepilogo nel footer

**Foto**. Per ora sono segnaposto da Unsplash: in `index.html` cerca `images.unsplash.com` e sostituisci gli URL con le foto vere (meglio come file in una cartella `img/`, in formato WebP). Cambia anche l'immagine `og:image` nel `<head>`, che compare quando il link viene condiviso.

## Prima di andare online

- Aggiungere Privacy e Cookie policy, e i dati societari (P.IVA) nel footer.
- Sostituire le foto segnaposto e togliere la dicitura nel footer.
- La mappa di Google si carica solo al click, quindi non servono banner cookie per la mappa. Se si aggiungono analytics o altri servizi, serve un banner.
