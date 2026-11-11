const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const loadJSON = (path) => fetch(path).then((r) => r.json()).catch(() => []);
const EXT_ICON = '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>';

document.addEventListener('DOMContentLoaded', async () => {
  $('currentYear').textContent = new Date().getFullYear();

  // Theme (light by default)
  const root = document.documentElement;
  const apply = (t) => root.setAttribute('data-theme', t);
  apply(store.get('theme') || 'light');
  $('themeToggle').addEventListener('click', (e) => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    window.animateThemeChange(() => { apply(next); store.set('theme', next); }, e.currentTarget);
  });

  // Portrait video: hover on desktop, tap on touch
  const portrait = document.querySelector('.landing-portrait');
  const pv = portrait?.querySelector('.portrait-video');
  if (portrait && pv) {
    const play = () => { portrait.classList.add('is-playing'); pv.play().catch(() => {}); };
    const stop = () => { portrait.classList.remove('is-playing'); pv.pause(); pv.currentTime = 0; };
    portrait.addEventListener('mouseenter', play);
    portrait.addEventListener('mouseleave', stop);
    portrait.addEventListener('click', () => (portrait.classList.contains('is-playing') ? stop() : play()));
  }

  // Certifications
  const certs = await loadJSON('data/certifications.json');
  $('certGrid').innerHTML = certs.map((c) => `
    <article class="card">
      <div class="card-img"><img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy" onerror="this.remove()"></div>
      <div class="card-foot">
        <div><h3 class="card-title">${esc(c.title)}</h3><p class="card-meta">${esc([c.issuer, c.date].filter(Boolean).join(' · '))}</p></div>
        ${c.pdf ? `<a class="card-ext" href="${esc(c.pdf)}" target="_blank" rel="noopener" aria-label="Open certificate">${EXT_ICON}</a>` : ''}
      </div>
    </article>`).join('') || '<p class="empty">Certificates coming soon.</p>';
});
