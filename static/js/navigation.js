/* ==========================================================================
   NAVIGATION MODULE — Scroll-responsive nav, smooth scroll, progress bar,
   scroll-spy active highlighting, mobile hamburger
   ========================================================================== */

const Navigation = (() => {
  'use strict';

  let _nav, _progressBar;
  let _lastScrollY = 0;
  let _ticking = false;
  let _navLinks = [];
  let _sections = [];
  let _hamburger, _navLinksContainer;

  function init() {
    _nav = document.getElementById('navbar');
    _progressBar = document.querySelector('.scroll-progress');
    _hamburger = document.getElementById('navHamburger');
    _navLinksContainer = document.getElementById('navLinks');
    if (!_nav) return;

    // Gather nav links and their target sections
    _navLinks = Array.from(document.querySelectorAll('.nav__link[data-section]'));
    _sections = _navLinks.map(link => {
      const id = link.getAttribute('data-section');
      return document.getElementById(id);
    }).filter(Boolean);

    window.addEventListener('scroll', _onScroll, { passive: true });
    _bindSmoothScroll();
    _bindHamburger();
    _updateActiveLink(); // set initial state
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

      // Scroll-spy: highlight active section
      _updateActiveLink();

      _ticking = false;
    });
  }

  function _updateActiveLink() {
    const scrollY = window.scrollY + 120; // offset for nav height
    let currentId = '';

    _sections.forEach(section => {
      if (section.offsetTop <= scrollY) {
        currentId = section.id;
      }
    });

    _navLinks.forEach(link => {
      const section = link.getAttribute('data-section');
      if (section === currentId) {
        link.classList.add('nav__link--active');
      } else {
        link.classList.remove('nav__link--active');
      }
    });
  }

  function _bindSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        // Close mobile menu if open
        if (_navLinksContainer) {
          _navLinksContainer.classList.remove('nav__links--open');
          if (_hamburger) {
            _hamburger.classList.remove('active');
            _hamburger.setAttribute('aria-expanded', 'false');
          }
        }

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

  function _bindHamburger() {
    if (!_hamburger || !_navLinksContainer) return;

    _hamburger.addEventListener('click', () => {
      const isOpen = _navLinksContainer.classList.toggle('nav__links--open');
      _hamburger.classList.toggle('active', isOpen);
      _hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!_nav.contains(e.target)) {
        _navLinksContainer.classList.remove('nav__links--open');
        _hamburger.classList.remove('active');
        _hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  return { init };
})();
