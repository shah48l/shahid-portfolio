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
      const playing = AmbientMusic.toggle();
      btn.classList.toggle('active', playing);
      btn.querySelector('.music-toggle__label').textContent = playing ? 'Ambient On' : 'Ambient Off';
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

    // 2. Sounds
    SoundManager.bindUI();
    _bindSoundToggle();
    _bindMusicToggle();

    // 3. Ambient Music auto-start on first interaction
    if (typeof AmbientMusic !== 'undefined') {
      document.addEventListener('click', () => {
        if (!AmbientMusic.isActive()) {
          AmbientMusic.play();
        }
      }, { once: true });
    }

    // 4. GSAP animations
    Animations.init();
    _fixSkillCardHover();

    // 5. Navigation
    Navigation.init();

    // 6. Terminal
    Terminal.start('terminalBody', 800);

    // 7. Effects + magnetic + project hover
    _magneticButtons();
    Effects.init();
    if (typeof ProjectEffects !== 'undefined') {
      ProjectEffects.init();
    }

    console.log('%c✦ shahid.dev loaded', 'color:#00ffaa;font-family:monospace;font-size:14px;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
