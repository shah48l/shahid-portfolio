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

    // 2. Sounds - enable by default
    SoundManager.bindUI();
    SoundManager.enable(); // Turn SFX on by default
    _bindSoundToggle();
    
    // Update the toggle button UI to show it's on
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.classList.add('active');
      const label = soundToggle.querySelector('.label');
      if (label) label.textContent = 'SFX On';
    }

    _bindMusicToggle();

    // 3. Jazz Music auto-start on landing page (with user gesture)
    if (typeof JazzPlayer !== 'undefined') {
      // Start jazz music after a brief delay post-loader
      setTimeout(() => {
        JazzPlayer.play();
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
          musicToggle.classList.add('active');
          const label = musicToggle.querySelector('.music-toggle__label');
          if (label) label.textContent = 'Jazz On';
        }
      }, 1200);
      JazzPlayer.bindAutoStart();
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
