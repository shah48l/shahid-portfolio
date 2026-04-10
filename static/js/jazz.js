/* ==========================================================================
   JAZZ PLAYER â€” Real royalty-free jazz music playback
   Track: "Lobby Time" by Kevin MacLeod (incompetech.com)
   License: Creative Commons: By Attribution 4.0
   ========================================================================== */

const JazzPlayer = (() => {
  'use strict';

  let _audio = null;
  let _playing = false;
  let _pendingAutoStart = true;
  let _loaded = false;

  const TRACK_URL = '/static/audio/jazz-bg.mp3';

  function _ensureAudio() {
    if (_audio) return _audio;
    _audio = new Audio(TRACK_URL);
    _audio.loop = true;
    _audio.volume = 0;
    _audio.preload = 'auto';

    _audio.addEventListener('canplaythrough', () => { _loaded = true; }, { once: true });
    _audio.addEventListener('ended', () => {
      // Safety: restart if loop fails
      if (_playing) { _audio.currentTime = 0; _audio.play(); }
    });

    return _audio;
  }

  function _fadeIn(duration = 2) {
    const audio = _ensureAudio();
    audio.volume = 0;
    const targetVol = 0.35;
    const steps = 40;
    const stepTime = (duration * 1000) / steps;
    const increment = targetVol / steps;
    let step = 0;

    const fade = setInterval(() => {
      step++;
      audio.volume = Math.min(targetVol, increment * step);
      if (step >= steps) clearInterval(fade);
    }, stepTime);
  }

  function _fadeOut(duration = 1) {
    if (!_audio) return;
    const startVol = _audio.volume;
    const steps = 20;
    const stepTime = (duration * 1000) / steps;
    const decrement = startVol / steps;
    let step = 0;

    const fade = setInterval(() => {
      step++;
      _audio.volume = Math.max(0, startVol - decrement * step);
      if (step >= steps) {
        clearInterval(fade);
        _audio.pause();
      }
    }, stepTime);
  }

  function start() {
    if (_playing) return;
    _playing = true;
    const audio = _ensureAudio();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => { _fadeIn(2.5); })
                 .catch(e => {
                   console.warn('Jazz autoplay blocked:', e.message);
                   _playing = false;
                 });
    }
  }

  function stop() {
    if (!_playing) return;
    _playing = false;
    _fadeOut(1);
  }

  function toggle() {
    if (_playing) stop();
    else start();
    return _playing;
  }

  function isActive() { return _playing; }

  /* â”€â”€ Auto-start on first user gesture (browser policy) â”€â”€ */
  function tryAutoStart() {
    if (!_pendingAutoStart) return;
    _pendingAutoStart = false;
    start();
    const btn = document.getElementById('musicToggle');
    if (btn) {
      btn.classList.add('active');
      const lbl = btn.querySelector('.music-toggle__label');
      if (lbl) lbl.textContent = 'Jazz On';
    }
    document.removeEventListener('click', tryAutoStart);
    document.removeEventListener('touchstart', tryAutoStart);
    document.removeEventListener('keydown', tryAutoStart);
  }

  function bindAutoStart() {
    document.addEventListener('click', tryAutoStart, { once: false });
    document.addEventListener('touchstart', tryAutoStart, { once: false });
    document.addEventListener('keydown', tryAutoStart, { once: false });
  }

  // Start preloading the audio file
  if (typeof window !== 'undefined') {
    _ensureAudio();
  }

  return { toggle, start, stop, isActive, bindAutoStart };
})();
