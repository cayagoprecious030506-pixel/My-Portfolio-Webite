document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('aboutGallery');

    if (!gallery) {
        console.warn('About gallery not found.');
        return;
    }

    const stage = gallery.querySelector('.gallery-stage');
    const frames = [...gallery.querySelectorAll('.frame')];

    if (!stage || frames.length === 0) {
        console.warn('Gallery stage or photos not found.');
        return;
    }

    const AUTOPLAY_MS = 3800; // time between slides; set to 0 to turn autoplay off
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const total = frames.length;
    let current = 0;
    let startX = null;
    let startY = null;
    let movedBySwipe = false;

    /* =====================================
       UPDATE GALLERY POSITIONS
    ===================================== */

    function render() {
        frames.forEach((frame, index) => {
            let distance = (index - current + total) % total;

            if (distance > total / 2) {
                distance -= total;
            }

            frame.classList.remove(
                'is-active',
                'is-prev',
                'is-next',
                'is-hidden-l',
                'is-hidden-r'
            );

            if (distance === 0) {
                frame.classList.add('is-active');
            } else if (distance === -1) {
                frame.classList.add('is-prev');
            } else if (distance === 1) {
                frame.classList.add('is-next');
            } else if (distance < 0) {
                frame.classList.add('is-hidden-l');
            } else {
                frame.classList.add('is-hidden-r');
            }

            const isVisible = Math.abs(distance) <= 1;

            frame.setAttribute('role', 'button');
            frame.setAttribute(
                'aria-label',
                `Photo ${index + 1} of ${total}. ${
                    distance === 0
                        ? 'Currently selected.'
                        : 'Click to bring this photo forward.'
                }`
            );
            frame.setAttribute('aria-hidden', String(!isVisible));
            frame.setAttribute('tabindex', isVisible ? '0' : '-1');
            frame.setAttribute('aria-pressed', String(distance === 0));
        });
    }

    /* =====================================
       SELECT A PHOTO
    ===================================== */

    function goTo(index) {
        current = (index + total) % total;
        render();
    }

    /* =====================================
       AUTOPLAY (gentle, pauses when needed)
    ===================================== */

    let timer = 0;
    let hovering = false;
    let visible = false;

    const stop = () => { clearInterval(timer); timer = 0; };

    const start = () => {
        if (AUTOPLAY_MS <= 0 || reduceMotion || timer || hovering || !visible || document.hidden || total < 2) return;
        timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
    };

    const restart = () => { stop(); start(); };

    gallery.addEventListener('mouseenter', () => { hovering = true; stop(); });
    gallery.addEventListener('mouseleave', () => { hovering = false; start(); });
    gallery.addEventListener('focusin', () => { hovering = true; stop(); });
    gallery.addEventListener('focusout', () => { hovering = false; start(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    // only run while the gallery is on screen
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                visible = e.isIntersecting;
                if (visible) start(); else stop();
            });
        }, { threshold: 0.25 }).observe(gallery);
    } else {
        visible = true;
    }

    /* =====================================
       CLICK LEFT OR RIGHT PHOTO
    ===================================== */

    stage.addEventListener('click', (event) => {
        if (movedBySwipe) {
            movedBySwipe = false;
            return;
        }

        const clickedFrame = event.target.closest('.frame');
        if (!clickedFrame) return;

        const selectedIndex = frames.indexOf(clickedFrame);
        if (selectedIndex === -1) return;

        goTo(selectedIndex);
        restart();
    });

    /* =====================================
       KEYBOARD ACCESSIBILITY
    ===================================== */

    frames.forEach((frame) => {
        frame.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();

                const selectedIndex = frames.indexOf(frame);

                if (selectedIndex !== -1) {
                    goTo(selectedIndex);
                    frames[selectedIndex].focus();
                    restart();
                }
            }
        });
    });

    gallery.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(current - 1);
            restart();
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(current + 1);
            restart();
        }
    });

    /* =====================================
       MOBILE SWIPE SUPPORT
    ===================================== */

    stage.addEventListener('pointerdown', (event) => {
        startX = event.clientX;
        startY = event.clientY;
        movedBySwipe = false;
    });

    stage.addEventListener('pointerup', (event) => {
        if (startX === null) return;

        const diffX = event.clientX - startX;
        const diffY = event.clientY - startY;

        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
            movedBySwipe = true;
            goTo(current + (diffX < 0 ? 1 : -1));
            restart();
        }

        startX = null;
        startY = null;
    });

    stage.addEventListener('pointercancel', () => {
        startX = null;
        startY = null;
    });

    /* =====================================
       INITIALIZE GALLERY
    ===================================== */

    gallery.classList.add('is-ready');
    render();
    start();
});