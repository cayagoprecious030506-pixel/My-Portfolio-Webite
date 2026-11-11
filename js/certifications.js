/* =====================================================
   CERTIFICATIONS: one clothesline, About-style carousel
   - every polaroid frame hugs its own image (irregular sizes)
   - only the selected one sits in front, straight and clear
   - click, arrows, keys, swipe or sideways scroll to browse
===================================================== */

(function () {
  const board = document.getElementById('certBoard');
  if (!board) return;

  const dotsEl = document.getElementById('certDots');
  const info = document.getElementById('certInfo');
  const metaEl = document.getElementById('certMeta');
  const titleEl = document.getElementById('certTitle');
  const descEl = document.getElementById('certDesc');
  const openEl = document.getElementById('certOpen');
  const dlEl = document.getElementById('certDownload');
  const prevBtn = document.getElementById('certPrev');
  const nextBtn = document.getElementById('certNext');

  /* ---- per-photo variety (repeats in order) ---- */
  const TILT   = [-6, 5, -4, 7, -5, 4, -7, 6];              // degrees
  const DROP   = [8, 22, 4, 16, 10, 24, 6, 18];             // px below the rope
  const SIZE   = [1, 0.9, 1.08, 0.95, 1.04, 0.88, 1.1, 0.93]; // size factor
  const PIN    = [50, 38, 62, 46, 58, 40, 56, 48];          // pin position across the card (%)
  const JITTER = [0, -10, 12, -6, 10, -12, 6, -8];          // uneven spacing (px)
  const SAG    = 30;                                        // how far the rope droops (px)

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  let certs = [];
  let ratios = [];
  let cards = [];
  let dots = [];
  let total = 0;
  let current = 0;
  let u = 240;

  /* ---- load data, then measure every image so frames fit them ---- */
  fetch('data/certifications.json')
    .then((r) => r.json())
    .catch(() => [])
    .then((data) => {
      if (Array.isArray(data)) certs = data;
      else if (data && Array.isArray(data.certifications)) certs = data.certifications;
      else if (data && typeof data === 'object' && data.title) certs = [data];

      return Promise.all(certs.map((c) => new Promise((resolve) => {
        if (!c.image) return resolve(4 / 3);
        const im = new Image();
        im.onload = () => resolve(im.naturalWidth / im.naturalHeight || 4 / 3);
        im.onerror = () => resolve(4 / 3);
        im.src = c.image;
      })));
    })
    .then((r) => {
      ratios = r;
      init();
    });

  function init() {
    total = certs.length;

    if (!total) {
      board.style.height = 'auto';
      board.innerHTML = '<p class="empty">Certificates coming soon.</p>';
      info.hidden = true;
      return;
    }

    /* rope + cards */
    const ropeH = 16 + SAG;
    const ropePath = `M0 8 Q500 ${8 + 2 * SAG} 1000 8`;

    board.innerHTML = `
      <svg class="cert-rope" viewBox="0 0 1000 ${ropeH}" height="${ropeH}" preserveAspectRatio="none" aria-hidden="true">
        <path class="cert-rope-base"  vector-effect="non-scaling-stroke" d="${ropePath}"/>
        <path class="cert-rope-twist" vector-effect="non-scaling-stroke" d="${ropePath}"/>
      </svg>
      ${certs.map((c, i) => {
        const p = i % 8;
        const ar = ratios[i];
        const k = (ar >= 1 ? 1.32 : 0.95) * SIZE[p];      // wide photos get wider frames
        return `
        <figure class="cert-card"
          style="--ar:${ar.toFixed(4)};--k:${k.toFixed(3)};--pin:${PIN[p]};--drop:${DROP[p]};--dur:${5 + (i % 3)}s;--delay:-${(i * 0.9).toFixed(1)}s">
          <div class="cert-img"><img src="${esc(c.image)}" alt="${esc(c.title)}" draggable="false"></div>
          <span class="cert-view">View certificate</span>
          <figcaption class="cert-caption">${esc(c.title)}</figcaption>
        </figure>`;
      }).join('')}`;

    cards = [...board.querySelectorAll('.cert-card')];

    dotsEl.innerHTML = certs.map((c, i) => `
      <button type="button" class="cert-dot" aria-label="Show certificate ${i + 1}">${String(i + 1).padStart(2, '0')}</button>`).join('');
    dots = [...dotsEl.querySelectorAll('.cert-dot')];
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    bindBoardEvents();

    layout();
    updateInfo();

    // turn transitions on after the first placement
    requestAnimationFrame(() => requestAnimationFrame(() => board.classList.add('is-ready')));

    let raf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    });
  }

  /* ---- sizes + positions ---- */
  function layout() {
    const W = board.clientWidth;
    u = W < 640 ? Math.max(150, Math.min(230, W * 0.5)) : Math.max(170, Math.min(280, W * 0.25));
    board.style.setProperty('--u', u + 'px');

    place();

    // make the stage tall enough for the tallest photo
    const tallest = Math.max(...cards.map((c) => c.offsetHeight));
    board.style.height = Math.ceil(tallest * 1.08 + 8 + SAG + 24 + 50) + 'px';
  }

  const ropeY = (f) => 8 + 4 * SAG * f * (1 - f);

  function place() {
    const W = board.clientWidth;
    const step = u * 1.2;

    cards.forEach((card, i) => {
      const p = i % 8;

      let d = (i - current + total) % total;
      if (d > total / 2) d -= total;
      const ad = Math.abs(d);

      card.classList.toggle('is-active', ad === 0);
      card.classList.toggle('is-prev', d === -1);
      card.classList.toggle('is-next', d === 1 && total > 1);
      card.classList.toggle('is-far', ad === 2);
      card.classList.toggle('is-hidden', ad > 2);

      const sc  = ad === 0 ? 1.06 : ad === 1 ? 0.9 : ad === 2 ? 0.78 : 0.7;
      const ox  = ad === 0 ? 0 : Math.sign(d) * (ad > 2 ? step * 2.4 : ad * step) + JITTER[p];
      const rot = ad === 0 ? TILT[p] * 0.25 : TILT[p];

      // follow the rope's curve at the spot where the pin is
      const pinX = W / 2 + ox + ((PIN[p] - 50) / 100) * card.offsetWidth * sc;
      const f = Math.min(1, Math.max(0, pinX / W));
      const ty = Math.round(ropeY(f) + DROP[p]);

      card.style.setProperty('--ox', Math.round(ox));
      card.style.setProperty('--ty', ty);
      card.style.setProperty('--rot', rot + 'deg');
      card.style.setProperty('--sc', sc);

      const visible = ad <= 1;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', visible ? '0' : '-1');
      card.setAttribute('aria-hidden', String(!visible));
      card.setAttribute('aria-label',
        `Certificate ${i + 1} of ${total}. ${ad === 0 ? 'Selected. Click to open it.' : 'Click to bring this one forward.'}`);
    });
  }

  /* ---- select ---- */
  function goTo(n) {
    current = (n + total) % total;
    place();
    updateInfo();
  }

  function updateInfo() {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));

    const c = certs[current];
    const file = c.pdf || c.image || '';

    metaEl.textContent = [c.issuer, c.date].filter(Boolean).join(' / ');
    titleEl.textContent = c.title || '';
    descEl.textContent = c.description || '';
    descEl.hidden = !c.description;

    openEl.hidden = dlEl.hidden = !file;
    if (file) {
      openEl.href = file;
      dlEl.href = file;
    }

    info.classList.remove('flash');
    void info.offsetWidth; // restart the fade
    info.classList.add('flash');
  }

  /* ---- interaction ---- */
  function bindBoardEvents() {
    let startX = null;
    let startY = null;
    let swiped = false;

    // click a photo: bring it forward, or open it if it is already in front
    board.addEventListener('click', (e) => {
      if (swiped) { swiped = false; return; }
      const card = e.target.closest('.cert-card');
      if (!card) return;
      const i = cards.indexOf(card);
      if (i === current) {
        const file = certs[i].pdf || certs[i].image;
        if (file) window.open(file, '_blank', 'noopener');
      } else {
        goTo(i);
      }
    });

    // Enter / Space on a focused photo
    board.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.cert-card');
        if (!card) return;
        e.preventDefault();
        card.click();
      }
    });

    // swipe / drag
    board.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      swiped = false;
    });
    board.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        goTo(current + (dx < 0 ? 1 : -1));
      }
      startX = startY = null;
    });
    board.addEventListener('pointercancel', () => { startX = startY = null; });

    // sideways scroll (trackpad / shift + wheel)
    let wheelLock = false;
    board.addEventListener('wheel', (e) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(dx) < 20) return; // let normal up/down page scrolling through
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      goTo(current + (dx > 0 ? 1 : -1));
      setTimeout(() => { wheelLock = false; }, 500);
    }, { passive: false });

    // ← / → while the section is on screen
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (board.contains(e.target)) return; // already handled above
      const r = board.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6 || r.bottom < window.innerHeight * 0.3) return;
      goTo(current + (e.key === 'ArrowRight' ? 1 : -1));
    });
  }
})();