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
      
      if (!loader) { resolve(); return; }

      // Set ASCII text
      if (ascii) ascii.textContent = ASCII;
      document.body.style.overflow = 'hidden';

      // Check if GSAP is available
      if (typeof gsap === 'undefined') {
        // GSAP not available - just wait 5 seconds and resolve
        setTimeout(() => {
          loader.style.display = 'none';
          document.body.style.overflow = '';
          resolve();
        }, 5000);
        return;
      }

      // Force loader visible immediately
      gsap.set(loader, { opacity: 1, visibility: 'visible' });

      const tl = gsap.timeline({
        onComplete: () => {
          // Wait additional time (total 5 seconds)
          setTimeout(() => {
            gsap.to(loader, {
              opacity: 0, duration: 0.6, ease: 'power2.inOut',
              onComplete: () => { 
                loader.classList.add('loader--hidden'); 
                document.body.style.overflow = ''; 
                resolve(); 
              }
            });
          }, 3400); // 5 seconds total - 1.6 seconds of animations
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
