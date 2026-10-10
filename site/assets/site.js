/* Marz Media — shared behaviour: header, menu, scroll reveals, gallery lightbox, portfolio filters, reels. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce');

  /* header: transparent over a hero, solid once scrolled */
  var head = d.querySelector('.site-head');
  if (head && !head.classList.contains('light')) {
    var onScroll = function () { head.classList.toggle('solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  var mb = d.querySelector('.menu-btn');
  if (mb) mb.addEventListener('click', function () {
    var open = !d.body.classList.contains('menu-open');
    d.body.classList.toggle('menu-open', open);
    mb.setAttribute('aria-expanded', String(open));
  });

  /* reveal on scroll */
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* lightbox over any [data-lb] gallery figure */
  var lb, lbImg, lbCap, list = [], idx = 0;
  function visibleFigs(gallery) {
    return Array.prototype.filter.call(gallery.querySelectorAll('figure'), function (f) { return !f.hidden; });
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    var f = list[idx];
    var im = f.querySelector('img');
    lbImg.src = f.getAttribute('data-full') || im.currentSrc.replace(/w_\d+,h_\d+/, function () { var w = +im.getAttribute('width'), h = +im.getAttribute('height'), k = 2400 / Math.max(w, h); return 'w_' + Math.round(w * k) + ',h_' + Math.round(h * k); });
    lbImg.alt = im.alt;
    lbCap.textContent = f.querySelector('figcaption') ? f.querySelector('figcaption').textContent : '';
  }
  function openLb(gallery, fig) {
    if (!lb) {
      lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
      lb.innerHTML = '<img alt=""><p class="cap"></p><button class="x" aria-label="Close">×</button><button class="prev" aria-label="Previous photo">‹</button><button class="next" aria-label="Next photo">›</button>';
      d.body.appendChild(lb);
      lbImg = lb.querySelector('img'); lbCap = lb.querySelector('.cap');
      lb.querySelector('.x').onclick = closeLb;
      lb.querySelector('.prev').onclick = function () { show(idx - 1); };
      lb.querySelector('.next').onclick = function () { show(idx + 1); };
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      var sx = null;
      lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
      d.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1);
      });
    }
    list = visibleFigs(gallery);
    show(list.indexOf(fig));
    lb.classList.add('open'); d.body.style.overflow = 'hidden';
    lb.querySelector('.x').focus();
  }
  function closeLb() { lb.classList.remove('open'); d.body.style.overflow = ''; }
  d.querySelectorAll('[data-lb]').forEach(function (g) {
    g.addEventListener('click', function (e) { var f = e.target.closest('figure'); if (f) openLb(g, f); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var f = e.target.closest('figure'); if (f) openLb(g, f); } });
  });

  /* portfolio filters: buttons with data-filter, figures/reels with data-album */
  d.querySelectorAll('[data-filters]').forEach(function (bar) {
    var scope = d.querySelector(bar.getAttribute('data-filters'));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]'); if (!b) return;
      var f = b.getAttribute('data-filter');
      bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      scope.querySelectorAll('[data-album]').forEach(function (el) {
        el.hidden = !(f === 'all' || (' ' + el.getAttribute('data-album') + ' ').indexOf(' ' + f + ' ') > -1);
      });
      var reels = d.getElementById('reels-block'); if (reels) reels.hidden = !(f === 'all' || f === 'reels');
      var photos = d.getElementById('photo-block'); if (photos) photos.hidden = f === 'reels';
      try { history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f); } catch (_) {}
    });
    var h = (location.hash || '').slice(1);
    var start = h && bar.querySelector('button[data-filter="' + h + '"]');
    if (start) start.click();
  });

  /* reels: tap/hover to play, one at a time */
  var playing = null;
  function stop(r) { if (!r) return; var v = r.querySelector('video'); if (v) { v.pause(); } r.classList.remove('playing'); }
  d.querySelectorAll('.reel').forEach(function (r) {
    var v = r.querySelector('video');
    function play() {
      if (playing && playing !== r) stop(playing);
      if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
      v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {});
      r.classList.add('playing'); playing = r;
    }
    r.addEventListener('click', function () { if (r.classList.contains('playing')) { v.muted = !v.muted; } else play(); });
    r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.classList.contains('playing') ? stop(r) : play(); } });
    if (window.matchMedia('(hover:hover)').matches) {
      r.addEventListener('mouseenter', play);
      r.addEventListener('mouseleave', function () { stop(r); });
    }
  });

  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
