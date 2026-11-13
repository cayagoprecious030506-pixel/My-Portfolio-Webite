const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
const loadJSON = (path) => fetch(path).then((r) => r.json()).catch(() => []);
const EXT_ICON = '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>';

/* =====================================================
   SCROLL FADE-IN
===================================================== */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // what fades in as you scroll down
  const TARGETS = [
    '.section-head',
    '#about .about-gallery',
    '#about .about-narrative',
    '.education-card',
    '.tech-page',
    '.sk-more-row',
    '.cert-showcase',
    '.contact-grid > *',
    '.contact-note',
    '.footer'
  ];

  const STAGGER = 0.14;   // seconds between items in the same group
  const MAX_DELAY = 0.42;
  const DURATION = 1100;  // must match the 1.1s in the CSS

  document.documentElement.classList.add('js');

  const els = [...new Set(TARGETS.flatMap((s) => [...document.querySelectorAll(s)]))];

  // stagger siblings (for example the two About columns or the two education cards)
  const seen = new Map();
  els.forEach((el) => {
    const idx = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, idx + 1);
    el.style.setProperty('--rv-delay', `${Math.min(idx * STAGGER, MAX_DELAY).toFixed(2)}s`);
    el.classList.add('reveal');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add('is-in');

      // when finished, hand control back to the element's own styles (hover effects etc.)
      const wait = DURATION + parseFloat(el.style.getPropertyValue('--rv-delay') || 0) * 1000 + 150;
      setTimeout(() => {
        el.classList.remove('reveal', 'is-in');
        el.style.removeProperty('--rv-delay');
      }, wait);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  els.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  const year = $('currentYear');
  if (year) year.textContent = new Date().getFullYear();

  // Theme (light by default)
  const root = document.documentElement;
  const apply = (t) => root.setAttribute('data-theme', t);
  apply(store.get('theme') || 'light');

  const themeToggle = $('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      window.animateThemeChange(() => { apply(next); store.set('theme', next); }, e.currentTarget);
    });
  }

  // Portrait video: hover on desktop, tap on touch
  const portrait = document.querySelector('.landing-portrait');
  const pv = portrait?.querySelector('.portrait-video');

  if (portrait && pv) {
    const play = async () => {
      portrait.classList.add('is-playing');
      try {
        await pv.play();
      } catch (error) {
        portrait.classList.remove('is-playing');
      }
    };

    const stop = () => {
      portrait.classList.remove('is-playing');
      pv.pause();
      pv.currentTime = 0;
    };

    // Desktop hover
    if (window.matchMedia('(hover: hover)').matches) {
      portrait.addEventListener('mouseenter', play);
      portrait.addEventListener('mouseleave', stop);
    }

    // Touch interaction
    if (window.matchMedia('(hover: none)').matches) {
      portrait.addEventListener('click', () => {
        if (portrait.classList.contains('is-playing')) stop(); else play();
      });
    }
  }

  // Scroll fade-in
  initScrollReveal();

  // CONTACT FORM — FORMSPREE
  const contactForm = $('contactForm');
  const submitBtn = contactForm?.querySelector('button[type="submit"]');
  const submitText = $('submitText');
  const formStatus = $('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!contactForm.reportValidity()) return;

      submitBtn.disabled = true;

      if (submitText) {
        submitText.textContent = 'Sending...';
      }

      if (formStatus) {
        formStatus.textContent = '';
      }

      try {
        const response = await fetch(
          'https://formspree.io/f/xoedvraj',
          {
            method: 'POST',
            body: new FormData(contactForm),
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Message submission failed.');
        }

        if (formStatus) {
          formStatus.textContent =
            'Your message has been sent successfully! ♡';

          formStatus.style.color = '#52785A';
        }

        contactForm.reset();

      } catch (error) {
        console.error('Contact form error:', error);

        if (formStatus) {
          formStatus.textContent =
            'Unable to send your message. Please try again.';

          formStatus.style.color = '#A34B42';
        }

      } finally {
        submitBtn.disabled = false;

        if (submitText) {
          submitText.textContent = 'Send Message';
        }
      }
    });
  }
});