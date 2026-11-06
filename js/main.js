/* Bhuvan Mohan Naik: portfolio interactions */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap) window.__animReady = true;
  else docEl.classList.remove('js'); // libraries failed: show everything as-is

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      if (hasST) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Header + mobile nav ---------- */
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var navList = document.querySelector('[data-nav-links]');
  var indicator = document.querySelector('[data-nav-indicator]');
  var navLinks = Array.prototype.slice.call(navList.querySelectorAll('a[href^="#"]'));

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navList.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navList.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  // In-page links: smooth scroll with Lenis, offset for the fixed header
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2 && id !== '#') return;
    var target = id === '#' || id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (navList.classList.contains('is-open')) setMenu(false);
    var offset = id === '#top' ? 0 : -(header.offsetHeight - 1);
    if (lenis) {
      lenis.scrollTo(id === '#top' ? 0 : target, { offset: offset, duration: 1.3 });
    } else {
      var y = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (id !== '#top' && id !== '#main') {
      history.replaceState(null, '', id);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // Active section tracking + indicator
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  var activeId = null;

  function moveIndicator(link) {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = '0'; return; }
    indicator.style.opacity = '1';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px) scaleX(' + link.offsetWidth + ')';
  }

  function updateActive() {
    var line = window.innerHeight * 0.4;
    var current = null;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= line) current = s.id;
    });
    // at the very bottom, the last section wins
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    if (current === activeId) return;
    activeId = current;
    var activeLink = null;
    navLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + current;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'location'); activeLink = a; }
      else a.removeAttribute('aria-current');
    });
    moveIndicator(activeLink);
  }

  /* ---------- Learning journey path ---------- */
  var journey = document.querySelector('[data-journey]');
  var track = journey && journey.querySelector('[data-path-track]');
  var draw = journey && journey.querySelector('[data-path-draw]');
  var stops = journey ? Array.prototype.slice.call(journey.querySelectorAll('[data-stop]')) : [];
  var points = [];
  var pathLen = 0;

  function buildPath() {
    if (!journey) return;
    var box = journey.getBoundingClientRect();
    points = stops.map(function (s) {
      var r = s.querySelector('.stop-dot').getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    });
    if (!points.length) return;
    var d = 'M ' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i];
      var my = (a.y + b.y) / 2;
      d += ' C ' + a.x + ' ' + my + ', ' + b.x + ' ' + my + ', ' + b.x + ' ' + b.y;
    }
    track.setAttribute('d', d);
    draw.setAttribute('d', d);
    pathLen = draw.getTotalLength();
    draw.style.strokeDasharray = pathLen + ' ' + pathLen;
    updateJourney();
  }

  function lengthAtY(y) {
    // y increases monotonically along the path, so binary search works
    var lo = 0, hi = pathLen;
    for (var i = 0; i < 22; i++) {
      var mid = (lo + hi) / 2;
      if (draw.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
    }
    return lo;
  }

  function updateJourney() {
    if (!journey || !points.length) return;
    if (reduceMotion) {
      draw.style.strokeDashoffset = '0';
      stops.forEach(function (s) { s.classList.add('is-lit'); });
      return;
    }
    var box = journey.getBoundingClientRect();
    var targetY = window.innerHeight * 0.62 - box.top;
    var first = points[0].y, last = points[points.length - 1].y;
    var drawn = targetY <= first ? 0 : targetY >= last ? pathLen : lengthAtY(targetY);
    draw.style.strokeDashoffset = String(pathLen - drawn);
    stops.forEach(function (s, i) { s.classList.toggle('is-lit', points[i].y <= targetY + 2); });
  }

  if (journey && !reduceMotion) journey.classList.add('is-animated');

  /* ---------- Scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 80);
      updateActive();
      updateJourney();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      buildPath();
      activeId = null;
      updateActive();
      if (hasST) ScrollTrigger.refresh();
    }, 120);
  });
  if (window.ResizeObserver && journey) new ResizeObserver(function () { buildPath(); }).observe(journey);

  /* ---------- Hero load sequence ---------- */
  function splitChars(el) {
    el.querySelectorAll('.line').forEach(function (line) {
      var text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      text.split('').forEach(function (ch) {
        if (ch === ' ') { line.appendChild(document.createTextNode(' ')); return; }
        var mask = document.createElement('span');
        mask.className = 'char-mask';
        var c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        mask.appendChild(c);
        line.appendChild(mask);
      });
    });
  }

  var heroName = document.querySelector('[data-split]');
  var heroPhoto = document.querySelector('[data-hero-photo]');

  if (hasGsap && !reduceMotion) {
    splitChars(heroName);
    var chars = heroName.querySelectorAll('.char');
    gsap.set(heroName, { opacity: 1 });

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo(heroPhoto,
        { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 28px 28px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 28px 28px)', duration: 1.5, ease: 'expo.inOut' }, 0)
      .fromTo(heroPhoto.querySelector('img'), { scale: 1.18 }, { scale: 1, duration: 2.2 }, 0)
      .fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0.25)
      .fromTo('[data-hero-fade]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.75)
      .fromTo(header, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 1, clearProps: 'transform,opacity' }, 0.9);

    // Section headings: a single quiet reveal each
    if (hasST) {
      gsap.utils.toArray('[data-reveal]').forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 36 }, {
          opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
    } else {
      gsap.set('[data-reveal]', { opacity: 1 });
    }
  }

  /* ---------- Copy email ---------- */
  var toast = document.querySelector('[data-toast]');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { showToast('Email copied'); };
      var fail = function () { showToast('Couldn\'t copy. Select the address above instead.'); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? done() : fail(); } catch (e) { fail(); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- Misc ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  function init() {
    buildPath();
    updateActive();
    header.classList.toggle('is-scrolled', window.scrollY > 80);
  }
  init();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      init();
      if (hasST) ScrollTrigger.refresh();
    });
  }
  window.addEventListener('load', init);
})();
