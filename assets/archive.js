(function () {
  'use strict';
  var VP = window.VP;
  var KEY = 'vpstudio.index.v3';
  var G = 0.5;

  /* ---------- Color ---------- */
  function ok(h, dl) {
    var L = 0.665 + 0.075 * Math.cos((h - 100) * Math.PI / 180) + (dl || 0);
    return 'oklch(' + L.toFixed(3) + ' 0.125 ' + (((h % 360) + 360) % 360).toFixed(1) + ')';
  }

  /* ---------- Records ---------- */
  var CATS = VP.categories;
  /* Published articles (written by the build from content/articles) become live records. */
  (window.VP_ARTICLES || []).forEach(function (a) {
    var norm = function (x) { return String(x).toLowerCase().replace(/[‘’]/g, "'").trim(); };
    var t = norm(a.title), hit = null, at = -1;
    VP.records.forEach(function (r, i) { if (norm(r.title) === t) hit = r; if (r.cat === a.cat) at = i; });
    if (hit) { hit.href = a.href; if (a.dek) hit.dek = a.dek; if (a.type) hit.type = a.type; return; }
    VP.records.splice(at + 1, 0, { cat: a.cat, title: a.title, type: a.type, dek: a.dek, href: a.href });
  });
  Object.keys(CATS).forEach(function (k) { var c = CATS[k]; c.swatch = ok((c.hue[0] + c.hue[1]) / 2); });
  var counts = {}, seen = {};
  VP.records.forEach(function (r) { counts[r.cat] = (counts[r.cat] || 0) + 1; });
  var items = VP.records.map(function (r, i) {
    var c = CATS[r.cat], j = seen[r.cat] = (seen[r.cat] || 0) + 1;
    var t = counts[r.cat] > 1 ? (j - 1) / (counts[r.cat] - 1) : 0;
    var h = c.hue[0] + (c.hue[1] - c.hue[0]) * t;
    return { id: 'r' + (i + 1), idx: i, cat: r.cat, title: r.title, type: r.type, dek: r.dek, href: r.href || null,
      fig: 'FIG. ' + r.cat + '.' + (j < 10 ? '0' : '') + j, h: h, color: ok(h) };
  });
  var byId = {};
  items.forEach(function (it) { byId[it.id] = it; });

  /* ---------- Shapes ---------- */
  function rect(w, h, cut) {
    var out = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (cut === 'tr' && x === w - 1 && y === 0) continue;
      if (cut === 'bl' && x === 0 && y === h - 1) continue;
      if (cut === 'ell' && x > 0 && y < h - 1) continue;
      if (cut === 'jay' && x < w - 1 && y < h - 1) continue;
      out.push([x, y]);
    }
    return out;
  }
  var SH = {
    V5: rect(1, 5), V6: rect(1, 6), H5: rect(5, 1), H6: rect(6, 1),
    A23: rect(2, 3), A32: rect(3, 2), A24: rect(2, 4), A42: rect(4, 2), A33: rect(3, 3), A34: rect(3, 4), A43: rect(4, 3),
    N33: rect(3, 3, 'tr'), N34: rect(3, 4, 'bl'), L35: rect(3, 5, 'ell'), J45: rect(4, 5, 'jay'),
    O: rect(2, 2), H: rect(2, 1), U: rect(1, 2)
  };
  var SEQ = ['A34','V5','N33','A42','L35','V6','A23','H5','A33','J45','A24','V5','N34','A32','H6','A43','V6','A23','L35','A42','N33','V5','A34','H5'];

  function abs(p, c, r) { var cc = c == null ? p.c : c, rr = r == null ? p.r : r; return p.cells.map(function (o) { return [o[0] + cc, o[1] + rr]; }); }
  function clone(pos) { var out = {}; Object.keys(pos).forEach(function (k) { var p = pos[k]; out[k] = { c: p.c, r: p.r, cells: p.cells, item: p.item }; }); return out; }

  var defaults = {};
  function defaultLayout(cols) {
    if (defaults[cols]) return defaults[cols];
    var n = items.length, sum = 0;
    for (var s0 = 0; s0 < n; s0++) sum += SH[SEQ[s0 % SEQ.length]].length;
    var rows = Math.max(6, Math.ceil(sum * 0.98 / cols));
    for (var attempt = 0; attempt < 30; attempt++, rows++) {
      var occ = {}, voids = cols >= 20 ? [[7,4],[15,9],[22,2],[29,8],[11,11],[33,1],[4,10],[26,5]] : [[4,3],[9,10],[2,18],[11,24]];
      voids.forEach(function (v) { if (v[0] < cols && v[1] < rows) occ[v[0] + ',' + v[1]] = 'void'; });
      var anchors = [];
      for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) anchors.push([c, r]);
      anchors.sort(function (a, b) { return (a[0] + a[1] * 0.45) - (b[0] + b[1] * 0.45) || a[1] - b[1]; });
      var pos = {}, good = true, maxR = 0;
      var keyOf = function (a) { return a[0] + a[1] * 0.45; };
      for (var i = 0; i < n && good; i++) {
        var base = SH[SEQ[i % SEQ.length]];
        var cands = [base, base.map(function (o) { return [o[1], o[0]]; }), SH.O, SH.H, SH.U];
        var found = cands.map(function (sh) {
          for (var ai = 0; ai < anchors.length; ai++) {
            var ax = anchors[ai][0], ay = anchors[ai][1];
            var fits = sh.every(function (o) { var x = o[0] + ax, y = o[1] + ay; return x < cols && y < rows && !occ[x + ',' + y]; });
            if (fits) return { sh: sh, a: anchors[ai], k: keyOf(anchors[ai]) };
          }
          return null;
        });
        var best = null;
        found.forEach(function (f) { if (f && (!best || f.k < best.k)) best = f; });
        if (!best) { good = false; break; }
        var choice = best;
        if (found[0] && found[0].k <= best.k + 3) choice = found[0];
        else if (found[1] && found[1].k <= best.k + 3) choice = found[1];
        (function (ch) {
          ch.sh.forEach(function (o) { var y = o[1] + ch.a[1]; occ[(o[0] + ch.a[0]) + ',' + y] = 1; if (y > maxR) maxR = y; });
          pos[items[i].id] = { c: ch.a[0], r: ch.a[1], cells: ch.sh, item: items[i].id };
        })(choice);
      }
      if (good) { defaults[cols] = { pos: pos, rows: maxR + 1 }; return defaults[cols]; }
    }
    return { pos: {}, rows: rows };
  }

  /* ---------- Storage ---------- */
  var saved = { v: 3, layouts: {}, read: [], last: null };
  try { var st = localStorage.getItem(KEY); if (st) { var p0 = JSON.parse(st); if (p0 && p0.v === 3) saved = p0; } } catch (e) {}
  function loadPos(cols) {
    var d = defaultLayout(cols), sv = (saved.layouts || {})[cols];
    if (!sv) return clone(d.pos);
    var occ = {}, valid = true, covered = {};
    Object.keys(sv).forEach(function (pid) {
      var p = sv[pid];
      if (!p || !byId[p.item] || !p.cells || !p.cells.length) { valid = false; return; }
      covered[p.item] = 1;
      abs(p).forEach(function (q) {
        var k = q[0] + ',' + q[1];
        if (q[0] < 0 || q[1] < 0 || q[0] >= cols || q[1] >= d.rows || occ[k]) valid = false;
        occ[k] = pid;
      });
    });
    items.forEach(function (it) { if (!covered[it.id]) valid = false; });
    return valid ? clone(sv) : clone(d.pos);
  }
  function save() {
    saved.layouts = saved.layouts || {};
    saved.layouts[S.cols] = clone(S.pos);
    saved.read = S.read; saved.last = S.sel;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  /* ---------- State ---------- */
  var field = document.getElementById('field');
  var slipEl = document.getElementById('slip');
  var statusEl = document.getElementById('status');
  var trayEl = document.getElementById('tray');
  var S = {
    cols: 36, fw: field.getBoundingClientRect().width || 1376, rows: 12, pos: {},
    read: (saved.read || []).filter(function (id) { return byId[id]; }),
    sel: null, hov: null, drag: null, overTray: false, trayOpen: false, cat: null, hammer: false, crack: null
  };
  S.cols = S.fw < 720 ? 14 : 36;
  S.rows = defaultLayout(S.cols).rows;
  S.pos = loadPos(S.cols);
  S.sel = S.pos[saved.last] ? saved.last : null;

  function status(msg) { statusEl.textContent = msg; }
  function cs() { return S.fw / S.cols; }

  /* ---------- Actions ---------- */
  function occupancy(pos, except) {
    var occ = {};
    Object.keys(pos).forEach(function (pid) {
      if (except && except.indexOf(pid) >= 0) return;
      abs(pos[pid]).forEach(function (q) { occ[q[0] + ',' + q[1]] = pid; });
    });
    return occ;
  }
  function tryMove(pid, dc, dr) {
    if (!dc && !dr) return;
    var me = S.pos[pid]; if (!me) return;
    var nc = me.c + dc, nr = me.r + dr, mine = abs(me, nc, nr), title = byId[me.item].title;
    var inB = function (cells) { return cells.every(function (q) { return q[0] >= 0 && q[1] >= 0 && q[0] < S.cols && q[1] < S.rows; }); };
    if (!inB(mine)) { status('That would leave the field. "' + title + '" returned.'); return; }
    var occ = occupancy(S.pos, [pid]), hit = {};
    mine.forEach(function (q) { var o = occ[q[0] + ',' + q[1]]; if (o) hit[o] = 1; });
    var hits = Object.keys(hit), np = clone(S.pos);
    if (hits.length === 0) {
      np[pid].c = nc; np[pid].r = nr; S.pos = np;
      status('Moved "' + title + '".'); save(); sync(); return;
    }
    if (hits.length === 1) {
      var b = hits[0], B = S.pos[b], bCells = abs(B, me.c, me.r), occ2 = occupancy(S.pos, [pid, b]), mineSet = {};
      mine.forEach(function (q) { mineSet[q[0] + ',' + q[1]] = 1; });
      var okB = inB(bCells) && bCells.every(function (q) { var k = q[0] + ',' + q[1]; return !occ2[k] && !mineSet[k]; });
      var okMe = mine.every(function (q) { return !occ2[q[0] + ',' + q[1]]; });
      if (okB && okMe) {
        np[pid].c = nc; np[pid].r = nr; np[b].c = me.c; np[b].r = me.r; S.pos = np;
        status('Swapped "' + title + '" with "' + byId[B.item].title + '".'); save(); sync(); return;
      }
    }
    status('No room there. "' + title + '" returned to its place.');
    sync();
  }
  var crackTimer = null;
  function split(pid) {
    var p = S.pos[pid]; if (!p) return;
    var title = byId[p.item].title;
    if (p.cells.length < 2) { status('That piece of "' + title + '" is too small to break.'); return; }
    function connected(cells) {
      var set = {}, stack = [cells[0]], seenC = {}, n = 0;
      cells.forEach(function (q) { set[q[0] + ',' + q[1]] = 1; });
      seenC[cells[0][0] + ',' + cells[0][1]] = 1;
      while (stack.length) {
        var q = stack.pop(); n++;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(function (d) {
          var k = (q[0] + d[0]) + ',' + (q[1] + d[1]);
          if (set[k] && !seenC[k]) { seenC[k] = 1; stack.push([q[0] + d[0], q[1] + d[1]]); }
        });
      }
      return n === cells.length;
    }
    function norm(cells) {
      var mx = 1e9, my = 1e9;
      cells.forEach(function (q) { mx = Math.min(mx, q[0]); my = Math.min(my, q[1]); });
      return { dx: mx, dy: my, cells: cells.map(function (q) { return [q[0] - mx, q[1] - my]; }) };
    }
    function sig(cells) { return cells.map(function (q) { return q[0] + '.' + q[1]; }).sort().join('|'); }
    var w = 0, h = 0;
    p.cells.forEach(function (q) { w = Math.max(w, q[0] + 1); h = Math.max(h, q[1] + 1); });
    var good = [], fine = [];
    function consider(a, b) {
      if (a.length && b.length && connected(a) && connected(b)) { var A = norm(a), B = norm(b); (sig(A.cells) !== sig(B.cells) ? good : fine).push([A, B]); }
    }
    for (var k = 1; k < w; k++) consider(p.cells.filter(function (q) { return q[0] < k; }), p.cells.filter(function (q) { return q[0] >= k; }));
    for (var j = 1; j < h; j++) consider(p.cells.filter(function (q) { return q[1] < j; }), p.cells.filter(function (q) { return q[1] >= j; }));
    var pool = good.length ? good : fine;
    if (!pool.length) { status('That piece of "' + title + '" will not break cleanly.'); return; }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var np = clone(S.pos), ida = pid + 'a', idb = pid + 'b';
    delete np[pid];
    np[ida] = { c: p.c + pick[0].dx, r: p.r + pick[0].dy, cells: pick[0].cells, item: p.item };
    np[idb] = { c: p.c + pick[1].dx, r: p.r + pick[1].dy, cells: pick[1].cells, item: p.item };
    S.pos = np;
    if (S.sel === pid) S.sel = ida;
    S.hov = null; S.crack = { a: ida, b: idb };
    status('Cracked "' + title + '" into two pieces. Both still open the same record.');
    save(); sync(); renderInspector();
    var a = els[ida], b = els[idb];
    if (document.activeElement === document.body && a) a.focus({ preventScroll: true });
    clearTimeout(crackTimer);
    crackTimer = setTimeout(function () { S.crack = null; sync(); }, 380);
    void b;
  }
  function addRead(id) {
    if (S.read.indexOf(id) >= 0) { status('"' + byId[id].title + '" is already in READ.'); return; }
    S.read = S.read.concat([id]);
    status('Added "' + byId[id].title + '" to READ. A trace stays in the field.');
    save(); sync(); renderTray(); renderInspector();
  }
  function removeRead(id) {
    S.read = S.read.filter(function (x) { return x !== id; });
    status('Returned "' + byId[id].title + '" to the field.');
    save(); sync(); renderTray(); renderInspector();
  }
  function select(pid) { S.sel = pid; save(); sync(); renderInspector(); }

  /* ---------- Rendering: pieces are created once and updated in place ---------- */
  var els = {};
  function pieceEl(pid) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pc';
    b.addEventListener('mouseenter', function () { if (!S.drag) { S.hov = pid; sync(); } });
    b.addEventListener('mouseleave', function () { if (S.hov === pid) { S.hov = null; sync(); } });
    b.addEventListener('focus', function () { if (!S.drag) { S.hov = pid; sync(); } });
    b.addEventListener('blur', function () { if (S.hov === pid) { S.hov = null; sync(); } });
    b.addEventListener('pointerdown', function (e) {
      if (S.hammer || e.pointerType === 'touch' || e.button !== 0) return;
      dragInfo = { id: pid, sx: e.clientX, sy: e.clientY, moved: false };
      try { b.setPointerCapture(e.pointerId); } catch (x) {}
    });
    b.addEventListener('pointermove', function (e) {
      var d = dragInfo; if (!d || d.id !== pid) return;
      var dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.sqrt(dx * dx + dy * dy) < 5) return;
      d.moved = true; d.dx = dx; d.dy = dy; d.over = inTray(e.clientX, e.clientY);
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (!dragInfo) return;
        S.drag = { id: dragInfo.id, dx: dragInfo.dx, dy: dragInfo.dy }; S.overTray = dragInfo.over; S.hov = null;
        sync(); renderTrayState();
      });
    });
    function end() {
      var d = dragInfo; dragInfo = null;
      if (!d || d.id !== pid) return;
      if (d.moved) {
        justDragged = true; setTimeout(function () { justDragged = false; }, 50);
        S.drag = null; S.overTray = false; renderTrayState();
        var p = S.pos[pid];
        if (d.over && p) { sync(); addRead(p.item); }
        else tryMove(pid, Math.round(d.dx / cs()), Math.round(d.dy / cs()));
      }
    }
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
    b.addEventListener('click', function () {
      if (justDragged) return;
      if (S.hammer) { split(pid); return; }
      select(S.sel === pid ? null : pid);
    });
    field.appendChild(b);
    return b;
  }
  var dragInfo = null, raf = 0, justDragged = false;
  function inTray(x, y) { var r = trayEl.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }

  var ghostEls = [];
  function sync() {
    var c = cs();
    field.style.height = (S.rows * c).toFixed(0) + 'px';
    field.style.backgroundSize = c.toFixed(2) + 'px ' + c.toFixed(2) + 'px';
    field.classList.toggle('hammer', S.hammer);
    var pids = Object.keys(S.pos).sort(function (a, b) {
      var ia = byId[S.pos[a].item].idx, ib = byId[S.pos[b].item].idx;
      return ia - ib || (a < b ? -1 : 1);
    });
    Object.keys(els).forEach(function (pid) { if (!S.pos[pid]) { els[pid].remove(); delete els[pid]; } });
    var hoverBox = null;
    pids.forEach(function (pid) {
      var p = S.pos[pid], it = byId[p.item], b = els[pid] || (els[pid] = pieceEl(pid));
      var cells = abs(p), set = {};
      cells.forEach(function (q) { set[q[0] + ',' + q[1]] = 1; });
      var minC = 1e9, minR = 1e9, maxC = -1, maxR = -1;
      cells.forEach(function (q) { minC = Math.min(minC, q[0]); minR = Math.min(minR, q[1]); maxC = Math.max(maxC, q[0]); maxR = Math.max(maxR, q[1]); });
      var inRead = S.read.indexOf(it.id) >= 0, selected = S.sel === pid, frag = pid !== it.id;
      var dragging = S.drag && S.drag.id === pid, lifted = dragging || S.hov === pid, dim = S.cat && S.cat !== it.cat;
      var cC = (minC + maxC) / 2, cR = (minR + maxR) / 2;
      var key = [c.toFixed(2), selected, cells.join(';')].join('#');
      if (b._key !== key) {
        b._key = key;
        var html = '';
        cells.forEach(function (q) {
          var L = !set[(q[0] - 1) + ',' + q[1]], R = !set[(q[0] + 1) + ',' + q[1]], T = !set[q[0] + ',' + (q[1] - 1)], B = !set[q[0] + ',' + (q[1] + 1)];
          var sh = [];
          if (selected) {
            if (L) sh.push('inset 2px 0 0 #111'); if (R) sh.push('inset -2px 0 0 #111');
            if (T) sh.push('inset 0 2px 0 #111'); if (B) sh.push('inset 0 -2px 0 #111');
          }
          html += '<span class="cell" style="left:' + ((q[0] - minC) * c + (L ? G : 0)).toFixed(1) + 'px;top:' + ((q[1] - minR) * c + (T ? G : 0)).toFixed(1) +
            'px;width:' + (c - (L ? G : 0) - (R ? G : 0)).toFixed(1) + 'px;height:' + (c - (T ? G : 0) - (B ? G : 0)).toFixed(1) +
            'px;background:' + ok(it.h + (q[0] - cC) * 1.8, (cR - q[1]) * 0.008) + ';box-shadow:' + (sh.length ? sh.join(',') : 'none') + '"></span>';
        });
        b.innerHTML = html;
      }
      var tf = 'none';
      if (dragging) tf = 'translate(' + (S.drag.dx - 2) + 'px,' + (S.drag.dy - 3) + 'px)';
      else if (S.crack && S.crack.a === pid) tf = 'translate(-6px,-3px) rotate(-2deg)';
      else if (S.crack && S.crack.b === pid) tf = 'translate(6px,3px) rotate(2deg)';
      else if (lifted) tf = 'translate(-2px,-3px)';
      var op = 1;
      if (inRead) op = selected || lifted ? 0.42 : 0.2;
      if (dim) op = Math.min(op, 0.12);
      if (dragging && S.overTray) op = 0.55;
      var bx = minC * c, by = minR * c, bw = (maxC - minC + 1) * c, bh = (maxR - minR + 1) * c;
      b.style.left = bx.toFixed(1) + 'px'; b.style.top = by.toFixed(1) + 'px';
      b.style.width = bw.toFixed(1) + 'px'; b.style.height = bh.toFixed(1) + 'px';
      b.style.transform = tf; b.style.opacity = op;
      b.style.zIndex = dragging ? 30 : (lifted ? 6 : 1);
      b.style.filter = lifted && !inRead ? (dragging ? 'drop-shadow(0 14px 14px rgba(17,17,17,.3))' : 'drop-shadow(0 5px 6px rgba(17,17,17,.18))') : 'none';
      b.classList.toggle('dragging', !!dragging);
      b.setAttribute('aria-pressed', selected ? 'true' : 'false');
      b.setAttribute('aria-label', it.fig + (frag ? ', fragment' : '') + ', ' + CATS[it.cat].name + ', ' + it.type + ': ' + it.title + (inRead ? '. In READ.' : '') + (S.hammer ? ' Press to break.' : ''));
      if (S.hov === pid) hoverBox = { pid: pid, it: it, bx: bx, by: by, bh: bh, n: cells.length, frag: frag, inRead: inRead };
    });
    // ghost
    ghostEls.forEach(function (g) { g.remove(); }); ghostEls = [];
    if (S.drag && !S.overTray && S.pos[S.drag.id]) {
      var gp = S.pos[S.drag.id], dc = Math.round(S.drag.dx / c), dr = Math.round(S.drag.dy / c);
      abs(gp, gp.c + dc, gp.r + dr).forEach(function (q) {
        if (q[0] < 0 || q[1] < 0 || q[0] >= S.cols || q[1] >= S.rows) return;
        var g = document.createElement('span');
        g.className = 'ghost'; g.setAttribute('aria-hidden', 'true');
        g.style.left = (q[0] * c) + 'px'; g.style.top = (q[1] * c) + 'px'; g.style.width = c + 'px'; g.style.height = c + 'px';
        field.insertBefore(g, field.firstChild); ghostEls.push(g);
      });
    }
    // slip
    if (hoverBox && !S.drag && window.matchMedia('(hover: hover)').matches) {
      var above = hoverBox.by > 130, it2 = hoverBox.it;
      slipEl.hidden = false;
      slipEl.style.left = Math.max(0, Math.min(hoverBox.bx, S.fw - 284)).toFixed(0) + 'px';
      slipEl.style.top = (above ? hoverBox.by - 12 : hoverBox.by + hoverBox.bh + 12).toFixed(0) + 'px';
      slipEl.style.transform = above ? 'translateY(-100%)' : 'none';
      slipEl.querySelector('.sw').style.background = it2.color;
      slipEl.querySelector('.fg').textContent = it2.fig + (hoverBox.frag ? ' · fragment' : '');
      slipEl.querySelector('.ty').textContent = it2.type + ' · W=' + hoverBox.n;
      slipEl.querySelector('.ti').textContent = it2.title;
      slipEl.querySelector('.de').textContent = it2.dek;
      slipEl.querySelector('.rd').hidden = !hoverBox.inRead;
    } else { slipEl.hidden = true; }
    document.getElementById('kicker').textContent = 'I. ARCHIVE · ' + items.length + ' RECORDS · ' + pids.length + ' PIECES · SIX CLASSIFICATIONS';
  }

  /* ---------- Legend ---------- */
  var legendEl = document.getElementById('legend');
  Object.keys(CATS).forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lg'; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span class="sw" aria-hidden="true" style="background:' + CATS[k].swatch + '"></span><span style="color:var(--muted)">' + k + '</span><span class="ln"></span>';
    b.querySelector('.ln').textContent = CATS[k].name;
    b.addEventListener('click', function () {
      S.cat = S.cat === k ? null : k;
      legendEl.querySelectorAll('.lg').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      if (S.cat) b.setAttribute('aria-pressed', 'true');
      sync();
    });
    legendEl.appendChild(b);
  });

  /* ---------- Inspector ---------- */
  var inspEl = document.getElementById('inspector');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var arrow = { L: 'M15 5l-7 7 7 7', U: 'M5 15l7-7 7 7', D: 'M5 9l7 7 7-7', R: 'M9 5l7 7-7 7' };
  function renderInspector() {
    var act = document.activeElement && inspEl.contains(document.activeElement) ? document.activeElement.getAttribute('data-act') : null;
    var p = S.sel ? S.pos[S.sel] : null, it = p ? byId[p.item] : null;
    if (!it) {
      inspEl.innerHTML = '<p class="mo empty">No record selected. Click or tap a shape, or Tab to one and press Enter. From here you can open it, collect it, break it, or move it without dragging.</p>';
      return;
    }
    var inRead = S.read.indexOf(it.id) >= 0;
    var openBtn = it.href ? '<a class="ctl" data-act="open" href="' + esc(it.href) + '">Open record</a>' : '<span class="ctl" aria-disabled="true" style="opacity:.5;cursor:default">Record in preparation</span>';
    inspEl.innerHTML =
      '<div class="insp"><div class="info">' +
      '<p class="mo meta"><span class="sw" aria-hidden="true" style="background:' + it.color + '"></span>' + esc(it.fig + (S.sel !== it.id ? ' · fragment' : '') + ' · ' + CATS[it.cat].name + ' · ' + it.type) + '</p>' +
      '<h2>' + esc(it.title) + '</h2><p class="de">' + esc(it.dek) + '</p></div>' +
      '<div class="acts"><div>' + openBtn +
      '<button type="button" class="ctl" data-act="read">' + (inRead ? 'Return to field' : 'Add to READ') + '</button>' +
      '<button type="button" class="ctl" data-act="break">Break</button>' +
      '<button type="button" class="ctl" data-act="deselect">Deselect</button></div>' +
      '<div role="group" aria-label="Move this shape"><span class="mo" style="font-size:11px;color:var(--muted);margin-right:4px">Move</span>' +
      ['L', 'U', 'D', 'R'].map(function (d) {
        var lbl = { L: 'Move left', U: 'Move up', D: 'Move down', R: 'Move right' }[d];
        return '<button type="button" class="ctl" data-act="mv' + d + '" aria-label="' + lbl + '"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="' + arrow[d] + '"></path></svg></button>';
      }).join('') + '</div></div></div>';
    if (act) { var again = inspEl.querySelector('[data-act="' + act + '"]'); if (again) again.focus({ preventScroll: true }); }
  }
  inspEl.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), p = S.sel ? S.pos[S.sel] : null;
    if (!p) return;
    if (a === 'read') { if (S.read.indexOf(p.item) >= 0) removeRead(p.item); else addRead(p.item); }
    else if (a === 'break') split(S.sel);
    else if (a === 'deselect') select(null);
    else if (a === 'mvL') tryMove(S.sel, -1, 0);
    else if (a === 'mvR') tryMove(S.sel, 1, 0);
    else if (a === 'mvU') tryMove(S.sel, 0, -1);
    else if (a === 'mvD') tryMove(S.sel, 0, 1);
  });

  /* ---------- READ tray ---------- */
  var trayList = document.getElementById('trayList'), trayToggle = document.getElementById('trayToggle');
  function renderTrayState() {
    trayEl.classList.toggle('dragging', !!S.drag);
    trayEl.classList.toggle('over', !!S.overTray);
    document.getElementById('trayHint').textContent = S.drag ? (S.overTray ? 'Release to collect.' : 'Drop here to collect.') : 'Drag a shape here, or use Add to READ.';
  }
  function renderTray() {
    document.getElementById('readCount').textContent = S.read.length;
    trayToggle.textContent = S.trayOpen ? 'Close collection' : 'Open collection';
    trayToggle.setAttribute('aria-expanded', S.trayOpen ? 'true' : 'false');
    trayList.hidden = !S.trayOpen;
    if (!S.trayOpen) return;
    if (!S.read.length) { trayList.innerHTML = '<p class="mo" style="margin:0;font-size:11px">Nothing collected yet.</p>'; return; }
    trayList.innerHTML = '<ul>' + S.read.map(function (id) {
      var it = byId[id];
      var open = it.href ? '<a class="ctl" href="' + esc(it.href) + '">Open</a>' : '';
      return '<li><span class="sw" aria-hidden="true" style="background:' + it.color + '"></span><span class="nm"><span class="mo" style="font-size:11px;color:var(--muted)">' + esc(it.fig) + '</span> ' + esc(it.title) + '</span>' + open +
        '<button type="button" class="ctl" data-remove="' + id + '" aria-label="Remove ' + esc(it.title) + ' from READ">Remove</button></li>';
    }).join('') + '</ul>';
  }
  trayToggle.addEventListener('click', function () { S.trayOpen = !S.trayOpen; renderTray(); });
  trayList.addEventListener('click', function (e) { var t = e.target.closest('[data-remove]'); if (t) removeRead(t.getAttribute('data-remove')); });

  /* ---------- Header controls ---------- */
  var hammerBtn = document.getElementById('hammer');
  hammerBtn.addEventListener('click', function () {
    S.hammer = !S.hammer;
    hammerBtn.setAttribute('aria-pressed', S.hammer ? 'true' : 'false');
    hammerBtn.querySelector('span').textContent = S.hammer ? 'Put the hammer down' : 'Hammer';
    status(S.hammer ? 'Hammer in hand. Click a shape to crack it in two.' : 'Hammer put down.');
    sync();
  });
  document.getElementById('reset').addEventListener('click', function () {
    S.pos = clone(defaultLayout(S.cols).pos);
    if (!S.pos[S.sel]) S.sel = null;
    S.crack = null;
    status('Original chromatic arrangement restored. Broken pieces made whole.');
    save(); sync(); renderInspector();
  });

  /* ---------- Resize ---------- */
  function measure() {
    var w = field.getBoundingClientRect().width || S.fw, cols = w < 720 ? 14 : 36;
    if (cols !== S.cols) {
      S.cols = cols; S.fw = w; S.rows = defaultLayout(cols).rows; S.pos = loadPos(cols);
      if (!S.pos[S.sel]) S.sel = null;
      Object.keys(els).forEach(function (pid) { els[pid].remove(); delete els[pid]; });
      sync(); renderInspector();
    } else if (Math.abs(w - S.fw) > 1) { S.fw = w; sync(); }
  }
  if (window.ResizeObserver) new ResizeObserver(measure).observe(field);
  else window.addEventListener('resize', measure);

  sync(); renderInspector(); renderTray(); renderTrayState();
})();
