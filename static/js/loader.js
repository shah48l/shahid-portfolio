const Loader = (() => {
  'use strict';
  const ASCII = `
  ███████╗██╗  ██╗ █████╗ ██╗  ██╗██╗██████╗ 
  ██╔════╝██║  ██║██╔══██╗██║  ██║██║██╔══██╗
  ███████╗███████║███████║███████║██║██║  ██║
  ╚════██║██╔══██║██╔══██║██╔══██║██║██║  ██║
  ███████║██║  ██║██║  ██║██║  ██║██║██████╔╝
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝`;

  /* ── Boot-up Sound Effect ── */
  function _playBootSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);

      // 1. Deep sub-bass hum (power on)
      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.type = 'sine'; sub.frequency.value = 55;
      subG.gain.setValueAtTime(0, ctx.currentTime);
      subG.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.25);
      subG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      sub.connect(subG).connect(master);
      sub.start(ctx.currentTime); sub.stop(ctx.currentTime + 2);

      // 2. Rising sweep
      const sweep = ctx.createOscillator(), sweepG = ctx.createGain(), sweepF = ctx.createBiquadFilter();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(80, ctx.currentTime + 0.05);
      sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.1);
      sweepF.type = 'lowpass'; sweepF.frequency.value = 900; sweepF.Q.value = 5;
      sweepG.gain.setValueAtTime(0, ctx.currentTime + 0.05);
      sweepG.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
      sweepG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      sweep.connect(sweepF).connect(sweepG).connect(master);
      sweep.start(ctx.currentTime + 0.05); sweep.stop(ctx.currentTime + 1.4);

      // 3. Chime cascade (C5 → E5 → G5)
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        osc.type = 'sine'; osc.frequency.value = freq;
        f.type = 'lowpass'; f.frequency.value = 3000;
        const t = ctx.currentTime + 0.7 + i * 0.15;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.14, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(f).connect(g).connect(master);
        osc.start(t); osc.stop(t + 0.9);
      });

      // 4. Shimmer tail
      const shimLen = Math.floor(ctx.sampleRate * 0.5);
      const shimBuf = ctx.createBuffer(2, shimLen, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = shimBuf.getChannelData(ch);
        for (let i = 0; i < shimLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / shimLen, 3) * 0.5;
      }
      const shimSrc = ctx.createBufferSource(); shimSrc.buffer = shimBuf;
      const shimF = ctx.createBiquadFilter(); shimF.type = 'bandpass'; shimF.frequency.value = 2000; shimF.Q.value = 2;
      const shimG = ctx.createGain();
      shimG.gain.setValueAtTime(0, ctx.currentTime + 1.1);
      shimG.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.2);
      shimG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      shimSrc.connect(shimF).connect(shimG).connect(master);
      shimSrc.start(ctx.currentTime + 1.1);

      // 5. Progress ticks
      for (let t = 0; t < 8; t++) {
        const tt = ctx.currentTime + 0.8 + t * 0.22;
        const tick = ctx.createOscillator(), tG = ctx.createGain();
        tick.type = 'square'; tick.frequency.value = 1800 + Math.random() * 600;
        tG.gain.setValueAtTime(0.025, tt);
        tG.gain.exponentialRampToValueAtTime(0.001, tt + 0.02);
        tick.connect(tG).connect(master);
        tick.start(tt); tick.stop(tt + 0.025);
      }
    } catch (e) { /* Audio not available */ }
  }

  function init() {
    return new Promise(resolve => {
      const loader = document.getElementById('loader');
      const ascii = document.getElementById('loaderAscii');
      const subtitle = document.getElementById('loaderSubtitle');
      const enterBtn = document.getElementById('loaderEnter');
      const barFill = document.getElementById('loaderBarFill');
      const barTrack = document.getElementById('loaderBarTrack') || document.querySelector('.loader__bar-track');

      if (!loader) { resolve(); return; }

      // Set ASCII text
      if (ascii) ascii.textContent = ASCII;
      document.body.style.overflow = 'hidden';

      // Phase 1: Show ASCII + subtitle + "Click to Enter" button (no audio yet)
      if (typeof gsap !== 'undefined') {
        gsap.set(loader, { opacity: 1, visibility: 'visible' });

        const intro = gsap.timeline();
        intro.to(ascii, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1)
             .to(subtitle, { opacity: 1, duration: 0.5 }, 0.4)
             .to(enterBtn, { opacity: 1, duration: 0.5 }, 0.7);

        // Phase 2: Wait for the user to click the button
        enterBtn.addEventListener('click', () => {
          // NOW we have a user gesture — play boot sound!
          _playBootSound();

          // Hide button, show progress bar, run boot animation
          gsap.to(enterBtn, { opacity: 0, duration: 0.3, onComplete: () => { enterBtn.style.display = 'none'; } });

          const bootTl = gsap.timeline({
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
              }, 800);
            }
          });

          bootTl.to(barTrack, { opacity: 1, duration: 0.3 }, 0)
                .to(barFill, { width: '100%', duration: 1.8, ease: 'power2.inOut' }, 0.1);
        }, { once: true });

      } else {
        // No GSAP fallback
        if (enterBtn) {
          enterBtn.style.opacity = '1';
          enterBtn.addEventListener('click', () => {
            _playBootSound();
            setTimeout(() => {
              loader.style.display = 'none';
              document.body.style.overflow = '';
              resolve();
            }, 2500);
          }, { once: true });
        }
      }
    });
  }

  return { init };
})();
