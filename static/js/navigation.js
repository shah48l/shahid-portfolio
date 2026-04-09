/* ==========================================================================
   NAVIGATION MODULE — Scroll-responsive nav, smooth scroll, progress bar
   Pattern: Mediator (coordinates scroll events → multiple UI updates)
   ========================================================================== */

const Navigation = (() => {
  'use strict';

  let _nav, _progressBar;
  let _lastScrollY = 0;
  let _ticking = false;

  function init() {
    _nav = document.getElementById('navbar');
    _progressBar = document.querySelector('.scroll-progress');
    if (!_nav) return;

    window.addEventListener('scroll', _onScroll, { passive: true });
    _bindSmoothScroll();
  }

  function _onScroll() {
    if (_ticking) return;
    _ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY;

      // Hide/show nav
      if (y > _lastScrollY && y > 80) {
        _nav.classList.add('nav--hidden');
      } else {
        _nav.classList.remove('nav--hidden');
      }
      _lastScrollY = y;

      // Progress bar
      if (_progressBar) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? y / total : 0;
        _progressBar.style.transform = `scaleX(${pct})`;
      }

      _ticking = false;
    });
  }

  function _bindSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        // GSAP smooth scroll
        gsap.to(window, {
          scrollTo: { y: target, offsetY: 80 },
          duration: 1,
          ease: 'expo.inOut',
        });

        SoundManager.playClick();
      });
    });
  }

  return { init };
})();
