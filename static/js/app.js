(function App() {
  'use strict';

  function _bindSoundToggle() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const on = SoundManager.toggle();
      btn.classList.toggle('active', on);
      btn.querySelector('.label').textContent = on ? 'SFX On' : 'SFX Off';
    });
  }

  function _bindMusicToggle() {
    const btn = document.getElementById('musicToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const playing = JazzPlayer.toggle();
      btn.classList.toggle('active', playing);
      btn.querySelector('.music-toggle__label').textContent = playing ? 'Jazz On' : 'Jazz Off';
    });
  }

  function _magneticButtons() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.3, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  function _fixSkillCardHover() {
    gsap.utils.toArray('.skill-card').forEach(card => {
      ScrollTrigger.create({
        trigger: card, start: 'top 92%',
        onEnter: () => { gsap.delayedCall(1, () => gsap.set(card, { clearProps: 'transform,opacity' })); },
        once: true,
      });
    });
  }

  async function boot() {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // 1. Loader
    await Loader.init();

    // 2. WebGL Splash Cursor (replaces custom cursor entirely)
    SplashCursor.init();
    const sc = document.getElementById('splashCanvas');
    if (sc) sc.classList.add('interactive');

    // 3. NO custom cursor — splash cursor IS the cursor effect

    // 4. Sounds
    SoundManager.bindUI();
    _bindSoundToggle();
    _bindMusicToggle();

    // 5. Jazz auto-start on first interaction
    JazzPlayer.bindAutoStart();

    // 6. GSAP animations
    Animations.init();
    _fixSkillCardHover();

    // 7. Navigation
    Navigation.init();

    // 8. Terminal
    Terminal.start('terminalBody', 800);

    // 9. Effects + magnetic
    _magneticButtons();
    Effects.init();

    console.log('%c✦ shahid.dev loaded', 'color:#00ffaa;font-family:monospace;font-size:14px;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
