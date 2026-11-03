# Ghe sem · Concorezzo

Sito statico: HTML, CSS e JavaScript, senza build né dipendenze.

```
index.html      contenuti e struttura
css/style.css   stile (palette e font in cima al file)
js/main.js      comportamento (orari in cima al file)
favicon.svg
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

**Menu del giorno** (ogni giorno, 1 minuto). In `index.html`, sezione `id="menu"`: ogni piatto è un `<li>` con nome e descrizione. Aggiungi, togli o modifica gli `<li>`. Aggiorna anche la data nei due punti con `data-menu-date` (sotto il titolo e sullo scontrino).

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
