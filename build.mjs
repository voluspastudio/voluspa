// VP Studio build: copies the static site into dist/ and turns Obsidian
// articles (content/articles/*.md) into designed pages under /research.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');
const ARTICLES = path.join(CONTENT, 'articles');
const IS_PROD = process.env.VERCEL_ENV === 'production';
const SKIP = new Set(['dist', 'node_modules', 'content', '.git', '.github', 'build.mjs', 'package.json', 'package-lock.json', '.gitignore', 'README.md', 'vercel.json', '.vercel']);

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function copyDir(src, dst, top = false) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (top && SKIP.has(e.name)) continue;
    if (e.name.startsWith('.') && e.name !== '.well-known') continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

/* ---------- site data (categories + records) from assets/content.js ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/content.js'), 'utf8'), sandbox);
const VP = sandbox.window.VP;
const CATS = VP.categories;
function okColor(h) {
  const L = 0.665 + 0.075 * Math.cos((h - 100) * Math.PI / 180);
  return `oklch(${L.toFixed(3)} 0.125 ${(((h % 360) + 360) % 360).toFixed(1)})`;
}
function catKey(v) {
  if (!v) return 'X';
  const s = String(v).trim();
  if (CATS[s.toUpperCase()]) return s.toUpperCase();
  const hit = Object.keys(CATS).find((k) => CATS[k].name.toLowerCase().startsWith(s.toLowerCase()));
  return hit || 'X';
}

/* ---------- media: every non-markdown file in content/ is published under /media ---------- */
const media = new Map();
for (const f of walk(CONTENT)) {
  if (f.endsWith('.md') || f.includes(`${path.sep}_templates${path.sep}`)) continue;
  media.set(path.basename(f), f);
}
const mediaUrl = (name) => (media.has(name) ? `/media/${encodeURIComponent(name)}` : null);

/* ---------- markdown ---------- */
const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(footnote);
md.renderer.rules.footnote_block_open = () => '<section class="refs" aria-labelledby="refs-h"><h2 id="refs-h">References and notes</h2><ol class="refs-list">\n';
md.renderer.rules.footnote_block_close = () => '</ol></section>\n';

const CALLOUT_LABEL = { note: 'Note', observation: 'Observation', finding: 'Finding', speculation: 'Speculation', try: 'Try it', quote: 'Quote', question: 'Question', method: 'Method', info: 'Note', tip: 'Note' };
const MARGIN = new Set(['note', 'observation', 'try', 'info', 'tip', 'question']);

function preprocess(src, slugByTitle) {
  // Obsidian image embeds: ![[file.png]] or ![[file.png|caption]]
  src = src.replace(/!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (m, file, cap) => {
    const url = mediaUrl(file.trim());
    if (!url) return `*[missing image: ${file}]*`;
    const caption = cap && !/^\d+(x\d+)?$/.test(cap.trim()) ? cap.trim() : '';
    return `![${caption}](${url})`;
  });
  // Standard markdown images that point at local files
  src = src.replace(/!\[([^\]]*)\]\((?!https?:)([^)]+)\)/g, (m, alt, file) => {
    const url = mediaUrl(decodeURIComponent(path.basename(file)));
    return url ? `![${alt}](${url})` : m;
  });
  // Wikilinks to other articles: [[Title]] or [[Title|label]]
  src = src.replace(/\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (m, target, label) => {
    const slug = slugByTitle.get(target.trim().toLowerCase());
    const text = (label || target).trim();
    return slug ? `[${text}](/research/${slug})` : text;
  });
  // Callouts: > [!type] Title
  const lines = src.split('\n'), out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^>\s*\[!(\w+)\][+-]?\s*(.*)$/);
    if (!m) { out.push(lines[i]); continue; }
    const type = m[1].toLowerCase(), title = m[2].trim(), inner = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) { i++; inner.push(lines[i].replace(/^>\s?/, '')); }
    const label = CALLOUT_LABEL[type] || (type[0].toUpperCase() + type.slice(1));
    const cls = MARGIN.has(type) ? 'note note-margin' : 'note note-inline';
    out.push('', `<aside class="${cls} note-${esc(type)}"><p class="note-label">${esc(label)}${title ? ' · ' + esc(title) : ''}</p>`, '', ...inner, '', '</aside>', '');
  }
  return out.join('\n');
}
function postprocess(html) {
  let n = 0;
  return html.replace(/<p><img src="([^"]+)" alt="([^"]*)"\s*\/?><\/p>/g, (m, src, alt) => {
    n++;
    const cap = alt ? ` ${alt}` : '';
    return `<figure class="fig"><img src="${src}" alt="${alt}" loading="lazy"><figcaption><span class="fig-n">Fig. ${n}.</span>${cap}</figcaption></figure>`;
  });
}

