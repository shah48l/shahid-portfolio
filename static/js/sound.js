/* ==========================================================================
   SOUND MANAGER — Web Audio API Synthesized Sounds
   Pattern: Singleton + Facade
   ========================================================================== */

const SoundManager = (() => {
  'use strict';

  let _ctx = null;
  let _enabled = false;
  let _initialized = false;

  function _getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  function playHover() {
    if (!_enabled) return;
    const ctx = _getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
  }

  function playClick() {
    if (!_enabled) return;
    const ctx = _getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  }

  function playSwoosh() {
    if (!_enabled) return;
    const ctx = _getCtx();
    const dur = 0.3;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(2500, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + dur); f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.025, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(ctx.currentTime); src.stop(ctx.currentTime + dur);
  }

  function playKeystroke() {
    if (!_enabled) return;
    const ctx = _getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000 + Math.random() * 1500, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.03);
  }

  function playCardFlip() {
    if (!_enabled) return;
    const ctx = _getCtx();
    [600, 900].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.04;
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.1);
    });
  }

  let _lastTick = 0;
  function playScrollTick() {
    if (!_enabled) return;
    const now = Date.now();
    if (now - _lastTick < 150) return;
    _lastTick = now;
    const ctx = _getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 1200 + Math.random() * 400;
    gain.gain.setValueAtTime(0.008, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.025);
  }

  function playNavWhoosh() {
    if (!_enabled) return;
    const ctx = _getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  }

  function playBootChime() {
    if (!_enabled) return;
    const ctx = _getCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.5);
    });
  }

  function enable() {
    if (_enabled) return true;
    _enabled = true;
    playBootChime();
    return _enabled;
  }

  function toggle() { _enabled = !_enabled; if (_enabled) playBootChime(); return _enabled; }
  function isEnabled() { return _enabled; }

  function bindUI() {
    if (_initialized) return;
    _initialized = true;
    document.querySelectorAll('a, button, .btn, .skill-card, .contact__link, .nav__link').forEach(el => {
      el.addEventListener('mouseenter', playHover);
    });
    document.querySelectorAll('a, button, .btn').forEach(el => {
      el.addEventListener('click', playClick);
    });
    document.querySelectorAll('.skill-card').forEach(el => {
      el.addEventListener('mouseenter', playCardFlip);
    });
    window.addEventListener('scroll', playScrollTick, { passive: true });
  }

  return {
    enable, toggle, isEnabled, playHover, playClick, playSwoosh, playKeystroke,
    playCardFlip, playScrollTick, playNavWhoosh, playBootChime, bindUI,
  };
})();
