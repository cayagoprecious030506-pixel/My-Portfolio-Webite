(() => {
  'use strict';

  const DATA_URL = 'data/projects.json';
  const AUTOPLAY_MS = 1500; 
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // only allow http(s) links
  const safeUrl = (u) => {
    if (!u) return '';
    try {
      const x = new URL(u, window.location.href);
      return /^https?:$/.test(x.protocol) ? x.href : '';
    } catch { return ''; }
  };

  const pad = (n) => String(n).padStart(2, '0');
  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  const CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

  /* ---------- data ---------- */
  // JSON order by default; an optional numeric "order" field overrides it
  function sortProjects(list) {
    return list
      .map((p, i) => ({ p, i, o: Number.isFinite(Number(p && p.order)) && p.order !== null && p.order !== '' ? Number(p.order) : 1e6 + i }))
      .filter((x) => x.p && typeof x.p === 'object')
      .sort((a, b) => a.o - b.o || a.i - b.i)
      .map((x) => x.p);
  }

  // "images" can be strings or { src, alt, caption }; the old single "image" still works
  function imageList(p) {
    const raw = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
    return raw
      .map((i) => (typeof i === 'string' ? { src: i } : i))
      .filter((i) => i && i.src)
      .map((i) => ({ src: String(i.src), alt: i.alt || '', caption: i.caption || '' }));
  }

  function normalize(p, index) {
    const live = safeUrl(p.liveUrl || p.demoUrl || p.demo);
    const git = safeUrl(p.githubUrl || p.github);
    const generic = safeUrl(p.url);

    const links = [];
    if (git) links.push({ label: 'GitHub', href: git });
     if (live) links.push({ label: 'Visit Site', href: live });
    if (generic && generic !== live && generic !== git) {
      links.push({ label: /github\.com/i.test(generic) ? 'GitHub' : 'View Project', href: generic });
    }

    return {
      number: index + 1,
      title: p.title || 'Untitled project',
      category: p.category || '',
      year: p.year || '',
      status: p.status || '',
      summary: p.summary || p.description || '',
      tags: asList(p.tags || p.technologies),
      images: imageList(p),
      note: p.note || '',
      links
    };
  }

  /* ---------- one sketchbook page ---------- */
  function pageHTML(raw, index) {
    const p = normalize(raw, index);
    const meta = [p.category, p.year].filter(Boolean).join(' · ');
    const n = p.images.length;
    const multi = n > 1;
    const defaultNote = p.note || `fig. ${pad(p.number)} ♡`;

    const slides = p.images.map((im, i) => `
      <div class="sk-slide" data-pos="${i === 0 ? 'active' : 'hidden'}"${im.caption ? ` data-caption="${escapeHtml(im.caption)}"` : ''}>
        <img src="${escapeHtml(im.src)}" alt="${escapeHtml(im.alt || `${p.title} screenshot ${i + 1}`)}" loading="${index > 0 || i > 0 ? 'lazy' : 'eager'}" draggable="false">
      </div>`).join('');

    const shot = n
      ? `<div class="sk-shot" data-slides>
           ${slides}
           ${multi ? `<button type="button" class="sk-arrow sk-arrow--prev" aria-label="Previous photo">${CHEV_L}</button>
                      <button type="button" class="sk-arrow sk-arrow--next" aria-label="Next photo">${CHEV_R}</button>` : ''}
         </div>`
      : '<div class="sk-shot is-empty">preview coming soon</div>';

    const dots = multi
      ? `<span class="sk-dots" role="group" aria-label="Project photos">${p.images.map((_, i) =>
          `<button type="button" class="sk-dot${i === 0 ? ' is-active' : ''}" aria-label="Show photo ${i + 1} of ${n}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</span>`
      : '';

    const tags = p.tags.length
      ? `<div class="sk-divider"></div>
         <p class="sk-label">built with</p>
         <ul class="sk-tags">${p.tags.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : '';

    const links = p.links.length
      ? `<div class="sk-links">${p.links.map((l, i) =>
          `<a class="sk-btn${i ? ' sk-btn--ghost' : ''}" href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ${ARROW}</a>`).join('')}</div>`
      : '';

    return `
      <article class="sk-page"${reduceMotion ? '' : ' data-reveal'}>
        <span class="sk-coil" aria-hidden="true"></span>
        <header class="sk-top">
          <span class="sk-num">Project ${pad(p.number)}</span>
          <span class="sk-rule" aria-hidden="true"></span>
          ${meta ? `<span class="sk-cat">${escapeHtml(meta)}</span>` : ''}
        </header>
        <div class="sk-body">
          <figure class="sk-figure${multi ? ' is-multi' : ''}">
            <span class="sk-tape" aria-hidden="true"></span>
            <div class="sk-frame">${shot}</div>
            <figcaption class="sk-caption">
              <span class="sk-note">${escapeHtml(defaultNote)}</span>
              ${dots}
            </figcaption>
          </figure>
          <div class="sk-details">
            ${p.status ? `<span class="sk-stamp">${escapeHtml(p.status)}</span>` : ''}
            <h3 class="sk-title">${escapeHtml(p.title)}</h3>
            ${p.summary ? `<p class="sk-summary">${escapeHtml(p.summary)}</p>` : ''}
            ${tags}
            ${links}
          </div>
        </div>
      </article>`;
  }

  /* ---------- photo slideshow inside one project ---------- */
  function initGallery(fig) {
    const shot = fig.querySelector('[data-slides]');
    if (!shot) return;
    const slides = [...shot.querySelectorAll('.sk-slide')];
    const n = slides.length;
    if (n < 2) return;

    const dots = [...fig.querySelectorAll('.sk-dot')];
    const note = fig.querySelector('.sk-note');
    const defaultNote = note ? note.textContent : '';
    let cur = 0;
    let timer = 0;
    let hovering = false;
    let visible = false;

    function go(i, dir) {
      i = (i + n) % n;
      if (i === cur) return;
      dir = dir || (i > cur ? 1 : -1);
      const incoming = slides[i];
      const outgoing = slides[cur];

      // park the incoming photo on its entry side (no animation), then slide it in
      incoming.style.transition = 'none';
      incoming.dataset.pos = dir > 0 ? 'right' : 'left';
      void incoming.offsetWidth;
      incoming.style.transition = '';
      incoming.dataset.pos = 'active';
      outgoing.dataset.pos = dir > 0 ? 'left' : 'right';

      cur = i;
      dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === cur);
        if (k === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (note) note.textContent = slides[cur].dataset.caption || defaultNote;
    }

    function stop() { clearInterval(timer); timer = 0; }
    function start() {
      if (AUTOPLAY_MS <= 0 || reduceMotion || timer || hovering || !visible || document.hidden) return;
      timer = setInterval(() => go(cur + 1, 1), AUTOPLAY_MS);
    }
    function restart() { stop(); start(); }

    fig.querySelector('.sk-arrow--prev').addEventListener('click', () => { go(cur - 1, -1); restart(); });
    fig.querySelector('.sk-arrow--next').addEventListener('click', () => { go(cur + 1, 1); restart(); });
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); restart(); }));

    fig.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(cur - 1, -1); restart(); }
      if (e.key === 'ArrowRight') { go(cur + 1, 1); restart(); }
    });

    // swipe
    let startX = null;
    shot.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    shot.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); restart(); }
      startX = null;
    });

    // pause while the visitor is looking at / using it
    fig.addEventListener('mouseenter', () => { hovering = true; stop(); });
    fig.addEventListener('mouseleave', () => { hovering = false; start(); });
    fig.addEventListener('focusin', () => { hovering = true; stop(); });
    fig.addEventListener('focusout', () => { hovering = false; start(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    // only run while the page is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
      }, { threshold: 0.25 }).observe(fig);
    } else {
      visible = true;
      start();
    }
  }

  /* ---------- render into every [data-projects] container ---------- */
  function renderInto(el, all) {
    const limit = parseInt(el.dataset.limit, 10);
    const shown = Number.isFinite(limit) && limit > 0 ? all.slice(0, limit) : all;

    el.innerHTML = shown.length
      ? shown.map(pageHTML).join('')
      : '<p class="empty">Projects coming soon.</p>';

    // a broken photo becomes a friendly placeholder (the slideshow keeps working)
    el.querySelectorAll('.sk-slide img').forEach((img) => {
      const fail = () => {
        const ph = document.createElement('div');
        ph.className = 'sk-missing';
        ph.textContent = 'preview coming soon';
        img.replaceWith(ph);
      };
      img.addEventListener('error', fail, { once: true });
      if (img.complete && img.naturalWidth === 0) fail();
    });

    el.querySelectorAll('.sk-figure').forEach(initGallery);

    // soft reveal on scroll
    const revealEls = el.querySelectorAll('[data-reveal]');
    if (revealEls.length) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
          });
        }, { threshold: 0.12 });
        revealEls.forEach((n) => io.observe(n));
      } else {
        revealEls.forEach((n) => n.classList.add('is-in'));
      }
    }
    return shown.length;
  }

  /* ---------- page shell for all-projects.html (no navigation.js there) ---------- */
  function initPageShell() {
    const bar = document.getElementById('topbar');
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('mobileMenu');
    const onScroll = () => bar && bar.classList.toggle('is-scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (toggle && menu) {
      const set = (open) => {
        toggle.classList.toggle('is-active', open);
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      toggle.addEventListener('click', () => set(!menu.classList.contains('is-open')));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    }
  }

  /* ---------- boot ---------- */
  async function boot() {
    if (document.body.dataset.page === 'all-projects') initPageShell();

    const containers = document.querySelectorAll('[data-projects]');
    if (!containers.length) return;

    let data = [];
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      console.error('Projects: could not load', DATA_URL, err);
    }
    if (!Array.isArray(data)) data = Array.isArray(data && data.projects) ? data.projects : [];
    const all = sortProjects(data);

    containers.forEach((el) => {
      const count = renderInto(el, all);

      // homepage footer: "Showing x of y" + View All button
      const more = document.getElementById('projMore');
      const note = document.getElementById('projMoreNote');
      if (more && el.id === 'projectList') {
        more.hidden = all.length === 0;
        if (note) {
          note.textContent = count < all.length
            ? `showing ${count} of ${all.length} pages ♡`
            : `that's everything so far ♡`;
        }
      }
    });
  }

  boot();
})();