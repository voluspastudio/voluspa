/* VP Studio interactive figures.
   Each one is written in Obsidian as a code block, for example:
   ```vp-kanizsa
   caption: Rotate the inducers.
   ```
*/
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'class') el.className = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function s(tag, attrs) { var el = document.createElementNS(NS, tag); for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }
  function btn(label, on) { return h('button', { type: 'button', class: 'ctl', onclick: on, text: label }); }
  function accent() { return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#E8601C'; }
  function rng(seed) { var x = seed % 2147483647; if (x <= 0) x += 2147483646; return function () { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
  function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key)); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }

  var W = {};

  /* Kanizsa figure: rotate the inducers and the triangle disappears */
  W.kanizsa = function (root, cfg) {
    var P = [[450, 118], [140, 660], [760, 660]], G = [450, 479.3], r = 104, rad = Math.PI / 180;
    var svg = s('svg', { viewBox: '0 0 900 800', role: 'img', 'aria-label': cfg.alt || 'Three disks with wedges removed, arranged so a triangle appears between them.' });
    var groups = P.map(function (p, i) {
      var mid = Math.atan2(G[1] - p[1], G[0] - p[0]), a = mid + 30 * rad, b = mid - 30 * rad;
      var d = 'M0 0 L' + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1) + ' A' + r + ' ' + r + ' 0 1 1 ' + (r * Math.cos(b)).toFixed(1) + ' ' + (r * Math.sin(b)).toFixed(1) + ' Z';
      var outer = s('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')' }), inner = s('g', { class: 'vp-rot' });
      inner.appendChild(s('path', { d: d, fill: i === 0 ? (cfg.color || accent()) : '#111111' }));
      outer.appendChild(inner); svg.appendChild(outer); return inner;
    });
    var id = 'vp' + (++uid), val = h('span', { class: 'mo', text: '0°' });
    var range = h('input', { type: 'range', min: '0', max: '90', value: '0', id: id, class: 'vp-range' });
    function set(v) { range.value = v; val.textContent = v + '°'; groups.forEach(function (g, i) { g.style.transform = 'rotate(' + ([1, -1, 1][i] * v) + 'deg)'; }); }
    range.addEventListener('input', function () { set(Number(range.value)); });
    var toggle = btn('Rotate the inducers', function () { var on = Number(range.value) > 0; set(on ? 0 : 75); toggle.textContent = on ? 'Rotate the inducers' : 'Restore the figure'; });
    root.appendChild(h('div', { class: 'vp-stage' }, [svg]));
    root.appendChild(h('div', { class: 'vp-controls' }, [h('label', { for: id, class: 'mo', text: 'Inducer rotation' }), range, val, toggle]));
  };

  /* Afterimage: stare at the dot, then see the opposite color */
  W.afterimage = function (root, cfg) {
    var color = cfg.color || accent(), secs = Math.max(5, Math.min(40, Number(cfg.seconds) || 15)), timer = null;
    var dot = h('span', { class: 'vp-dot', 'aria-hidden': 'true' });
    var count = h('span', { class: 'vp-count mo', 'aria-live': 'polite' });
    var field = h('div', { class: 'vp-field', style: 'background:' + color }, [dot, count]);
    var msg = h('p', { class: 'vp-msg', text: 'Look at the dot. Don’t move your eyes.' });
    var start = btn('Start, ' + secs + ' seconds', run);
    function run() {
      clearInterval(timer); var n = secs; field.style.background = color; start.disabled = true; count.textContent = n;
      msg.textContent = 'Keep your eyes on the dot.';
      timer = setInterval(function () {
        n--; count.textContent = n > 0 ? n : '';
        if (n <= 0) {
          clearInterval(timer); field.style.background = '#ECEBE6';
          msg.textContent = cfg.question || 'Still on the dot. What color appears?';
          start.disabled = false; start.textContent = 'Try again';
        }
      }, 1000);
    }
    root.appendChild(field); root.appendChild(h('div', { class: 'vp-controls' }, [msg, start]));
  };

  /* Flash: show something for a fraction of a second */
  W.flash = function (root, cfg) {
    var ms = Math.max(30, Math.min(3000, Number(cfg.duration) || 150));
    var content = cfg.image ? h('img', { src: cfg.image, alt: cfg.alt || '' }) : h('p', { class: 'vp-flash-text', text: cfg.text || 'VP' });
    var stage = h('div', { class: 'vp-stage vp-flash' }, [h('div', { class: 'vp-mask', 'aria-hidden': 'true' })]);
    var q = h('p', { class: 'vp-msg', text: cfg.prompt || 'Ready? It appears for ' + ms + ' milliseconds.' });
    var reveal = btn('Show it again, slowly', function () { stage.replaceChildren(content.cloneNode(true)); reveal.hidden = true; });
    reveal.hidden = true;
    var go = btn('Show', function () {
      go.disabled = true; stage.replaceChildren(content.cloneNode(true));
      setTimeout(function () {
        stage.replaceChildren(h('div', { class: 'vp-mask', 'aria-hidden': 'true' }));
        q.textContent = cfg.question || 'What did you see?'; go.disabled = false; go.textContent = 'Flash again'; reveal.hidden = false;
      }, ms);
    });
    root.appendChild(stage); root.appendChild(h('div', { class: 'vp-controls' }, [q, go, reveal]));
  };

  /* Choice: ask the reader, remember their answer in this browser */
  W.choice = function (root, cfg) {
    var opts = (cfg.options || []).map(function (o) { return typeof o === 'string' ? { label: o } : o; });
    var key = 'vp.choice.' + location.pathname + '.' + (cfg.question || '');
    var prev = store(key);
    var out = h('p', { class: 'vp-msg', 'aria-live': 'polite' });
    var q = h('p', { class: 'vp-q', text: cfg.question || 'Which do you see?' });
    var row = h('div', { class: 'vp-options', role: 'group', 'aria-label': cfg.question || 'Options' });
    var buttons = opts.map(function (o, i) {
      var b = h('button', { type: 'button', class: 'vp-opt', 'aria-pressed': 'false', onclick: function () { pick(i); } },
        [o.image ? h('img', { src: o.image, alt: '' }) : null, h('span', { text: o.label || ('Option ' + (i + 1)) })]);
      row.appendChild(b); return b;
    });
    function pick(i) {
      buttons.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      store(key, i);
      out.textContent = (cfg.response || 'You chose: ') + (opts[i].label || ('Option ' + (i + 1))) + '.' + (cfg.note ? ' ' + cfg.note : '');
    }
    root.appendChild(q); root.appendChild(row); root.appendChild(out);
    if (typeof prev === 'number' && opts[prev]) pick(prev);
  };

  /* Compare: drag to reveal one image over another */
  W.compare = function (root, cfg) {
    if (!cfg.before || !cfg.after) { root.appendChild(h('p', { class: 'mo', text: 'Add before: and after: images to this block.' })); return; }
    var id = 'vp' + (++uid);
    var top = h('div', { class: 'vp-top' }, [h('img', { src: cfg.after, alt: cfg.after_alt || cfg.labels && cfg.labels[1] || 'After' })]);
    var stage = h('div', { class: 'vp-compare' }, [h('img', { src: cfg.before, alt: cfg.before_alt || cfg.labels && cfg.labels[0] || 'Before' }), top, h('span', { class: 'vp-line', 'aria-hidden': 'true' })]);
    var range = h('input', { type: 'range', min: '0', max: '100', value: '50', id: id, class: 'vp-range' });
    function set() { top.style.clipPath = 'inset(0 0 0 ' + range.value + '%)'; stage.style.setProperty('--x', range.value + '%'); }
    range.addEventListener('input', set); set();
    var labels = cfg.labels || ['Before', 'After'];
    root.appendChild(stage);
    root.appendChild(h('div', { class: 'vp-controls' }, [h('label', { for: id, class: 'mo', text: labels[0] + ' / ' + labels[1] }), range]));
  };

  /* Blot: fold a new symmetric ink blot */
  W.blot = function (root, cfg) {
    var id = 'vpb' + (++uid), seed = Number(cfg.seed) || 11;
    var svg = s('svg', { viewBox: '-400 -420 800 840', role: 'img', 'aria-label': 'A symmetric ink blot.' });
    var defs = s('defs', {}), f = s('filter', { id: id + 'f', x: '-30%', y: '-20%', width: '160%', height: '140%' });
    var noise = s('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.03', numOctaves: '2', seed: String(seed), result: 'n' });
    f.appendChild(noise);
    f.appendChild(s('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '34', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }));
    f.appendChild(s('feGaussianBlur', { in: 'd', stdDeviation: '5', result: 'b' }));
    f.appendChild(s('feColorMatrix', { in: 'b', type: 'matrix', values: '0 0 0 0 0.067  0 0 0 0 0.067  0 0 0 0 0.067  0 0 0 28 -11' }));
    defs.appendChild(f); svg.appendChild(defs);
    var half = s('g', { id: id + 'h', filter: 'url(#' + id + 'f)' }); svg.appendChild(half);
    svg.appendChild(s('use', { href: '#' + id + 'h', transform: 'scale(-1 1)' }));
    function fold(sd) {
      var q = rng(sd * 97 + 13); half.replaceChildren(); noise.setAttribute('seed', String(sd));
      var spine = 6 + Math.floor(q() * 4);
      for (var i = 0; i < spine; i++) half.appendChild(s('ellipse', { cx: (q() * 30).toFixed(0), cy: (-360 + (720 / (spine - 1)) * i + (q() - 0.5) * 40).toFixed(0), rx: (30 + q() * 40).toFixed(0), ry: (26 + q() * 50).toFixed(0), fill: '#111' }));
      var lobes = 9 + Math.floor(q() * 7);
      for (var j = 0; j < lobes; j++) {
        var ly = -340 + q() * 680, lx = 60 + q() * 220, big = q() < 0.35;
        half.appendChild(s('ellipse', { cx: lx.toFixed(0), cy: ly.toFixed(0), rx: ((big ? 80 : 30) + q() * (big ? 90 : 55)).toFixed(0), ry: ((big ? 60 : 20) + q() * (big ? 90 : 50)).toFixed(0), transform: 'rotate(' + ((q() - 0.5) * 120).toFixed(0) + ' ' + lx.toFixed(0) + ' ' + ly.toFixed(0) + ')', fill: '#111' }));
      }
    }
    fold(seed);
    root.appendChild(h('div', { class: 'vp-stage vp-blot' }, [svg]));
    root.appendChild(h('div', { class: 'vp-controls' }, [h('p', { class: 'vp-msg', text: cfg.question || 'What do you see?' }), btn('Fold a new blot', function () { seed += 1 + Math.floor(Math.random() * 50); fold(seed); })]));
  };

  W.unknown = function (root) { root.appendChild(h('p', { class: 'mo', text: 'Unknown figure type. Available: vp-kanizsa, vp-afterimage, vp-flash, vp-choice, vp-compare, vp-blot.' })); };

  document.querySelectorAll('.vp-widget').forEach(function (root) {
    var cfg = {};
    try { cfg = JSON.parse(root.getAttribute('data-config') || '{}'); } catch (e) {}
    root.replaceChildren();
    if (cfg.error) { root.appendChild(h('p', { class: 'mo', text: cfg.error })); return; }
    (W[root.getAttribute('data-widget')] || W.unknown)(root, cfg);
  });
  void reduce;
})();
