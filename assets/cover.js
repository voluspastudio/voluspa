(function () {
  'use strict';
  var VP = window.VP || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* Fill text from content.js */
  function lookup(path) { return path.split('.').reduce(function (o, k) { return o ? o[k] : undefined; }, VP); }
  document.querySelectorAll('[data-bind]').forEach(function (el) {
    var v = lookup(el.getAttribute('data-bind'));
    if (v != null) el.textContent = v;
  });
  if (VP.issue && VP.issue.investigationHref) document.getElementById('invLink').setAttribute('href', VP.issue.investigationHref);
  if (VP.issue) document.title = 'VP Studio · ' + VP.issue.label + ': ' + VP.issue.theme;

  function rng(seed) {
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ---------- Figure 7: degrading alphabet ---------- */
  var lettersEl = document.getElementById('letters');
  var distEl = document.getElementById('dist');
  var distVal = document.getElementById('distVal');
  var r = rng(4242), letters = [];
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (ch, i) {
    var cell = document.createElement('div');
    cell.className = 'ltr';
    var a = document.createElement('span'), b = document.createElement('span');
    a.textContent = ch; b.textContent = ch;
    cell.appendChild(a); cell.appendChild(b);
    lettersEl.appendChild(cell);
    var L = { i: i, a: a, b: b, rot: r() * 2 - 1, sk: r() * 2 - 1, cutT: r(), cutB: r(), gx: r() * 2 - 1, gy: r() * 2 - 1, sq: r(), held: false };
    cell.addEventListener('mouseenter', function () { L.held = true; paint(L); });
    cell.addEventListener('mouseleave', function () { L.held = false; paint(L); });
    letters.push(L);
  });
  function paint(L) {
    var D = Number(distEl.value) / 100;
    var d = L.held ? 0 : D * (0.25 + 0.75 * (L.i / 25));
    L.a.style.transform = 'rotate(' + (L.rot * 50 * d).toFixed(1) + 'deg) skewX(' + (L.sk * 40 * d).toFixed(1) + 'deg) scaleY(' + (1 - L.sq * 0.55 * d).toFixed(2) + ')';
    L.a.style.clipPath = 'inset(' + (L.cutT * 46 * d).toFixed(0) + '% 0 ' + (L.cutB * 40 * d).toFixed(0) + '% 0)';
    L.b.style.transform = 'translate(' + (L.gx * 14 * d).toFixed(1) + 'px,' + (L.gy * 10 * d).toFixed(1) + 'px) rotate(' + (-L.rot * 70 * d).toFixed(1) + 'deg)';
    L.b.style.opacity = (d * 0.9).toFixed(2);
    L.b.style.clipPath = 'inset(' + (55 - L.cutB * 30 * d).toFixed(0) + '% 0 0 0)';
  }
  function paintAll() { distVal.textContent = distEl.value; letters.forEach(paint); }
  distEl.addEventListener('input', paintAll);
  paintAll();

  /* ---------- Figure 8: the folded blot ---------- */
  var half = document.getElementById('blotHalf');
  var noise = document.getElementById('inkNoise');
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function fold(seed) {
    var q = rng(seed * 97 + 13);
    while (half.firstChild) half.removeChild(half.firstChild);
    noise.setAttribute('seed', String(seed));
    var spine = 6 + Math.floor(q() * 4);
    for (var i = 0; i < spine; i++) {
      var y = -360 + (720 / (spine - 1)) * i + (q() - 0.5) * 40;
      half.appendChild(el('ellipse', { cx: (q() * 30).toFixed(0), cy: y.toFixed(0), rx: (30 + q() * 40).toFixed(0), ry: (26 + q() * 50).toFixed(0), fill: '#111' }));
    }
    var lobes = 9 + Math.floor(q() * 7);
    for (var j = 0; j < lobes; j++) {
      var ly = -340 + q() * 680, lx = 60 + q() * 220, big = q() < 0.35;
      var rx = (big ? 80 : 30) + q() * (big ? 90 : 55), ry = (big ? 60 : 20) + q() * (big ? 90 : 50), a = (q() - 0.5) * 120;
      half.appendChild(el('ellipse', { cx: lx.toFixed(0), cy: ly.toFixed(0), rx: rx.toFixed(0), ry: ry.toFixed(0), transform: 'rotate(' + a.toFixed(0) + ' ' + lx.toFixed(0) + ' ' + ly.toFixed(0) + ')', fill: '#111' }));
    }
    for (var k = 0; k < 26; k++) {
      var ang = q() * Math.PI * 2, dist = 230 + q() * 160;
      half.appendChild(el('circle', { cx: Math.abs(Math.cos(ang) * dist).toFixed(0), cy: (Math.sin(ang) * dist * 1.1).toFixed(0), r: (2 + q() * (q() < 0.2 ? 16 : 6)).toFixed(1), fill: '#111' }));
    }
  }
  var seed = 7;
  fold(seed);
  document.getElementById('refold').addEventListener('click', function () {
    seed = seed + 1 + Math.floor(Math.random() * 50);
    fold(seed);
  });

  /* ---------- What do you see? (kept in this browser) ---------- */
  var KEY = 'vpstudio.cover.seen.v1';
  var list = document.getElementById('answers');
  var answers = [];
  try { answers = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { answers = []; }
  function renderAnswers() {
    list.innerHTML = '';
    answers.slice(-5).forEach(function (t) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode('You saw:'));
      li.appendChild(document.createElement('br'));
      var em = document.createElement('em'); em.textContent = t; li.appendChild(em);
      list.appendChild(li);
    });
  }
  renderAnswers();
  document.getElementById('seeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = document.getElementById('see');
    var t = (input.value || '').trim().slice(0, 60);
    if (!t) return;
    answers.push(t); answers = answers.slice(-20);
    try { localStorage.setItem(KEY, JSON.stringify(answers)); } catch (err) {}
    input.value = '';
    renderAnswers();
  });
})();