/* ---------- read articles ---------- */
function parse(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const fm = m ? (yaml.load(m[1]) || {}) : {};
  const body = m ? m[2] : raw;
  const rawTitle = String(fm.title || path.basename(file, '.md'));
  const title = rawTitle.replace(/(\w)'(\w)/g, '$1\u2019$2');
  const cat = catKey(fm.category);
  const c = CATS[cat];
  const hue = (c.hue[0] + c.hue[1]) / 2;
  const date = fm.date ? new Date(fm.date) : fs.statSync(file).mtime;
  return {
    file, title, body,
    slug: fm.slug ? slugify(fm.slug) : slugify(rawTitle),
    publish: fm.publish === true || String(fm.publish).toLowerCase() === 'true',
    cat, catName: c.name,
    type: fm.type || 'Essay',
    abstract: fm.abstract || '',
    figure: fm.figure ? String(fm.figure) : '',
    layout: ['long-read', 'plate', 'spread'].includes(fm.layout) ? fm.layout : 'long-read',
    accent: fm.accent || okColor(hue),
    cover: fm.cover ? mediaUrl(String(fm.cover).replace(/^!?\[\[|\]\]$/g, '').trim()) : null,
    coverCaption: fm.cover_caption || '',
    treatment: fm.treatment === 'halftone' ? 'halftone' : 'none',
    date: isNaN(date) ? new Date() : date
  };
}
const all = walk(ARTICLES).filter((f) => f.endsWith('.md')).map(parse);
const articles = all.filter((a) => a.publish || !IS_PROD).sort((a, b) => b.date - a.date);
const slugByTitle = new Map(articles.flatMap((a) => [[a.title.toLowerCase(), a.slug], [a.title.toLowerCase().replace(/\u2019/g, "'"), a.slug]]));
const fmtDate = (d) => `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;

/* ---------- page shell ---------- */
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">';
const NAV = (cur) => [['/archive', 'I. Archive'], ['/research', 'II. Research'], ['/studio', 'III. Studio'], ['/about', 'IV. About']]
  .map(([h, l]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ''}>${l}</a>`).join('\n');
