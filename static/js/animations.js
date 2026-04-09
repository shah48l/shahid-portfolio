const Animations = (() => {
  'use strict';
  let _initialized = false;

  function _heroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1 } });
    tl.from('.hero__badge', { y: 30, opacity: 0, duration: 0.7 }, 0.15)
      .from('.hero__title-name', { y: 60, opacity: 0, duration: 1.1 }, 0.25)
      .from('.hero__title-role', { y: 60, opacity: 0, duration: 1.1 }, 0.4)
      .from('.hero__title-sub', { y: 30, opacity: 0, duration: 0.8 }, 0.6)
      .from('.hero__desc', { y: 30, opacity: 0, duration: 0.8 }, 0.7)
      .from('.hero__actions .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.85)
      .from('.hero__stats .stat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.08 }, 1);
    const terminal = document.querySelector('.hero__terminal');
    if (terminal && terminal.offsetParent !== null) {
      tl.from(terminal, { x: 60, opacity: 0, duration: 1.2, ease: 'power3.out' }, 0.6);
    }
    return tl;
  }

  function _sectionHeaders() {
    gsap.utils.toArray('.section-header').forEach(header => {
      gsap.from(header.children, {
        scrollTrigger: { trigger: header, start: 'top 90%', toggleActions: 'play none none none' },
        y: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out',
      });
    });
  }

  function _skillCards() {
    gsap.utils.toArray('.skill-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none none' },
        y: 50, opacity: 0, duration: 0.7, delay: i % 3 * 0.1, ease: 'expo.out',
      });
    });
  }

  function _timelineItems() {
    gsap.utils.toArray('.timeline__item').forEach(item => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: item, start: 'top 90%', toggleActions: 'play none none none' },
      });
      tl.from(item.querySelector('.timeline__dot'), { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(2)' })
        .from(item, { x: -30, opacity: 0, duration: 0.6, ease: 'expo.out' }, 0.1);
    });
  }

  function _projectCards() {
    gsap.utils.toArray('.project-card').forEach(card => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        y: 50, opacity: 0, duration: 0.8, ease: 'expo.out',
      });
    });
  }

  function _eduCard() {
    const el = document.querySelector('.edu-card');
    if (!el) return;
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
      y: 40, opacity: 0, duration: 0.8, ease: 'expo.out',
    });
  }

  function _contactSection() {
    const desc = document.querySelector('.contact__desc');
    const links = gsap.utils.toArray('.contact__link');

    // Use a very generous trigger so it fires reliably
    if (desc) {
      gsap.from(desc, {
        scrollTrigger: { trigger: '#contact', start: 'top 95%', toggleActions: 'play none none none' },
        y: 20, opacity: 0, duration: 0.6, ease: 'expo.out',
      });
    }
    if (links.length) {
      gsap.from(links, {
        scrollTrigger: { trigger: '.contact__links', start: 'top 98%', toggleActions: 'play none none none' },
        y: 15, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'expo.out',
      });

      // SAFETY: ensure links are visible after 3 seconds regardless of scroll
      gsap.delayedCall(3, () => {
        links.forEach(link => gsap.set(link, { clearProps: 'opacity,transform' }));
      });
    }
  }

  function _marquee() {
    const track = document.querySelector('.logo-loop__track') || document.querySelector('.marquee-strip__track');
    if (!track) return;
    const items = track.innerHTML;
    track.innerHTML = items + items;
    const totalWidth = track.scrollWidth / 2;
    gsap.to(track, { x: -totalWidth, duration: 35, ease: 'none', repeat: -1, modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % totalWidth) } });
  }

  function _orbParallax() {
    gsap.utils.toArray('.orb').forEach((orb, i) => {
      gsap.to(orb, {
        y: () => (i % 2 === 0 ? -80 : 60), x: () => (i % 2 === 0 ? 40 : -30),
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.5 + i * 0.5 },
      });
    });
  }

  function _statCounters() {
    gsap.utils.toArray('.stat__number').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' },
        onUpdate: () => { el.textContent = Math.round(obj.val); },
      });
    });
  }

  function init() {
    if (_initialized) return;
    _initialized = true;
    document.body.classList.remove('js-loading');
    _heroEntrance(); _sectionHeaders(); _skillCards(); _timelineItems();
    _projectCards(); _eduCard(); _contactSection(); _marquee(); _orbParallax(); _statCounters();
  }

  return { init };
})();
