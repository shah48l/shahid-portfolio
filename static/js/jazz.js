const JazzPlayer = (() => {
  'use strict';
  let _ctx = null, _playing = false, _masterGain = null, _intervals = [], _oscillators = [];
  let _pendingAutoStart = true; // Auto-start after first user gesture

  const PROGRESSIONS = [
    [[146.83,174.61,220,261.63],[196,246.94,293.66,349.23],[130.81,164.81,196,246.94],[220,261.63,329.63,392]],
    [[164.81,196,246.94,293.66],[220,277.18,329.63,392],[146.83,185,220,277.18],[246.94,293.66,369.99,440]],
  ];

  function _getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  function _playChord(frequencies, startTime, duration) {
    const ctx = _getCtx();
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'; osc.frequency.setValueAtTime(freq, startTime);
      const vib = ctx.createOscillator(), vg = ctx.createGain();
      vib.frequency.value = 4 + Math.random() * 2; vg.gain.value = 1.5;
      vib.connect(vg).connect(osc.frequency); vib.start(startTime); vib.stop(startTime + duration + 0.5);
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(800 + Math.random() * 400, startTime); filter.Q.value = 0.7;
      const vol = 0.018 + Math.random() * 0.006;
      gain.gain.setValueAtTime(0, startTime); gain.gain.linearRampToValueAtTime(vol, startTime + 0.08);
      gain.gain.setValueAtTime(vol * 0.7, startTime + 0.15); gain.gain.linearRampToValueAtTime(vol * 0.5, startTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(filter).connect(gain).connect(_masterGain);
      osc.start(startTime); osc.stop(startTime + duration + 0.1); _oscillators.push(osc, vib);
    });
  }

  function _playBrush(startTime) {
    const ctx = _getCtx(); const bs = ctx.sampleRate * 0.06;
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bs, 4);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000 + Math.random() * 3000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.015 + Math.random() * 0.01, startTime); g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
    s.connect(f).connect(g).connect(_masterGain); s.start(startTime);
  }

  function _playBass(freq, startTime, duration) {
    const ctx = _getCtx(); const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq / 2, startTime);
    filter.type = 'lowpass'; filter.frequency.value = 300;
    gain.gain.setValueAtTime(0, startTime); gain.gain.linearRampToValueAtTime(0.04, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);
    osc.connect(filter).connect(gain).connect(_masterGain);
    osc.start(startTime); osc.stop(startTime + duration); _oscillators.push(osc);
  }

  function _startLoop() {
    const ctx = _getCtx(); const bpm = 72; const beatDur = 60 / bpm; const barDur = beatDur * 4;
    function scheduleBar() {
      if (!_playing) return;
      const progression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
      let time = ctx.currentTime + 0.05;
      progression.forEach((chord, ci) => {
        const cs = time + ci * barDur;
        _playChord(chord, cs, barDur * 0.9);
        for (let b = 0; b < 4; b++) {
          _playBass(chord[b % chord.length], cs + b * beatDur, beatDur * 0.85);
          if (b === 1 || b === 3) _playBrush(cs + b * beatDur);
          if (Math.random() > 0.5) _playBrush(cs + b * beatDur + beatDur * 0.5);
        }
      });
      const id = setTimeout(scheduleBar, progression.length * barDur * 1000 - 200); _intervals.push(id);
    }
    scheduleBar();
  }

  function start() {
    if (_playing) return; _playing = true;
    const ctx = _getCtx();
    _masterGain = ctx.createGain();
    _masterGain.gain.setValueAtTime(0, ctx.currentTime);
    _masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    _masterGain.connect(ctx.destination);
    _startLoop();
  }

  function stop() {
    _playing = false; _intervals.forEach(clearTimeout); _intervals = [];
    if (_masterGain && _ctx) {
      _masterGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 0.5);
      setTimeout(() => { _oscillators.forEach(o => { try { o.stop(); } catch(e) {} }); _oscillators = []; }, 600);
    }
  }

  function toggle() { if (_playing) stop(); else start(); return _playing; }
  function isPlaying() { return _playing; }

  // Auto-start on first user gesture (required by browsers)
  function tryAutoStart() {
    if (!_pendingAutoStart) return;
    _pendingAutoStart = false;
    start();
    // Update UI
    const btn = document.getElementById('musicToggle');
    if (btn) { btn.classList.add('active'); const lbl = btn.querySelector('.music-toggle__label'); if (lbl) lbl.textContent = 'Jazz On'; }
    // Remove listeners
    document.removeEventListener('click', tryAutoStart);
    document.removeEventListener('touchstart', tryAutoStart);
    document.removeEventListener('keydown', tryAutoStart);
  }

  function bindAutoStart() {
    document.addEventListener('click', tryAutoStart, { once: false });
    document.addEventListener('touchstart', tryAutoStart, { once: false });
    document.addEventListener('keydown', tryAutoStart, { once: false });
  }

  return { toggle, start, stop, isPlaying, bindAutoStart };
})();
