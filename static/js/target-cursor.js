/* ==========================================================================
   TARGET CURSOR — ReactBits-inspired cursor effect
   Animated target/crosshair cursor that follows mouse movement
   ========================================================================== */

const TargetCursor = (() => {
  'use strict';

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let isInitialized = false;

  const SPEED = 0.15; // Easing/follow speed

  function init() {
    if (typeof document === 'undefined') return;

    // Create cursor HTML
    const cursor = document.createElement('div');
    cursor.id = 'targetCursor';
    cursor.innerHTML = `
      <div class="target-cursor__outer"></div>
      <div class="target-cursor__middle"></div>
      <div class="target-cursor__inner"></div>
      <div class="target-cursor__dot"></div>
    `;
    document.body.appendChild(cursor);

    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      #targetCursor {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        left: 0;
        top: 0;
        will-change: transform;
      }

      .target-cursor__outer {
        position: absolute;
        width: 60px;
        height: 60px;
        border: 2px solid rgba(0, 255, 170, 0.3);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 2s ease-in-out infinite;
      }

      .target-cursor__middle {
        position: absolute;
        width: 40px;
        height: 40px;
        border: 1.5px solid rgba(0, 255, 170, 0.5);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .target-cursor__inner {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 1px solid rgba(0, 255, 170, 0.8);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .target-cursor__dot {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(0, 255, 170, 1);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px rgba(0, 255, 170, 0.6);
      }

      @keyframes pulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
      }

      /* Hide default cursor */
      body { cursor: none; }
      
      /* Show cursor on interactive elements */
      a, button, [role="button"], input, textarea, select, .magnetic {
        cursor: none;
      }

      @media (hover: none) {
        #targetCursor { display: none; }
        body { cursor: auto; }
      }
    `;
    document.head.appendChild(style);

    isInitialized = true;
    animate();
    attachEventListeners();
  }

  function attachEventListeners() {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      const cursor = document.getElementById('targetCursor');
      if (cursor) cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      const cursor = document.getElementById('targetCursor');
      if (cursor) cursor.style.opacity = '1';
    });
  }

  function animate() {
    if (!isInitialized) return;

    targetX += (mouseX - targetX) * SPEED;
    targetY += (mouseY - targetY) * SPEED;

    const cursor = document.getElementById('targetCursor');
    if (cursor) {
      cursor.style.transform = `translate(${targetX}px, ${targetY}px)`;
    }

    requestAnimationFrame(animate);
  }

  return { init };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', TargetCursor.init);
} else {
  TargetCursor.init();
}
