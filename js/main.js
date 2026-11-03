/* Ghe sem · Concorezzo — comportamento del sito
   Nessuna dipendenza. Gli orari si cambiano qui sotto (e nella tabella in HTML). */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = matchMedia('(max-width: 900px), (hover: none)'); /* telefoni e touch */

  /* ------------------------------------------------------------------
     DATI DEL LOCALE
     Orari in minuti dalla mezzanotte, per giorno (0 = domenica).
     ------------------------------------------------------------------ */
  const HOURS = {
    0: null,
    1: [7 * 60 + 30, 15 * 60 + 30],
    2: [7 * 60 + 30, 15 * 60 + 30],
    3: [7 * 60 + 30, 15 * 60 + 30],
    4: [7 * 60 + 30, 15 * 60 + 30],
    5: [7 * 60 + 30, 15 * 60 + 30],
    6: [8 * 60, 15 * 60],
  };
  const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const PRICE = 13;
  const ADDRESS = 'Via Remo Brambilla 23, Concorezzo';

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
    if (!narrow.matches) { /* su telefono la barra di avanzamento è nascosta: niente lavoro inutile */
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
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
     Reveal allo scroll
     ------------------------------------------------------------------ */
  const reveals = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
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
     con "riduci movimento" attivo le animazioni durano 0 ms e le slide si
     rincorrerebbero a raffica (sfarfallio). Con ?statico lo slideshow resta fermo. */
  const hero = $('.hero');
  const slides = $$('.slide');
  const stories = $$('.story');
  const SLIDE_MS = 6000;
  const autoplay = !reduceMotion && !/[?&]statico\b/.test(location.search);
  let cur = 0;
  let timer = 0;
  let ready = false;
  let heroVisible = true;

  if (!autoplay) hero.classList.add('is-still');

  function schedule() {
    clearTimeout(timer);
    if (autoplay && ready && heroVisible && !document.hidden) timer = setTimeout(() => showSlide(cur + 1), SLIDE_MS);
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

  /* si parte solo dopo aver decodificato le tre foto: decodificarne una a metà
     dissolvenza blocca il telefono per un istante e la foto "salta" */
  const decoded = Promise.all(slides.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
  Promise.race([decoded, new Promise((r) => setTimeout(r, 8000))]).then(() => { ready = true; showSlide(cur); });

  /* lo slideshow si ferma quando l'hero non si vede o la scheda è in background */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      if (heroVisible && ready) showSlide(cur); else schedule();
    }, { threshold: 0.15 }).observe(hero);
    /* la barra mobile compare quando l'hero esce: niente soglie sullo scroll, che
       con la barra del browser che appare e scompare farebbero lampeggiare */
    new IntersectionObserver(([e]) => mbar.classList.toggle('is-on', !e.isIntersecting), { threshold: 0.45 }).observe(hero);
    heroObserved = true;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ready && heroVisible) showSlide(cur); else schedule();
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
    if (reduceMotion) {
      if (lastWords !== words.length) { words.forEach((w) => w.classList.add('on')); lastWords = words.length; }
      return;
    }
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
    if (reduceMotion || narrow.matches) return; /* su telefono la foto resta ferma */
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
  if (!reduceMotion && 'IntersectionObserver' in window) {
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
  const dishBtns = $$('.dish');

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
      const b = $(`[data-slot="${cat}"] b`);
      const btn = chosen[cat];
      b.textContent = btn ? dishFull(btn) : 'da scegliere';
      b.classList.toggle('empty', !btn);
      if (btn && cat === changedCat && !silent && !reduceMotion) {
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      }
    });
    const n = CATS.filter((c) => chosen[c]).length;
    $('[data-progress]').textContent = n === 3 ? 'Il tuo pranzo è pronto' : `${n} di 3 scelti`;
    ticket.classList.toggle('is-complete', n === 3);
    $('[data-pill]').textContent = `${n}/3`;

    const lines = CATS.filter((c) => chosen[c]).map((c) => `• ${LABEL[c]}: ${dishFull(chosen[c])}`);
    const text = lines.length
      ? `Pranzo da Ghe sem? (${ADDRESS})\n${lines.join('\n')}\n${PRICE} € con primo, secondo e contorno. Chi viene?`
      : `Pranzo da Ghe sem? ${ADDRESS}. Menu del giorno a ${PRICE} € con primo, secondo e contorno. Chi viene?`;
    $('#waShare').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  dishBtns.forEach((btn) => btn.addEventListener('click', () => pick(btn.dataset.cat, btn)));

  $('#rnd').addEventListener('click', () => {
    const rand = (cat) => {
      const list = dishBtns.filter((b) => b.dataset.cat === cat);
      return list[Math.floor(Math.random() * list.length)];
    };
    const set = (btn) => { if (chosen[btn.dataset.cat] !== btn) pick(btn.dataset.cat, btn, true); };
    if (reduceMotion) { CATS.forEach((c) => set(rand(c))); return; }
    let n = 0;
    const spin = setInterval(() => {
      CATS.forEach((c) => set(rand(c)));
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
    dishBtns.forEach((b) => b.addEventListener('click', sync));
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
