/* ==========================================================================
   TERMINAL MODULE — Typewriter effect with queued commands
   Pattern: Command (queues line objects, executes sequentially)
   ========================================================================== */

const Terminal = (() => {
  'use strict';

  const LINES = [
    { type: 'cmd',     prompt: '~$', text: 'whoami' },
    { type: 'output',  text: 'Shahid J — Backend Engineer' },
    { type: 'cmd',     prompt: '~$', text: 'cat skills.json' },
    { type: 'output',  text: '{ "backend": ["Django", "FastAPI"],' },
    { type: 'output',  text: '  "databases": ["PostgreSQL", "Redis"],' },
    { type: 'output',  text: '  "cloud": ["Docker", "AWS", "CI/CD"] }' },
    { type: 'cmd',     prompt: '~$', text: 'python manage.py runserver' },
    { type: 'output',  text: '✓ System check passed — 0 issues.' },
    { type: 'output',  text: '✓ Development server running at 0.0.0.0:8000' },
    { type: 'comment', text: '# Ready to build something great.' },
  ];

  /* ── Helpers ── */
  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function _el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  /* ── Core Typing Loop ── */
  async function start(containerId, delayMs = 1500) {
    await _sleep(delayMs);

    const body = document.getElementById(containerId);
    if (!body) return;

    for (const line of LINES) {
      if (line.type === 'cmd') {
        const row = _el('div', 'terminal__line');
        row.appendChild(_el('span', 'terminal__prompt', line.prompt));
        const cmd = _el('span', 'terminal__cmd');
        row.appendChild(cmd);
        body.appendChild(row);

        for (let i = 0; i < line.text.length; i++) {
          cmd.textContent += line.text[i];
          SoundManager.playKeystroke();
          await _sleep(35 + Math.random() * 35);
        }
        await _sleep(280);

      } else if (line.type === 'output') {
        body.appendChild(_el('div', 'terminal__output', line.text));
        await _sleep(90);

      } else if (line.type === 'comment') {
        body.appendChild(_el('div', 'terminal__comment', line.text));
        await _sleep(180);
      }

      body.scrollTop = body.scrollHeight;
    }

    // Blinking cursor at end
    const endLine = _el('div', 'terminal__line');
    endLine.appendChild(_el('span', 'terminal__prompt', '~$'));
    const cursor = _el('span', 'terminal__cursor');
    endLine.appendChild(cursor);
    body.appendChild(endLine);
  }

  return { start };
})();
