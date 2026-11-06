/* Menu del giorno: legge il foglio Google pubblicato e lo passa al sito.
   Così il browser dei visitatori parla solo con questo sito e a Google non arriva
   nessun loro dato (indirizzo IP compreso). Su Vercel risponde a /api/menu.

   Il link è quello di "File → Condividi → Pubblica sul web" del foglio,
   con ?output=csv in fondo al posto di /pubhtml. */
const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVCKHGiXYxCPmEzn_GDNfcGrG1eu7JyLDDOGdyWqHAgaKUE5Htf9wN3_btcAip7BZasVOGswS7FUcb/pub?output=csv';

module.exports = async (req, res) => {
  try {
    const r = await fetch(SHEET_CSV, { redirect: 'follow' });
    if (!r.ok) throw new Error(`il foglio ha risposto ${r.status}`);
    const text = await r.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    /* Vercel tiene la risposta per un minuto e poi la rinnova in background:
       il foglio viene letto al massimo una volta al minuto, non a ogni visita */
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    res.status(200).send(text);
  } catch (err) {
    /* il sito, se non riceve il menu, mostra quello scritto in index.html */
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).send('menu non disponibile');
  }
};
