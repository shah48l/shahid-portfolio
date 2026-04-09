const Loader = (() => {
  'use strict';
  const ASCII = `
  ███████╗██╗  ██╗ █████╗ ██╗  ██╗██╗██████╗ 
  ██╔════╝██║  ██║██╔══██╗██║  ██║██║██╔══██╗
  ███████╗███████║███████║███████║██║██║  ██║
  ╚════██║██╔══██║██╔══██║██╔══██║██║██║  ██║
  ███████║██║  ██║██║  ██║██║  ██║██║██████╔╝
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝`;

  function init() {
    return new Promise(resolve => {
      const loader = document.getElementById('loader');
      const ascii = document.getElementById('loaderAscii');
      const subtitle = document.getElementById('loaderSubtitle');
      const barFill = document.getElementById('loaderBarFill');
      const barTrack = document.querySelector('.loader__bar-track');
      if (!loader || !ascii) { resolve(); return; }

      ascii.textContent = ASCII;
      document.body.style.overflow = 'hidden';

      // Force loader visible immediately
      gsap.set(loader, { opacity: 1, visibility: 'visible' });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(loader, {
            opacity: 0, duration: 0.6, ease: 'power2.inOut',
            onComplete: () => { loader.classList.add('loader--hidden'); document.body.style.overflow = ''; resolve(); }
          });
        }
      });

      tl.to(ascii, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1)
        .to(subtitle, { opacity: 1, duration: 0.5 }, 0.5)
        .to(barTrack, { opacity: 1, duration: 0.3 }, 0.7)
        .to(barFill, { width: '100%', duration: 2, ease: 'power2.inOut' }, 0.8)
        .to({}, { duration: 0.4 });
    });
  }
  return { init };
})();
