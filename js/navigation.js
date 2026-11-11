document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  const topbar = document.getElementById('topbar');
  const links = [...document.querySelectorAll('.topnav .nav-link')];
  const sections = [...document.querySelectorAll('section[id]')];
  const pathOf = (id) => (id === 'hero' ? '/' : '/' + id);

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 768) setMenu(false); });

  const goTo = (path, smooth = true) => {
    const id = path.replace(/^\//, '') || 'hero';
    document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/"]');
    if (!a) return;
    e.preventDefault();
    history.pushState({}, '', a.getAttribute('href'));
    goTo(location.pathname);
    setMenu(false);
  });
  addEventListener('popstate', () => goTo(location.pathname));
  addEventListener('load', () => goTo(location.pathname, false));

  const onScroll = () => {
    const y = scrollY;
    topbar.classList.toggle('is-scrolled', y > 40);
    let current = 'hero';
    sections.forEach((s) => { if (y + 140 >= s.getBoundingClientRect().top + y) current = s.id; });
    if (innerHeight + y >= document.documentElement.scrollHeight - 4) current = 'contact';
    links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === pathOf(current)));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
