
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

            frame.setAttribute(
                'aria-hidden',
                String(!isVisible)
            );

            frame.setAttribute(
                'tabindex',
                isVisible ? '0' : '-1'
            );

            frame.setAttribute(
                'aria-pressed',
                String(distance === 0)
            );
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
                }
            }
        });
    });

    gallery.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(current - 1);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(current + 1);
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

        if (
            Math.abs(diffX) > 60 &&
            Math.abs(diffX) > Math.abs(diffY)
        ) {
            movedBySwipe = true;

            goTo(current + (diffX < 0 ? 1 : -1));
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

    console.log('About gallery initialized:', total, 'photos');
});
