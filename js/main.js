/* Ghe sem · Concorezzo — comportamento del sito
   Nessuna dipendenza. Gli orari si cambiano qui sotto (e nella tabella in HTML). */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  /* Con "Riduci movimento" (iPhone) o "Rimuovi animazioni" (Android) le animazioni
     restano tutte: si spegne solo il parallax. Lo zoom lento delle foto si spegne nel CSS. */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     DATI DEL LOCALE
     Orari in minuti dalla mezzanotte, per giorno (0 = domenica).
     ------------------------------------------------------------------ */
  const HOURS = {
    0: null,
    1: [7 * 60, 17 * 60 + 30],
    2: [7 * 60, 17 * 60 + 30],
    3: [7 * 60, 17 * 60 + 30],
    4: [7 * 60, 17 * 60],
    5: [7 * 60, 17 * 60 + 30],
    6: [11 * 60, 15 * 60],
  };
  const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const PRICE = 13;
  const ADDRESS = 'Via Remo Brambilla 23, Concorezzo';
  /* Menu del giorno: link CSV del foglio Google "Ghe sem · Menu del giorno"
     (nel foglio: File → Condividi → Pubblica sul web → la scheda del menu → Valori separati da virgola (.csv)).
     Se è vuoto, o se il foglio non risponde, resta il menu scritto in index.html. */
  const MENU_CSV = '';

  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  /* ------------------------------------------------------------------
     Ora corrente a Roma, qualunque sia il fuso del visitatore
     ------------------------------------------------------------------ */
  function romeNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
    return { dow, mins: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function openStatus() {
    const { dow, mins } = romeNow();
    const today = HOURS[dow];
    if (today && mins >= today[0] && mins < today[1]) {
      const left = today[1] - mins;
      return {
        open: true,
        text: left <= 30
          ? `Ultimo giro di caffè · chiudiamo alle ${fmt(today[1])}`
          : `Aperto ora · fino alle ${fmt(today[1])}`,
      };
    }
    if (today && mins < today[0]) return { open: false, text: `Chiuso · apriamo alle ${fmt(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (dow + i) % 7;
      if (HOURS[d]) return { open: false, text: `Chiuso · riapriamo ${i === 1 ? 'domani' : DAY_NAMES[d]} alle ${fmt(HOURS[d][0])}` };
    }
    return { open: false, text: 'Chiuso' };
  }

  function paintStatus() {
    const s = openStatus();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      $('[data-status-text]', el).textContent = s.text;
    });
    const { dow } = romeNow();
    $$('.hours tr').forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.dow) === dow));
  }
  paintStatus();
  setInterval(paintStatus, 60 * 1000);

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Nav, progress bar, barra mobile
     ------------------------------------------------------------------ */
  const nav = $('[data-nav]');
  const bar = $('#progress');
  const mbar = $('.mbar');
  let ticking = false;
  let heroObserved = false;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!heroObserved) mbar.classList.toggle('is-on', y > innerHeight * 0.55);
    parallax();
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  /* menu mobile */
  const burger = $('.burger');
  const mnav = $('#mnav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    mnav.setAttribute('aria-hidden', String(!open));
  }
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', mnav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ------------------------------------------------------------------
     Link interni (#eventi, #menu, #top...): la pagina scorre alla sezione
     ma l'indirizzo resta pulito, senza il # in fondo
     ------------------------------------------------------------------ */
  const cleanUrl = () => location.pathname + location.search;
  function goTo(target, smooth) {
    const root = document.documentElement;
    if (!smooth) root.style.scrollBehavior = 'auto';
    if (target.id === 'top') window.scrollTo(0, 0); else target.scrollIntoView();
    if (!smooth) root.style.scrollBehavior = '';
    /* chi usa la tastiera riparte da lì, come con un link normale */
    if (!target.matches('a, button, input, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    const target = a && a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    goTo(target, true);
  });
  /* chi arriva da un link con il # (es. ghesem.../#eventi) finisce comunque sulla sezione */
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    history.replaceState(null, '', cleanUrl());
    if (target) {
      goTo(target, false);
      /* foto e font possono spostare la pagina mentre arrivano: a caricamento finito si
         riallinea, a meno che il visitatore non abbia già iniziato a scorrere da solo */
      let moved = false;
      ['wheel', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, () => { moved = true; }, { once: true, passive: true }));
      addEventListener('load', () => { if (!moved) goTo(target, false); }, { once: true });
    }
  }

  /* ------------------------------------------------------------------
     Reveal allo scroll
     ------------------------------------------------------------------ */
  const reveals = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Hero: stories (tre momenti della giornata)
     ------------------------------------------------------------------ */
  /* Il cambio di slide è guidato da un timer, non dall'animazione CSS della barra:
     se un browser accorcia le animazioni a 0 ms le slide si rincorrerebbero a
     raffica (sfarfallio). Con "riduci movimento" resta la dissolvenza, lo zoom no.
     Con ?statico lo slideshow resta fermo. */
  const hero = $('.hero');
  const slides = $$('.slide');
  const stories = $$('.story');
  const SLIDE_MS = 6000;
  const autoplay = !/[?&]statico\b/.test(location.search);
  let cur = 0;
  let timer = 0;
  let heroVisible = true;

  if (!autoplay) hero.classList.add('is-still');

  function schedule(delay = SLIDE_MS) {
    clearTimeout(timer);
    if (!(autoplay && heroVisible && !document.hidden)) return;
    timer = setTimeout(() => {
      const next = slides[(cur + 1) % slides.length];
      /* rete lenta: la foto successiva non è ancora arrivata, si aspetta */
      if (!next.complete || !next.naturalWidth) { schedule(400); return; }
      /* la foto viene decodificata prima della dissolvenza: farlo a metà blocca il telefono */
      const go = () => showSlide(cur + 1);
      if (next.decode) next.decode().then(go, go); else go();
    }, delay);
  }

  function showSlide(i) {
    cur = (i + slides.length) % slides.length;
    /* le foto sotto restano opache: quella nuova sfuma sopra, senza buchi scuri */
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === cur);
      s.classList.toggle('is-on', k <= cur);
    });
    stories.forEach((s, k) => {
      s.classList.remove('is-active');
      s.classList.toggle('is-done', k < cur);
      if (k === cur) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current');
    });
    void stories[cur].offsetWidth; /* riavvia l'animazione della barra */
    stories[cur].classList.add('is-active');
    schedule();
  }
  stories.forEach((s, i) => s.addEventListener('click', () => showSlide(i)));

  /* parte subito: il timer di 6 secondi e la barra iniziano insieme, e intanto si
     "scaldano" le altre due foto così sono già decodificate al primo cambio */
  if (autoplay) hero.classList.add('is-playing');
  slides.forEach((img) => { if (img.decode) img.decode().catch(() => {}); });
  showSlide(0);

  /* lo slideshow si ferma quando l'hero non si vede o la scheda è in background */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const was = heroVisible;
      heroVisible = e.isIntersecting;
      if (heroVisible && !was) showSlide(cur); else schedule();
    }, { threshold: 0.15 }).observe(hero);
    /* la barra mobile compare quando l'hero esce: niente soglie sullo scroll, che
       con la barra del browser che appare e scompare farebbero lampeggiare */
    new IntersectionObserver(([e]) => mbar.classList.toggle('is-on', !e.isIntersecting), { threshold: 0.45 }).observe(hero);
    heroObserved = true;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && heroVisible) showSlide(cur); else schedule();
  });

  /* ------------------------------------------------------------------
     Animazioni infinite: partono solo quando il blocco è a schermo
     ------------------------------------------------------------------ */
  const liveEls = $$('[data-live]');
  if ('IntersectionObserver' in window) {
    const lo = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '80px' });
    liveEls.forEach((el) => lo.observe(el));
  } else {
    liveEls.forEach((el) => el.classList.add('is-live'));
  }

  /* ------------------------------------------------------------------
     Manifesto: le parole si accendono mentre scorri
     ------------------------------------------------------------------ */
  const mText = $('#manifestoText');
  let words = [];
  if (mText) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = tok; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(mText);
    words = $$('.w', mText);
  }
  let lastWords = -1;
  function paintWords() {
    if (!words.length) return;
    const r = mText.getBoundingClientRect();
    const start = innerHeight * 0.85;
    const end = innerHeight * 0.35;
    const p = Math.max(0, Math.min(1, (start - r.top) / (start - end + r.height * 0.6)));
    const n = Math.round(p * words.length);
    if (n === lastWords) return; /* tocca il DOM solo quando cambia qualcosa */
    lastWords = n;
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }

  /* ------------------------------------------------------------------
     Parallax leggero
     ------------------------------------------------------------------ */
  const pxEls = $$('[data-parallax]');
  function parallax() {
    paintWords();
    if (reduceMotion) return;
    const vh = innerHeight;
    pxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-c * parseFloat(el.dataset.parallax) * 120).toFixed(1)}px, 0) scale(1.12)`;
    });
  }

  /* ------------------------------------------------------------------
     Contatori
     ------------------------------------------------------------------ */
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target; const to = Number(el.dataset.count); const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / 1400);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* ------------------------------------------------------------------
     Una giornata: foto e orologio cambiano con lo scroll
     ------------------------------------------------------------------ */
  const steps = $$('.day-step');
  const dayImgs = $$('.day-img');
  const clocks = $$('.clock span');
  if (steps.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = Number(e.target.dataset.i);
        steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
        dayImgs.forEach((s, k) => s.classList.toggle('is-active', k === i));
        clocks.forEach((s, k) => s.classList.toggle('is-active', k === i));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => so.observe(s));
  }

  /* ------------------------------------------------------------------
     Menu interattivo: componi il pranzo
     ------------------------------------------------------------------ */
  const CATS = ['primi', 'secondi', 'contorni'];
  const LABEL = { primi: 'Primo', secondi: 'Secondo', contorni: 'Contorno' };
  const chosen = { primi: null, secondi: null, contorni: null };
  const ticket = $('[data-ticket]');
  const pill = $('.pill-ticket');
  const menuLists = $('.menu-lists');
  let dishBtns = $$('.dish');
  let activeCats = CATS.slice(); /* le categorie che oggi hanno almeno un piatto */

  const dishName = (btn) => $('.dish-name', btn).textContent.trim();
  const dishFull = (btn) => {
    const d = $('.dish-desc', btn).textContent.trim();
    return d ? `${dishName(btn)} ${d}` : dishName(btn);
  };

  function pick(cat, btn, silent) {
    const same = chosen[cat] === btn;
    chosen[cat] = same ? null : btn;
    dishBtns.filter((b) => b.dataset.cat === cat).forEach((b) => {
      b.setAttribute('aria-pressed', String(b === chosen[cat]));
      b.classList.toggle('is-dim', Boolean(chosen[cat]) && b !== chosen[cat]);
    });
    renderTicket(cat, silent);
  }

  function renderTicket(changedCat, silent) {
    CATS.forEach((cat) => {
      const li = $(`[data-slot="${cat}"]`);
      li.hidden = !activeCats.includes(cat);
      const b = $('b', li);
      const btn = chosen[cat];
      b.textContent = btn ? dishFull(btn) : 'da scegliere';
      b.classList.toggle('empty', !btn);
      if (btn && cat === changedCat && !silent) {
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      }
    });
    const need = activeCats.length;
    const n = activeCats.filter((c) => chosen[c]).length;
    $('[data-progress]').textContent = n === need ? 'Il tuo pranzo è pronto' : `${n} di ${need} scelti`;
    ticket.classList.toggle('is-complete', need > 0 && n === need);
    $('[data-pill]').textContent = `${n}/${need}`;

    const lines = activeCats.filter((c) => chosen[c]).map((c) => `• ${LABEL[c]}: ${dishFull(chosen[c])}`);
    const text = lines.length
      ? `Pranzo da Ghe sem? (${ADDRESS})\n${lines.join('\n')}\n${PRICE} € con primo, secondo e contorno. Chi viene?`
      : `Pranzo da Ghe sem? ${ADDRESS}. Menu del giorno a ${PRICE} € con primo, secondo e contorno. Chi viene?`;
    $('#waShare').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /* un solo ascoltatore per tutti i piatti: funziona anche quando arrivano dal foglio */
  menuLists.addEventListener('click', (e) => {
    const btn = e.target.closest('.dish');
    if (btn) pick(btn.dataset.cat, btn);
  });

  $('#rnd').addEventListener('click', () => {
    const rand = (cat) => {
      const list = dishBtns.filter((b) => b.dataset.cat === cat);
      return list[Math.floor(Math.random() * list.length)];
    };
    const set = (btn) => { if (btn && chosen[btn.dataset.cat] !== btn) pick(btn.dataset.cat, btn, true); };
    let n = 0;
    const spin = setInterval(() => {
      activeCats.forEach((c) => set(rand(c)));
      if (++n >= 8) { clearInterval(spin); renderTicket('', true); }
    }, 90);
  });
  renderTicket('', true);

  /* il pulsante mobile "Il tuo pranzo" compare mentre si scorre il menu */
  if ('IntersectionObserver' in window && pill) {
    const state = { menu: false, ticket: false };
    const sync = () => { pill.hidden = !(state.menu && !state.ticket && CATS.some((c) => chosen[c])); };
    const mo = new IntersectionObserver((es) => { state.menu = es[0].isIntersecting; sync(); }, { threshold: 0.05 });
    const to = new IntersectionObserver((es) => { state.ticket = es[0].isIntersecting; sync(); }, { threshold: 0.2 });
    mo.observe($('#menu')); to.observe($('#ticket'));
    menuLists.addEventListener('click', sync);
  }

  /* ------------------------------------------------------------------
     Menu dal foglio Google
     Il foglio ha una riga "Data del menu" e poi una riga per piatto:
     Categoria (Primi, Secondi, Contorni, Dolce) · Piatto · Descrizione.
     Righe vuote, intestazioni e altre colonne vengono ignorate.
     ------------------------------------------------------------------ */
  const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function categoryOf(label) {
    const s = label.trim().toLowerCase();
    if (s.startsWith('prim')) return 'primi';
    if (s.startsWith('second')) return 'secondi';
    if (s.startsWith('contorn')) return 'contorni';
    if (s.startsWith('dolc')) return 'dolce';
    if (s.startsWith('data')) return 'data';
    return null;
  }

  function readMenu(rows) {
    const menu = { primi: [], secondi: [], contorni: [], dolce: [], date: '' };
    rows.forEach(([a = '', b = '', c = '']) => {
      const cat = categoryOf(a);
      if (cat === 'data') { if (!menu.date) menu.date = b.trim(); return; }
      if (cat && b.trim()) menu[cat].push({ name: b.trim(), desc: c.trim() });
    });
    return menu;
  }

  /* oggi a Roma, come anno-mese-giorno */
  function romeToday() {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date()).split('-').map(Number);
    return { y, m, d };
  }

  /* accetta 6/11/2026, 06-11-26, 6/11, 2026-11-06 e "venerdì 6 novembre" */
  function parseMenuDate(text) {
    const s = text.trim().toLowerCase();
    let y = null, m = null, d = null, r;
    if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +r[1]; m = +r[2]; d = +r[3]; }
    else if ((r = s.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/))) { d = +r[1]; m = +r[2]; y = r[3] ? +r[3] : null; }
    else if ((r = s.match(/(\d{1,2})\s+([a-zàèéìòù]{3,})(?:\s+(\d{4}))?/))) {
      d = +r[1]; m = MONTHS.findIndex((n) => n.startsWith(r[2].slice(0, 3))) + 1; y = r[3] ? +r[3] : null;
    }
    if (!d || !m || d > 31 || m > 12) return null;
    if (y !== null && y < 100) y += 2000;
    if (y === null) y = romeToday().y;
    return { y, m, d };
  }

  function showMenuDate(text) {
    const when = $$('[data-menu-when]');
    when.forEach((el) => { el.hidden = !text; });
    if (!text) return;
    const p = parseMenuDate(text);
    const t = romeToday();
    const label = p ? `${DAY_NAMES[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()]} ${p.d} ${MONTHS[p.m - 1]}` : text;
    const isToday = p && p.y === t.y && p.m === t.m && p.d === t.d;
    $$('[data-menu-date]').forEach((el) => {
      el.textContent = isToday && el.closest('.sec-sub') ? `oggi, ${label}` : label;
    });
  }

  function makeDish(cat, dish) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'dish'; btn.type = 'button'; btn.dataset.cat = cat;
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<span class="dish-check" aria-hidden="true"></span><span class="dish-text"><span class="dish-name"></span><span class="dish-desc"></span></span>';
    /* i testi del foglio entrano sempre come testo, mai come HTML */
    $('.dish-name', btn).textContent = dish.name;
    $('.dish-desc', btn).textContent = dish.desc;
    li.appendChild(btn);
    return li;
  }

  function renderMenu(menu) {
    CATS.forEach((cat) => {
      const sec = $(`.cat[data-cat="${cat}"]`);
      $('.dishes', sec).replaceChildren(...menu[cat].map((d) => makeDish(cat, d)));
      sec.hidden = !menu[cat].length;
      chosen[cat] = null;
    });
    const dolce = $('.cat-dolce');
    $('.dolce', dolce).replaceChildren(...menu.dolce.map((d) => {
      const el = document.createElement('span');
      el.className = 'dish-name';
      el.textContent = d.desc ? `${d.name} ${d.desc}` : d.name;
      return el;
    }));
    $('#h-dolce').textContent = menu.dolce.length > 1 ? 'Dolci del giorno' : 'Dolce del giorno';
    dolce.hidden = !menu.dolce.length;

    activeCats = CATS.filter((c) => menu[c].length);
    dishBtns = $$('.dish');
    showMenuDate(menu.date);
    renderTicket('', true);
  }

  if (MENU_CSV) {
    fetch(MENU_CSV, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`menu: ${r.status}`))))
      .then((text) => {
        const menu = readMenu(parseCSV(text));
        /* un foglio vuoto o una pagina di errore non cancellano il menu della pagina */
        if (CATS.some((c) => menu[c].length)) renderMenu(menu);
      })
      .catch(() => { /* resta il menu scritto in index.html */ });
  }

  /* ------------------------------------------------------------------
     Galleria + lightbox
     ------------------------------------------------------------------ */
  const tiles = $$('.tile');
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('figcaption', lb);
  let lbIndex = 0;
  let lastFocus = null;

  function openLb(i) {
    lbIndex = (i + tiles.length) % tiles.length;
    const img = $('img', tiles[lbIndex]);
    lbImg.src = tiles[lbIndex].dataset.full;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
    if (lb.hidden) { lastFocus = document.activeElement; lb.hidden = false; document.body.classList.add('no-scroll'); $('.lb-close', lb).focus(); }
  }
  function closeLb() {
    lb.hidden = true; document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }
  tiles.forEach((t, i) => t.addEventListener('click', () => openLb(i)));
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', () => openLb(lbIndex - 1));
  $('.lb-next', lb).addEventListener('click', () => openLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });

  /* ------------------------------------------------------------------
     Mappa: si carica solo al click (nessun cookie di terze parti prima)
     ------------------------------------------------------------------ */
  const mapBtn = $('#mapBtn');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const box = $('.mapbox');
      const f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=Via%20Remo%20Brambilla%2023%2C%2020863%20Concorezzo%20MB%2C%20Italia&z=16&hl=it&output=embed';
      f.title = 'Mappa: Ghe sem, Via Remo Brambilla 23, Concorezzo';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      box.classList.add('is-loaded');
    });
  }

  onScroll();
})();
