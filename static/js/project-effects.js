/* ==========================================================================
   PROJECT HOVER EFFECTS — ReactBits-inspired interactive hover state
   Tracks mouse position for radial gradient effects
   ========================================================================== */

const ProjectEffects = (() => {
  'use strict';

  function init() {
    const cards = document.querySelectorAll('.project-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      });

      // Add click animation
      card.addEventListener('mousedown', () => {
        gsap.to(card, {
          scale: 0.98,
          duration: 0.15,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseup', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.2,
          ease: 'back.out(1.2)'
        });
      });
    });
  }

  return { init };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ProjectEffects.init);
} else {
  ProjectEffects.init();
}
