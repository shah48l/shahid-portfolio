/* ==========================================================================
   AMBIENT MUSIC — Lo-fi/Chillhop background synthesis
   Web Audio API for ambient atmospheric music
   ========================================================================== */

const AmbientMusic = (() => {
  'use strict';

  let audioContext;
  let masterGain;
  let isPlaying = false;
  let oscillators = [];
  let gainNodes = [];

  function init() {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.08; // Low volume - ambient background
      masterGain.connect(audioContext.destination);
    } catch (e) {
      console.warn('Audio context init failed:', e);
    }
  }

  function createAmbientPad() {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const baseFreq = 55; // Low A
    
    // Create soft, evolving pad with multiple sine waves
    const frequencies = [55, 110, 164.81, 220, 330]; // A pentatonic scale
    
    frequencies.forEach((freq, idx) => {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15 - idx * 0.03, now + 1);
      gain.gain.linearRampToValueAtTime(0, now + 8);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + 8);
      
      oscillators.push(osc);
      gainNodes.push(gain);
    });

    // Schedule next pad
    setTimeout(createAmbientPad, 6000); // Loop every 6 seconds
  }

  function createMelodyNote(freq, duration = 0.8) {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + duration);
    
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
    
    oscillators.push(osc);
    gainNodes.push(gain);
  }

  function playMelody() {
    if (!isPlaying || !audioContext) return;

    // Simple pentatonic melody
    const scale = [220, 247, 294, 330, 392, 440]; // A minor pentatonic
    const melody = [0, 2, 1, 3, 2, 4, 3, 5, 4, 2, 0];
    
    let delay = 0;
    melody.forEach((noteIdx) => {
      setTimeout(() => {
        if (isPlaying) {
          createMelodyNote(scale[noteIdx], 0.6);
        }
      }, delay);
      delay += 600;
    });

    // Schedule next melody
    setTimeout(playMelody, delay + 1000);
  }

  function play() {
    if (!audioContext) return;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    isPlaying = true;
    masterGain.gain.setTargetAtTime(0.08, audioContext.currentTime, 0.1);
    
    createAmbientPad();
    setTimeout(playMelody, 2000);
  }

  function stop() {
    isPlaying = false;
    
    if (audioContext) {
      masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.5);
    }
    
    // Stop all oscillators
    oscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    oscillators = [];
    gainNodes = [];
  }

  function toggle() {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
    return isPlaying;
  }

  function isActive() {
    return isPlaying;
  }

  return { init, play, stop, toggle, isActive };
})();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AmbientMusic.init);
} else {
  AmbientMusic.init();
}
