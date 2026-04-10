/* ==========================================================================
   JAZZ PLAYER — Smooth Late-Night Jazz via Web Audio API
   Rhodes-style electric piano, walking bass, brushed ride, & improv solos
   ========================================================================== */

const JazzPlayer = (() => {
  'use strict';

  let _ctx = null, _playing = false, _masterGain = null, _intervals = [], _nodes = [];
  let _pendingAutoStart = true;

  /* ── Chord voicings (Cm9 → Fm9 → Dm7b5 → G7alt style) ── */
  const PROGRESSIONS = [
    // Progression A — Chill modal (Dorian flavour)
    [
      [130.81, 155.56, 196.00, 233.08, 293.66],  // Cm9
      [174.61, 207.65, 261.63, 311.13, 392.00],  // Fm9
      [146.83, 174.61, 220.00, 261.63, 311.13],  // Dm7b5
      [196.00, 246.94, 293.66, 369.99, 466.16],  // G7#9
    ],
    // Progression B — II-V-I-vi in Bb
    [
      [146.83, 174.61, 220.00, 261.63, 329.63],  // Cm7
      [196.00, 246.94, 311.13, 369.99, 440.00],  // F13
      [116.54, 146.83, 174.61, 220.00, 261.63],  // BbMaj9
      [196.00, 233.08, 293.66, 349.23, 440.00],  // Gm9
    ],
    // Progression C — Smoky ballad (Eb → AbMaj7 → Db → Gb)
    [
      [155.56, 196.00, 233.08, 293.66, 349.23],  // EbMaj7
      [207.65, 261.63, 311.13, 392.00, 466.16],  // AbMaj7
      [138.59, 174.61, 207.65, 261.63, 329.63],  // Db9
      [185.00, 233.08, 277.18, 349.23, 415.30],  // Gb6/9
    ],
  ];

  /* ── Solo scale (C Dorian + blue notes) ── */
  const SOLO_SCALE = [
    261.63, 293.66, 311.13, 329.63, 349.23, 392.00, 440.00,
    466.16, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46,
  ];

  function _getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  /* ── Rhodes-style electric piano chord ── */
  function _playRhodes(frequencies, startTime, duration) {
    const ctx = _getCtx();
    frequencies.forEach((freq, i) => {
      // Main tone — sine with slight harmonic overtone
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 2.001, startTime); // slight detune shimmer

      // Vibrato
      const vib = ctx.createOscillator(), vGain = ctx.createGain();
      vib.frequency.value = 3.5 + Math.random() * 1.5;
      vGain.gain.value = 1.2 + Math.random();
      vib.connect(vGain).connect(osc.frequency);

      // Tremolo (Rhodes tine character)
      const trem = ctx.createOscillator(), tremGain = ctx.createGain();
      trem.frequency.value = 5.2; tremGain.gain.value = 0.003;

      // Warmth filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 600, startTime);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + duration);
      filter.Q.value = 0.5;

      // Envelope — soft attack, gentle sustain, warm release
      const gain = ctx.createGain();
      const vol = 0.014 + Math.random() * 0.004;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
      gain.gain.setValueAtTime(vol * 0.8, startTime + 0.12);
      gain.gain.linearRampToValueAtTime(vol * 0.4, startTime + duration * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const gain2 = ctx.createGain();
      gain2.gain.value = 0.004; // overtone much quieter

      osc.connect(filter).connect(gain).connect(_masterGain);
      osc2.connect(gain2).connect(filter);
      trem.connect(tremGain).connect(gain.gain);

      osc.start(startTime); osc.stop(startTime + duration + 0.1);
      osc2.start(startTime); osc2.stop(startTime + duration + 0.1);
      vib.start(startTime); vib.stop(startTime + duration + 0.5);
      trem.start(startTime); trem.stop(startTime + duration + 0.1);

      _nodes.push(osc, osc2, vib, trem);
    });
  }

  /* ── Walking bass line ── */
  function _playWalkingBass(rootFreq, startTime, beatDur) {
    const ctx = _getCtx();
    // Walk through root, fifth, chromatic approach, octave
    const walk = [
      rootFreq / 2,
      rootFreq / 2 * 1.5,           // fifth
      rootFreq / 2 * (1 + Math.random() * 0.3), // chromatic wander
      rootFreq / 2 * (Math.random() > 0.5 ? 2 : 0.94), // octave or leading tone
    ];

    walk.forEach((freq, b) => {
      const t = startTime + b * beatDur;
      const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      // Slight slide between notes
      if (b < 3) osc.frequency.exponentialRampToValueAtTime(walk[b + 1] || freq, t + beatDur * 0.95);

      filter.type = 'lowpass'; filter.frequency.value = 350; filter.Q.value = 1.2;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.045, t + 0.02);
      gain.gain.setValueAtTime(0.035, t + beatDur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 0.92);

      osc.connect(filter).connect(gain).connect(_masterGain);
      osc.start(t); osc.stop(t + beatDur);
      _nodes.push(osc);
    });
  }

  /* ── Brushed ride cymbal ── */
  function _playRide(startTime) {
    const ctx = _getCtx();
    const dur = 0.08 + Math.random() * 0.04;
    const bs = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bs, 3);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = 7000 + Math.random() * 4000; f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.012 + Math.random() * 0.008, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    s.connect(f).connect(g).connect(_masterGain); s.start(startTime);
  }

  /* ── Ghost snare (brush tap) ── */
  function _playGhostSnare(startTime) {
    const ctx = _getCtx();
    const bs = Math.floor(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bs, 5);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.018, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
    s.connect(f).connect(g).connect(_masterGain); s.start(startTime);
  }

  /* ── Solo improvised melody note ── */
  function _playSoloNote(startTime, duration) {
    const ctx = _getCtx();
    const freq = SOLO_SCALE[Math.floor(Math.random() * SOLO_SCALE.length)];
    const osc = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.type = Math.random() > 0.6 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    // Bend into note
    osc.frequency.setValueAtTime(freq * (0.97 + Math.random() * 0.02), startTime);
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.06);

    filter.type = 'lowpass'; filter.frequency.value = 1800 + Math.random() * 800; filter.Q.value = 0.5;

    const vol = 0.02 + Math.random() * 0.01;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter).connect(gain).connect(_masterGain);
    osc.start(startTime); osc.stop(startTime + duration + 0.05);
    _nodes.push(osc);
  }

  /* ── Main scheduling loop ── */
  function _startLoop() {
    const ctx = _getCtx();
    const bpm = 66 + Math.floor(Math.random() * 12); // 66-78 bpm, varies
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    function scheduleSection() {
      if (!_playing) return;
      const prog = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
      let time = ctx.currentTime + 0.05;

      prog.forEach((chord, ci) => {
        const cs = time + ci * barDur;

        // Rhodes chord — sometimes stagger (spread voicing)
        _playRhodes(chord, cs + (Math.random() > 0.7 ? 0.04 : 0), barDur * 0.88);

        // Walking bass
        _playWalkingBass(chord[0], cs, beatDur);

        // Drums — swing ride pattern
        for (let b = 0; b < 4; b++) {
          const bt = cs + b * beatDur;
          _playRide(bt);                                    // on-beat ride
          if (b !== 0) _playRide(bt + beatDur * 0.66);      // swing skip
          if (b === 1 || b === 3) _playGhostSnare(bt);      // ghost on 2 & 4
          if (Math.random() > 0.65) _playGhostSnare(bt + beatDur * 0.5); // random ghost
        }

        // Solo — 30% chance per bar, a few notes
        if (Math.random() > 0.7) {
          const soloCount = 2 + Math.floor(Math.random() * 4);
          for (let s = 0; s < soloCount; s++) {
            const offset = Math.random() * barDur * 0.8;
            const dur = 0.2 + Math.random() * 0.5;
            _playSoloNote(cs + offset, dur);
          }
        }
      });

      const sectionLen = prog.length * barDur * 1000;
      const id = setTimeout(scheduleSection, sectionLen - 300);
      _intervals.push(id);
    }

    scheduleSection();
  }

  function start() {
    if (_playing) return;
    _playing = true;
    const ctx = _getCtx();
    _masterGain = ctx.createGain();
    _masterGain.gain.setValueAtTime(0, ctx.currentTime);
    _masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2);
    _masterGain.connect(ctx.destination);
    _startLoop();
  }

  function stop() {
    _playing = false;
    _intervals.forEach(clearTimeout); _intervals = [];
    if (_masterGain && _ctx) {
      _masterGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 0.8);
      setTimeout(() => {
        _nodes.forEach(n => { try { n.stop(); } catch (e) {} });
        _nodes = [];
      }, 900);
    }
  }

  function toggle() { if (_playing) stop(); else start(); return _playing; }
  function isActive() { return _playing; }

  /* ── Auto-start on first user gesture (browser policy) ── */
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

  return { toggle, start, stop, isActive, bindAutoStart };
})();
