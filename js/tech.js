(() => {
  'use strict';

  const DATA_URL = 'data/technologies.json';
  const SPEED = 36;        // scroll speed in pixels per second (lower = slower)
  const ICON_COLOR = '3f2417'; // icon color, matches your brown
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  // "icon" can be a brand name from simpleicons.org ("python") or a path to your own file
  function iconSrc(icon) {
    if (!icon) return '';
    return /[./]/.test(icon) ? icon : `https://cdn.simpleicons.org/${encodeURIComponent(icon)}/${ICON_COLOR}`;
  }

  function chipHTML(item) {
    const it = typeof item === 'string' ? { name: item } : item || {};
    const name = String(it.name || '').trim();
    if (!name) return '';
    const letter = escapeHtml(name.charAt(0).toUpperCase());
    const src = iconSrc(it.icon);
    const icon = src
      ? `<img class="tech-icon" src="${escapeHtml(src)}" alt="" width="18" height="18" loading="lazy" draggable="false" data-letter="${letter}">`
      : `<span class="tech-mono" aria-hidden="true">${letter}</span>`;
    return `<li class="tech-chip">${icon}<span>${escapeHtml(name)}</span></li>`;
  }

  function rowHTML(cat, i) {
    const items = Array.isArray(cat.items) ? cat.items : [];
    const chips = items.map(chipHTML).filter(Boolean);
    if (!chips.length) return '';
    const dir = cat.direction === 'right' || cat.direction === 'left' ? cat.direction : (i % 2 ? 'right' : 'left');
    return `
      <section class="tech-row" aria-label="${escapeHtml(cat.category || 'Tools')}">
        <div class="tech-head">
          <h3 class="tech-label">${escapeHtml(cat.category || 'Tools')}</h3>
          <span class="tech-rule" aria-hidden="true"></span>
          <span class="tech-count">${pad(chips.length)} tools</span>
        </div>
        <div class="tech-window" data-dir="${dir}" data-speed="${SPEED * (1 + (i % 3) * 0.18)}">
          <div class="tech-track">
            <ul class="tech-group">${chips.join('')}</ul>
          </div>
        </div>
      </section>`;
  }

  // repeat the group so the strip never runs out, then loop it seamlessly
  function setupMarquee(win) {
    if (reduceMotion) return;
    const track = win.querySelector('.tech-track');
    const group = track.querySelector('.tech-group:not([data-clone])');
    if (!group) return;

    track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
    const w = group.getBoundingClientRect().width;
    if (!w) return;

    const copies = Math.ceil(win.clientWidth / w);
    for (let i = 0; i < copies; i++) {
      const clone = group.cloneNode(true);
      clone.setAttribute('data-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
    win.style.setProperty('--shift', `${w}px`);
    win.style.setProperty('--dur', `${(w / (parseFloat(win.dataset.speed) || SPEED)).toFixed(2)}s`);
  }

  async function boot() {
    const board = document.querySelector('[data-tech]');
    if (!board) return;

    let data = [];
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      console.error('Technologies: could not load', DATA_URL, err);
    }
    if (!Array.isArray(data)) data = Array.isArray(data && data.categories) ? data.categories : [];

    const html = data.map(rowHTML).join('');
    if (!html) {
      board.insertAdjacentHTML('beforeend', '<p class="empty" style="padding:0 24px">Technologies coming soon.</p>');
      return;
    }
    board.insertAdjacentHTML('beforeend', html + '<p class="tech-foot">always learning, always adding to this list ♡</p>');

    // a missing icon becomes a small letter badge
    board.addEventListener('error', (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.classList.contains('tech-icon')) return;
      const badge = document.createElement('span');
      badge.className = 'tech-mono';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = img.dataset.letter || '•';
      img.replaceWith(badge);
    }, true);

    const windows = [...board.querySelectorAll('.tech-window')];
    const setupAll = () => windows.forEach(setupMarquee);
    setupAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setupAll);

    let t = 0;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(setupAll, 200); });
  }

  boot();
})();