const shell = ({ title, desc, body, bodyClass = '', style = '', cur = '/research' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${FONTS}
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/article.css">
</head>
<body class="${bodyClass}"${style ? ` style="${style}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<div class="sheet">
<header class="masthead">
<div style="display: flex; flex-direction: column; gap: 4px">
<a href="/" class="wordmark">VP STUDIO</a>
<span class="mo" style="font-size: 11px; color: var(--muted)">An independent visual research archive</span>
</div>
<nav aria-label="Sections" class="nv mo">
${NAV(cur)}
</nav>
</header>
<main id="main">
${body}
</main>
<footer class="pagefoot mo"><span>VP Studio · Visual research archive</span><a href="/">Back to the current issue</a></footer>
</div>
</body>
</html>
`;

/* ---------- build ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT, true);
fs.mkdirSync(path.join(OUT, 'media'), { recursive: true });
for (const [name, file] of media) fs.copyFileSync(file, path.join(OUT, 'media', name));

const figCounts = {};
for (const a of [...articles].sort((x, y) => x.date - y.date)) {
  figCounts[a.cat] = (figCounts[a.cat] || 0) + 1;
  if (!a.figure) a.figure = `${a.cat}.${String(figCounts[a.cat]).padStart(2, '0')}`;
  else if (!/^[A-Z]\./.test(a.figure)) a.figure = `${a.cat}.${a.figure}`;
}

for (const a of articles) {
  const html = postprocess(md.render(preprocess(a.body, slugByTitle)));
  const words = a.body.replace(/[#>*_`\[\]()!|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 230));
  const related = articles.filter((o) => o !== a && o.cat === a.cat).slice(0, 3);
  const others = related.length ? related : articles.filter((o) => o !== a).slice(0, 3);
  const cover = a.cover ? `<figure class="art-cover ${a.treatment === 'halftone' ? 'halftone' : ''}"><img src="${a.cover}" alt="${esc(a.coverCaption || a.title)}"><figcaption class="mo">${a.coverCaption ? esc(a.coverCaption) : `FIG. ${esc(a.figure)}`}</figcaption></figure>` : '';
  const body = `
<article class="art">
${!a.publish ? '<p class="draft mo">DRAFT · visible on test links only. Set <code>publish: true</code> to put it on the live site.</p>' : ''}
<header class="art-open">
<p class="art-meta mo"><span class="sw" aria-hidden="true"></span>FIG. ${esc(a.figure)} · CLASS ${a.cat} / ${esc(a.catName.toUpperCase())} · ${esc(a.type.toUpperCase())} · ${fmtDate(a.date)} · ${mins} MIN</p>
<h1 class="art-title">${esc(a.title)}</h1>
${a.abstract ? `<p class="art-abstract">${esc(a.abstract)}</p>` : ''}
${cover}
</header>
<div class="art-body">
${html}
</div>
${others.length ? `<nav class="art-related" aria-labelledby="rel-h"><h2 id="rel-h" class="mo">Related investigations</h2><ul>${others.map((o) => `<li><a href="/research/${o.slug}"><span class="mo">FIG. ${esc(o.figure)}</span> ${esc(o.title)}</a></li>`).join('')}</ul></nav>` : ''}
</article>`;
  const dir = path.join(OUT, 'research', a.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell({
    title: `${a.title} · VP Studio`, desc: a.abstract || a.title, body,
    bodyClass: `article layout-${a.layout}`, style: `--accent: ${a.accent}`
  }));
}

/* ---------- research index ---------- */
fs.mkdirSync(path.join(OUT, 'research'), { recursive: true });
const list = articles.length
  ? `<ol class="toc">${articles.map((a) => `<li><a href="/research/${a.slug}"><span class="toc-fig mo">FIG. ${esc(a.figure)}</span><span class="toc-title">${esc(a.title)}${a.publish ? '' : ' <em class="mo">(draft)</em>'}</span><span class="toc-meta mo"><span class="sw" style="background:${a.accent}" aria-hidden="true"></span>${esc(a.catName)} · ${esc(a.type)} · ${fmtDate(a.date)}</span></a></li>`).join('')}</ol>`
  : '<p class="mo" style="font-size: 12px; color: var(--muted)">The first investigations are in preparation.</p>';
fs.writeFileSync(path.join(OUT, 'research', 'index.html'), shell({
  title: 'VP Studio · Research', desc: 'Investigations from VP Studio into how we see, remember and respond.',
  body: `<section class="intro"><div style="flex: 999 1 520px; min-width: 0"><p class="mo kicker">II. RESEARCH · ${articles.length} INVESTIGATION${articles.length === 1 ? '' : 'S'}</p><h1 class="display">Investigations</h1></div></section>${list}`
}));

/* ---------- archive + cover data ---------- */
const forArchive = articles.filter((a) => a.publish || !IS_PROD).map((a) => ({ cat: a.cat, title: a.title, type: a.type, dek: a.abstract, href: `/research/${a.slug}` }));
fs.writeFileSync(path.join(OUT, 'assets', 'articles.js'), `window.VP_ARTICLES = ${JSON.stringify(forArchive)};\n`);
const archiveHtml = path.join(OUT, 'archive', 'index.html');
fs.writeFileSync(archiveHtml, fs.readFileSync(archiveHtml, 'utf8').replace('<script src="/assets/archive.js">', '<script src="/assets/articles.js"></script>\n<script src="/assets/archive.js">'));

console.log(`Built ${articles.length} article(s)${IS_PROD ? ' (published only)' : ' (including drafts)'}; ${media.size} media file(s).`);
