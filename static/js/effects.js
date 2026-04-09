const Effects = (() => {
  'use strict';

  function initCircuitBoard() {
    const container = document.querySelector('.circuit-bg');
    if (!container) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1200 800'); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.opacity = '0.035';
    const color = '#00ffaa';
    for (let i = 0; i < 25; i++) {
      let x = Math.random() * 1200, y = Math.random() * 800;
      let d = `M ${x} ${y}`;
      for (let s = 0; s < 3 + Math.floor(Math.random() * 5); s++) {
        if (Math.random() > 0.5) x += (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 120);
        else y += (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 120);
        x = Math.max(0, Math.min(1200, x)); y = Math.max(0, Math.min(800, y));
        d += ` L ${x} ${y}`;
      }
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('stroke', color); path.setAttribute('stroke-width', '1');
      path.setAttribute('fill', 'none'); path.setAttribute('opacity', '0.5');
      svg.appendChild(path);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '2.5');
      c.setAttribute('fill', color); c.setAttribute('opacity', '0.4');
      svg.appendChild(c);
    }
    container.appendChild(svg);
  }

  function initProximityText() {
    document.querySelectorAll('.proximity-text').forEach(el => {
      const text = el.textContent; el.textContent = ''; el.setAttribute('aria-label', text);
      [...text].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'proximity-text__char';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(span);
      });
    });
    const chars = document.querySelectorAll('.proximity-text__char');
    const R = 120;
    document.addEventListener('mousemove', e => {
      chars.forEach(ch => {
        const rect = ch.getBoundingClientRect();
        const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
        if (dist < R) {
          const t = 1 - dist / R;
          ch.style.fontWeight = Math.round(300 + t * 500);
          ch.style.color = `rgba(0,255,170,${0.3 + t * 0.7})`;
          ch.style.textShadow = `0 0 ${t * 20}px rgba(0,255,170,${t * 0.5})`;
        } else { ch.style.fontWeight = ''; ch.style.color = ''; ch.style.textShadow = ''; }
      });
    });
  }

  function initCardGlow() {
    let angle = 0;
    function tick() { angle = (angle + 0.5) % 360; document.querySelectorAll('.skill-card').forEach(c => c.style.setProperty('--glow-angle', angle + 'deg')); requestAnimationFrame(tick); }
    tick();
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--mouse-y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  function init() { initCircuitBoard(); initProximityText(); initCardGlow(); }
  return { init };
})();
