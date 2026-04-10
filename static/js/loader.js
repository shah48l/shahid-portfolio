const Loader = (() => {
  'use strict';
  const ASCII = `
  ███████╗██╗  ██╗ █████╗ ██╗  ██╗██╗██████╗ 
  ██╔════╝██║  ██║██╔══██╗██║  ██║██║██╔══██╗
  ███████╗███████║███████║███████║██║██║  ██║
  ╚════██║██╔══██║██╔══██║██╔══██║██║██║  ██║
  ███████║██║  ██║██║  ██║██║  ██║██║██████╔╝
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝`;

  /* ── Boot-up Sound Effect (synthesized) ── */
  function _playBootSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);

      // 1. Deep sub-bass hum (power on)
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = 'sine'; sub.frequency.value = 55;
      subG.gain.setValueAtTime(0, ctx.currentTime);
      subG.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
      subG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      sub.connect(subG).connect(master);
      sub.start(ctx.currentTime); sub.stop(ctx.currentTime + 2);

      // 2. Rising sweep (digital init)
      const sweep = ctx.createOscillator(), sweepG = ctx.createGain(), sweepF = ctx.createBiquadFilter();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
      sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.2);
      sweepF.type = 'lowpass'; sweepF.frequency.value = 800; sweepF.Q.value = 5;
      sweepG.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      sweepG.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.4);
      sweepG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      sweep.connect(sweepF).connect(sweepG).connect(master);
      sweep.start(ctx.currentTime + 0.1); sweep.stop(ctx.currentTime + 1.5);

      // 3. Chime cascade (three ascending tones — the "ready" signal)
      const chimeNotes = [523.25, 659.25, 783.99]; // C5, E5, G5
      chimeNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sine'; osc.frequency.value = freq;
        filter.type = 'lowpass'; filter.frequency.value = 3000;
        const t = ctx.currentTime + 0.8 + i * 0.15;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(filter).connect(g).connect(master);
        osc.start(t); osc.stop(t + 0.9);
      });

      // 4. Soft shimmer tail (reverb-like ambience)
      const shimLen = ctx.sampleRate * 0.5;
      const shimBuf = ctx.createBuffer(2, shimLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = shimBuf.getChannelData(ch);
        for (let i = 0; i < shimLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / shimLen, 3) * 0.5;
        }
      }
      const shimSrc = ctx.createBufferSource(); shimSrc.buffer = shimBuf;
      const shimF = ctx.createBiquadFilter(); shimF.type = 'bandpass'; shimF.frequency.value = 2000; shimF.Q.value = 2;
      const shimG = ctx.createGain();
      shimG.gain.setValueAtTime(0, ctx.currentTime + 1.2);
      shimG.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.3);
      shimG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
      shimSrc.connect(shimF).connect(shimG).connect(master);
      shimSrc.start(ctx.currentTime + 1.2);

      // 5. Progress bar ticks (subtle clicking as bar fills)
      for (let t = 0; t < 8; t++) {
        const tickTime = ctx.currentTime + 0.9 + t * 0.25;
        const tick = ctx.createOscillator(), tickG = ctx.createGain();
        tick.type = 'square';
        tick.frequency.value = 1800 + Math.random() * 600;
        tickG.gain.setValueAtTime(0.02, tickTime);
        tickG.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.02);
        tick.connect(tickG).connect(master);
        tick.start(tickTime); tick.stop(tickTime + 0.025);
      }
    } catch (e) {
      // Audio not available — fail silently
    }
  }

  function init() {
    return new Promise(resolve => {
      const loader = document.getElementById('loader');
      const ascii = document.getElementById('loaderAscii');
      const subtitle = document.getElementById('loaderSubtitle');
      const barFill = document.getElementById('loaderBarFill');
      const barTrack = document.querySelector('.loader__bar-track');
      
      if (!loader) { resolve(); return; }

      // Set ASCII text
      if (ascii) ascii.textContent = ASCII;
      document.body.style.overflow = 'hidden';

      // Play boot sound — on mobile, unlock audio on first touch then play
      let _bootPlayed = false;
      function _tryBootSound() {
        if (_bootPlayed) return;
        _bootPlayed = true;
        _playBootSound();
      }
      // Attempt immediately (works on desktop)
      _tryBootSound();
      // Also listen for first touch/click for mobile unlock
      const unlockEvents = ['touchstart', 'click', 'keydown'];
      function _unlockAudio() {
        _tryBootSound();
        unlockEvents.forEach(evt => document.removeEventListener(evt, _unlockAudio));
      }
      unlockEvents.forEach(evt => document.addEventListener(evt, _unlockAudio, { once: true }));

      // Check if GSAP is available
      if (typeof gsap === 'undefined') {
        setTimeout(() => {
          loader.style.display = 'none';
          document.body.style.overflow = '';
          resolve();
        }, 3000);
        return;
      }

      // Force loader visible immediately
      gsap.set(loader, { opacity: 1, visibility: 'visible' });

      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            gsap.to(loader, {
              opacity: 0, duration: 0.6, ease: 'power2.inOut',
              onComplete: () => { 
                loader.classList.add('loader--hidden'); 
                document.body.style.overflow = ''; 
                resolve(); 
              }
            });
          }, 1400);
        }
      });

      // Animate elements
      tl.to(ascii, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1)
        .to(subtitle, { opacity: 1, duration: 0.5 }, 0.5)
        .to(barTrack, { opacity: 1, duration: 0.3 }, 0.7)
        .to(barFill, { width: '100%', duration: 2, ease: 'power2.inOut' }, 0.8)
        .to({}, { duration: 0.4 });
    });
  }
  return { init };
})();
