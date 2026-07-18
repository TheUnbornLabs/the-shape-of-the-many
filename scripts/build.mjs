// Static-site generator for "The Shape of the Many".
// Renders every book and chapter to REAL HTML at build time (no client-side
// content fetching), so crawlers, no-JS readers, and link previews get the
// actual text. JavaScript only enhances (global search, reading progress,
// continue-reading). Also copies typeset editions into downloads/ and emits a
// small manifest.json + sitemap.
//
// Usage: node scripts/build.mjs
import {
  readdirSync, readFileSync, writeFileSync, mkdirSync,
  existsSync, copyFileSync, rmSync, statSync
} from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const DL = join(ROOT, 'downloads');
const SITE_URL = 'https://theunbornlabs.github.io/the-shape-of-the-many';

// ---- Book metadata (permanent; mirrors README.md) --------------------------
const BOOKS = [
  { n: 1, dir: 'book-1-the-shape-forms',       title: 'The Shape Forms',      range: [1, 25],  gloss: 'The mechanism, its evolutionary roots, and the wise crowd.' },
  { n: 2, dir: 'book-2-the-shape-breaks',      title: 'The Shape Breaks',     range: [26, 43], gloss: 'Cascades, panics, and conformity — the frontier of imposed silence.' },
  { n: 3, dir: 'book-3-the-shape-flows',       title: 'The Shape Flows',      range: [44, 59], gloss: 'Networks and contagion: how the shape travels.' },
  { n: 4, dir: 'book-4-the-shape-holds-power', title: 'The Shape Holds Power',range: [60, 85], gloss: 'Markets, governance, and ideology — the climax.' },
  { n: 5, dir: 'book-5-the-shape-remade',      title: 'The Shape Remade',     range: [86, 100],gloss: 'Digital swarms, the toolkit, and epistemic humility.' }
];
const THESIS =
  'The wise crowd and the mob are the same people. One mechanism — local interaction ' +
  'producing group-level order — runs under different conditions, and a nameable ' +
  'condition flips the sign between collective wisdom and collective catastrophe.';

// ---- Tiny Markdown renderer (disciplined prose; see corpus) ----------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
}
function renderMarkdown(md, { dropFirstH1 = false } = {}) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = []; let para = [], list = null, quote = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; } };
  const flushQuote = () => { if (quote) { out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = null; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flushAll(); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = h[1].length;
      if (level === 1 && dropFirstH1) continue;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); quote = quote || []; quote.push(line.replace(/^>\s?/, '')); continue; }
    flushQuote();
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) { flushPara(); list = list || []; list.push(li[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushAll();
  return out.join('\n');
}
function wordCount(md) { return (md.replace(/[#>*_`-]/g, ' ').match(/\b[\w’'-]+\b/g) || []).length; }
function firstH1Title(md) { const m = md.match(/^#\s+(.*)$/m); return m ? m[1].trim() : null; }
function firstEpigraph(md) { const m = md.match(/^>\s?(.*(?:\n>.*)*)/m); return m ? m[0].replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim() : null; }

// ---- Image figure helpers --------------------------------------------------
function figureHtml(img) {
  if (!img || !img.src) return '';
  const credit = [img.credit, img.license].filter(Boolean).join(' · ');
  return `<figure class="chapter-figure">` +
    `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" referrerpolicy="no-referrer">` +
    `<figcaption>${escapeHtml(credit)}` +
    (img.source ? ` · <a href="${escapeHtml(img.source)}" target="_blank" rel="noopener">Wikimedia Commons</a>` : '') +
    `</figcaption></figure>`;
}
function injectFigure(html, fig) {
  if (!fig) return html;
  const close = html.indexOf('</blockquote>');
  if (close !== -1) { const at = close + '</blockquote>'.length; return html.slice(0, at) + '\n' + fig + html.slice(at); }
  return fig + '\n' + html;
}

// ---- Page chrome -----------------------------------------------------------
const chapterFile = (b, num) => `c-b${b}-${num}.html`;
const bookFile = (n) => `book-${n}.html`;

function page({ title, desc, canonical, body, jsonld = '', extraHead = '', bodyEnd = '' }) {
  const ogImg = `${SITE_URL}/assets/og-image.svg`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="The Shape of the Many" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />
<meta property="og:image" content="${ogImg}" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(desc)}" />
<meta name="twitter:image" content="${ogImg}" />
<link rel="stylesheet" href="assets/css/style.css" />
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
${extraHead}
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html">The Shape<span>·</span>of the Many</a>
    <div class="nav-spacer"></div>
    <nav class="topnav"><a href="index.html">Books</a><a href="dashboard.html">Progress</a><a href="about.html">About</a></nav>
    <div class="search-wrap">
      <input id="globalSearch" type="search" placeholder="Search 100 chapters…" autocomplete="off" aria-label="Search chapters" />
      <div id="searchResults" class="search-results" hidden></div>
    </div>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <span>The Shape of the Many</span><span>·</span>
    <a href="about.html">About &amp; sources</a><span>·</span>
    <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a><span>·</span>
    <a href="https://github.com/TheUnbornLabs/the-shape-of-the-many">Source</a>
  </div>
</footer>
<script src="assets/js/search.js"></script>
${bodyEnd}
</body>
</html>`;
}

function build() {
  const images = existsSync(join(DATA, 'images.json'))
    ? JSON.parse(readFileSync(join(DATA, 'images.json'), 'utf8')) : {};

  // Interactive learning data, keyed "book/num" (currently Book One pilot).
  const interactive = {};
  const ixDir = join(DATA, 'interactive');
  if (existsSync(ixDir)) {
    for (const f of readdirSync(ixDir).filter((x) => /^book-\d+\.json$/.test(x))) {
      const d = JSON.parse(readFileSync(join(ixDir, f), 'utf8'));
      for (const [num, entry] of Object.entries(d.chapters || {})) {
        interactive[`${d.book}/${num}`] = { ...entry, catName: (d.categories || {})[entry.category] || entry.category };
      }
    }
  }

  // ---- Pass 1: gather everything --------------------------------------------
  const books = [];
  let totalChapters = 0, totalWords = 0;
  for (const book of BOOKS) {
    const bookDir = join(ROOT, book.dir);
    const frontFile = readdirSync(bookDir).find((f) => /front-matter\.md$/.test(f));
    const backFile = readdirSync(bookDir).find((f) => /^zzz-.*\.md$/.test(f));
    const frontHtml = frontFile ? renderMarkdown(readFileSync(join(bookDir, frontFile), 'utf8'), { dropFirstH1: true }) : '';
    const backHtml = backFile ? renderMarkdown(readFileSync(join(bookDir, backFile), 'utf8'), { dropFirstH1: true }) : '';

    const chapterDirs = readdirSync(bookDir)
      .filter((f) => /^\d{3}-/.test(f) && statSync(join(bookDir, f)).isDirectory()).sort();
    const chapters = [];
    for (const cd of chapterDirs) {
      const num = cd.slice(0, 3), slug = cd.slice(4);
      const chPath = join(bookDir, cd, 'chapter.md');
      if (!existsSync(chPath)) continue;
      const md = readFileSync(chPath, 'utf8');
      const title = (firstH1Title(md) || `${parseInt(num, 10)}. ${slug}`).replace(/^\d+\.\s*/, '');
      const epigraph = firstEpigraph(md);
      const img = images[`${book.n}/${num}`] || null;
      const html = injectFigure(renderMarkdown(md, { dropFirstH1: true }), figureHtml(img));
      const words = wordCount(md); totalWords += words;
      const refPath = join(bookDir, cd, 'references.md');
      const refsHtml = existsSync(refPath) ? renderMarkdown(readFileSync(refPath, 'utf8'), { dropFirstH1: true }) : '';
      chapters.push({ num, n: parseInt(num, 10), slug, title, epigraph, words, html, refsHtml, img });
    }
    totalChapters += chapters.length;
    books.push({ ...book, frontHtml, backHtml, chapters, words: chapters.reduce((s, c) => s + c.words, 0) });
  }

  // ---- Pass 2: write pages --------------------------------------------------
  const pretty = (n) => n.toLocaleString('en-US');

  // Home
  const bookCards = books.map((b) => `
    <a class="book-card" href="${bookFile(b.n)}">
      <div class="book-num">${b.n}</div>
      <div class="book-body"><h3>${escapeHtml(b.title)}</h3><p>${escapeHtml(b.gloss)}</p></div>
      <div class="book-meta"><b>${b.chapters.length}</b>chapters<div>items ${b.range[0]}–${b.range[1]}</div></div>
    </a>`).join('');
  const seriesJsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BookSeries',
    name: 'The Shape of the Many', description: THESIS, url: SITE_URL + '/',
    numberOfBooks: books.length,
    hasPart: books.map((b) => ({ '@type': 'Book', name: b.title, url: `${SITE_URL}/${bookFile(b.n)}` }))
  });
  const home = page({
    title: 'The Shape of the Many — a five-book study of collective behaviour',
    desc: 'A five-book, 100-chapter literary study of human collective behaviour: how the same crowd becomes wise or catastrophic. Open, ad-free, CC BY 4.0.',
    canonical: SITE_URL + '/', jsonld: seriesJsonLd,
    body: `
    <section class="hero">
      <p class="eyebrow">A five-book series · ${totalChapters} chapters · ${pretty(Math.round(totalWords / 1000))}k words</p>
      <h1>The Shape of the Many</h1>
      <p class="thesis">${escapeHtml(THESIS)}</p>
      <div class="cta-row">
        <a class="btn-primary" href="${chapterFile(1, '001')}">Start reading →</a>
        <a class="btn-ghost" href="about.html">About the series</a>
      </div>
      <div id="continueReading" hidden></div>
      <div class="stats">
        <div class="stat"><span class="num">${books.length}</span><span class="lbl">Books</span></div>
        <div class="stat"><span class="num">${totalChapters}</span><span class="lbl">Chapters</span></div>
        <div class="stat"><span class="num">${pretty(Math.round(totalWords / 1000))}k</span><span class="lbl">Words</span></div>
      </div>
    </section>
    <h2 class="section-title">The five movements</h2>
    <div class="books">${bookCards}</div>
    <h2 class="section-title" id="downloads">Read offline</h2>
    <div class="downloads">
      <a class="dl-row" href="downloads/The-Shape-of-the-Many-COMPLETE.md"><span class="fmt md">MD</span><span class="nm">The complete series — single Markdown file</span></a>
      ${books.map((b) => `<a class="dl-row" href="downloads/Book-${b.n}-${b.title.replace(/ /g, '-')}.pdf"><span class="fmt">PDF</span><span class="nm">Book ${b.n} · ${escapeHtml(b.title)} — typeset 6×9</span></a>`).join('\n      ')}
    </div>`,
    bodyEnd: `<script src="assets/js/continue.js"></script>`
  });
  writeFileSync(join(ROOT, 'index.html'), home);

  // Book pages
  for (const b of books) {
    const rows = b.chapters.map((c) => `
      <a class="chapter-row" href="${chapterFile(b.n, c.num)}">
        <span class="cn">${c.n}</span>
        ${c.img ? `<img class="thumb" src="${escapeHtml(c.img.src)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="thumb none"></span>`}
        <span class="ct"><b>${escapeHtml(c.title)}</b>${c.epigraph ? `<span>${escapeHtml(c.epigraph.slice(0, 120))}${c.epigraph.length > 120 ? '…' : ''}</span>` : ''}</span>
        <span class="cw">${pretty(c.words)} w</span>
      </a>`).join('');
    const bookHasIx = b.chapters.some((c) => interactive[`${b.n}/${c.num}`]);
    const ixBanner = bookHasIx ? `<div class="ix-banner">
        <div><strong>Interactive edition.</strong> Every chapter in this book opens with a prediction, runs a live demonstration or confidence-rated quiz, and feeds a <a href="dashboard.html">mastery map</a>. End with the <a href="assessment-b1.html">Book One assessment</a>.</div>
      </div>` : '';
    const body = `
      <a class="crumb" href="index.html">← The Shape of the Many</a>
      <header class="book-head">
        <p class="eyebrow">Book ${b.n} of ${books.length} · items ${b.range[0]}–${b.range[1]} · ${b.chapters.length} chapters</p>
        <h1>${escapeHtml(b.title)}</h1>
        <p class="gloss">${escapeHtml(b.gloss)}</p>
      </header>
      ${ixBanner}
      ${b.frontHtml ? `<details class="matter-fold" open><summary>Front matter — introduction &amp; movements</summary><div class="prose">${b.frontHtml}</div></details>` : ''}
      <h2 class="section-title">Chapters</h2>
      <div class="chapter-list">${rows}</div>
      ${b.backHtml ? `<details class="matter-fold"><summary>Bridges &amp; synthesis — end of book</summary><div class="prose">${b.backHtml}</div></details>` : ''}`;
    writeFileSync(join(ROOT, bookFile(b.n)), page({
      title: `Book ${b.n} · ${b.title} — The Shape of the Many`,
      desc: `${b.title}: ${b.gloss} ${b.chapters.length} chapters (items ${b.range[0]}–${b.range[1]}).`,
      canonical: `${SITE_URL}/${bookFile(b.n)}`, body
    }));
  }

  // Chapter pages
  for (const b of books) {
    b.chapters.forEach((c, idx) => {
      const prev = idx > 0 ? b.chapters[idx - 1] : null;
      const next = idx < b.chapters.length - 1 ? b.chapters[idx + 1] : null;
      const desc = c.epigraph ? c.epigraph.slice(0, 180) : `${c.title} — Book ${b.n}, ${b.title}.`;
      const jsonld = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article',
        headline: c.title, articleSection: b.title, url: `${SITE_URL}/${chapterFile(b.n, c.num)}`,
        isPartOf: { '@type': 'Book', name: b.title }, inLanguage: 'en',
        wordCount: c.words, license: 'https://creativecommons.org/licenses/by/4.0/'
      });
      const ix = interactive[`${b.n}/${c.num}`];
      const predictBlock = ix ? `<div id="ix-predict"></div>` : '';
      const simBlock = ix && ix.sim ? `<div id="ix-sim" data-sim="${escapeHtml(ix.sim)}"></div>` : '';
      const quizBlock = ix ? `<div id="ix-quiz"></div>` : '';
      const body = `
      <div class="reader" data-title="${escapeHtml(c.title)}" data-book="${b.n}">
        <a class="crumb" href="${bookFile(b.n)}">← Book ${b.n} · ${escapeHtml(b.title)}</a>
        <p class="eyebrow">Chapter ${c.n} · ${escapeHtml(b.title)}</p>
        <h1>${escapeHtml(c.title)}</h1>
        ${predictBlock}
        <article class="prose">${c.html}</article>
        ${simBlock}
        ${quizBlock}
        ${c.refsHtml ? `<details class="refs"><summary>References &amp; sources</summary><div class="prose">${c.refsHtml}</div></details>` : ''}
        <nav class="chapter-nav">
          ${prev ? `<a class="prev" href="${chapterFile(b.n, prev.num)}"><span class="dir">← Previous</span><span class="name">${escapeHtml(prev.title)}</span></a>`
                 : `<a class="prev disabled"><span class="dir">← Previous</span><span class="name">Start of book</span></a>`}
          ${next ? `<a class="next" href="${chapterFile(b.n, next.num)}"><span class="dir">Next →</span><span class="name">${escapeHtml(next.title)}</span></a>`
                 : `<a class="next" href="${nextBookHref(books, b, chapterFile)}"><span class="dir">Next →</span><span class="name">${escapeHtml(nextBookLabel(books, b))}</span></a>`}
        </nav>
      </div>`;
      const ixData = ix ? { book: b.n, ch: c.num, catKey: ix.category, catName: ix.catName,
        data: { prediction: ix.prediction, questions: ix.questions } } : null;
      const ixHead = ix ? `<script>window.__IX__=${JSON.stringify(ixData)}</script>` : '';
      const ixScripts = ix ? `${ix.sim ? '<script src="assets/js/simulations.js"></script>' : ''}<script src="assets/js/interactive.js"></script>` : '';
      writeFileSync(join(ROOT, chapterFile(b.n, c.num)), page({
        title: `${c.title} — The Shape of the Many`,
        desc, canonical: `${SITE_URL}/${chapterFile(b.n, c.num)}`, jsonld,
        extraHead: '<style>.read-progress{position:fixed;top:0;left:0;height:3px;width:0;background:var(--accent);z-index:50;transition:width .1s}</style><div class="read-progress" id="readProgress"></div>' + ixHead,
        body, bodyEnd: `<script src="assets/js/chapter.js"></script>${ixScripts}`
      }));
    });
  }

  // About page
  writeAbout(books, totalChapters, totalWords, pretty);

  // Mastery dashboard + Book One assessment (interactive pilot)
  writeDashboard();
  writeAssessment(interactive);

  // 404
  writeFileSync(join(ROOT, '404.html'), page({
    title: 'Not found · The Shape of the Many',
    desc: 'This page does not exist.', canonical: SITE_URL + '/404.html',
    body: `<section class="hero"><p class="eyebrow">404</p><h1>This page isn’t part of the shape.</h1>
      <p class="thesis">The page you asked for doesn’t exist. Return to the <a href="index.html">series home</a> and start again.</p></section>`
  }));

  // manifest.json (for client search) + sitemap + robots
  const manifest = {
    meta: { title: 'The Shape of the Many', thesis: THESIS },
    totals: { books: books.length, chapters: totalChapters, words: totalWords },
    books: books.map((b) => ({
      n: b.n, title: b.title, gloss: b.gloss, range: b.range, file: bookFile(b.n),
      chapters: b.chapters.map((c) => ({ n: c.n, num: c.num, title: c.title, epigraph: c.epigraph, file: chapterFile(b.n, c.num) }))
    }))
  };
  writeFileSync(join(DATA, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const urls = [`${SITE_URL}/`, `${SITE_URL}/about.html`, `${SITE_URL}/dashboard.html`, `${SITE_URL}/assessment-b1.html`,
    ...books.map((b) => `${SITE_URL}/${bookFile(b.n)}`),
    ...books.flatMap((b) => b.chapters.map((c) => `${SITE_URL}/${chapterFile(b.n, c.num)}`))];
  writeFileSync(join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') + `\n</urlset>\n`);
  writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  // Remove obsolete client-rendered data dir
  rmSync(join(DATA, 'chapters'), { recursive: true, force: true });

  // ---- Downloads ------------------------------------------------------------
  mkdirSync(DL, { recursive: true });
  const typeset = join(ROOT, 'masters', 'typeset'), masters = join(ROOT, 'masters');
  let copied = 0;
  const copyIf = (src, dst) => { if (existsSync(src)) { copyFileSync(src, dst); copied++; } };
  if (existsSync(typeset)) for (const f of readdirSync(typeset)) if (/\.(pdf|docx)$/i.test(f)) copyIf(join(typeset, f), join(DL, f));
  if (existsSync(masters)) for (const f of readdirSync(masters)) if (/\.md$/i.test(f)) copyIf(join(masters, f), join(DL, f));

  console.log(`Static site: 1 home + ${books.length} book pages + ${totalChapters} chapters + about + 404`);
  console.log(`Totals: ${books.length} books, ${totalChapters} chapters, ${pretty(totalWords)} words`);
  console.log(`downloads/: ${copied} files`);
}

function nextBookHref(books, b, cf) {
  const nb = books.find((x) => x.n === b.n + 1);
  return nb ? cf(nb.n, nb.chapters[0].num) : 'index.html';
}
function nextBookLabel(books, b) {
  const nb = books.find((x) => x.n === b.n + 1);
  return nb ? `Book ${nb.n} · ${nb.title}` : 'Back to the series home';
}

function writeDashboard() {
  // Book One category map baked in; JS fills mastery from localStorage.
  const cfg = {
    book1: { title: 'Book One · The Shape Forms', cats: [
      { key: 'emergence', name: 'Emergence', chapters: 8 },
      { key: 'grouping', name: 'Evolutionary grouping', chapters: 8 },
      { key: 'wisdom', name: 'Crowd intelligence', chapters: 9 }
    ] },
    soon: ['Conformity', 'Networks', 'Power', 'Digital systems', 'Intervention design']
  };
  const body = `
    <a class="crumb" href="index.html">← The Shape of the Many</a>
    <div class="reader">
      <p class="eyebrow">Your progress</p>
      <h1>Mastery map</h1>
      <p class="mastery-note">Mastery is earned through understanding, not activity. Everything below is stored only
      on this device — no account, no server. Answer chapter quizzes to build each track.</p>
      <div id="masteryRoot" class="mastery-grid"></div>
      <div id="calibration" class="ix-block" hidden></div>
      <p class="mastery-note" style="margin-top:1.5rem">Coming as later books gain the interactive treatment:
      ${cfg.soon.join(' · ')}.</p>
      <div class="cta-row"><a class="btn-primary" href="assessment-b1.html">Take the Book One assessment →</a>
        <a class="btn-ghost" href="book-1.html">Back to Book One</a></div>
    </div>`;
  writeFileSync(join(ROOT, 'dashboard.html'), page({
    title: 'Mastery map — The Shape of the Many',
    desc: 'Track your understanding across Book One: Emergence, evolutionary grouping, and crowd intelligence.',
    canonical: SITE_URL + '/dashboard.html',
    extraHead: `<script>window.__MASTERY__=${JSON.stringify(cfg)}</script>`,
    body, bodyEnd: `<script src="assets/js/dashboard.js"></script>`
  }));
}

function writeAssessment(interactive) {
  // Curate 12 questions across the three Book One tracks (chapter/qIndex pairs).
  const pick = [
    ['1/001', 2], ['1/006', 1], ['1/007', 1], ['1/008', 1],
    ['1/009', 2], ['1/012', 1], ['1/015', 2], ['1/016', 2],
    ['1/017', 1], ['1/018', 1], ['1/019', 0], ['1/021', 1]
  ];
  const questions = pick.map(([key, qi]) => {
    const ix = interactive[key]; if (!ix) return null;
    const q = ix.questions[qi];
    return { prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, cat: ix.catName };
  }).filter(Boolean);
  const body = `
    <a class="crumb" href="book-1.html">← Book One</a>
    <div class="reader">
      <p class="eyebrow">Book One · Assessment</p>
      <h1>What did the shape teach you?</h1>
      <p class="mastery-note">Twelve questions spanning emergence, evolutionary grouping, and crowd intelligence.
      Answer them all, then see your score and which track to revisit. No timer, no leaderboard.</p>
      <div id="assessRoot"></div>
    </div>`;
  writeFileSync(join(ROOT, 'assessment-b1.html'), page({
    title: 'Book One assessment — The Shape of the Many',
    desc: 'A twelve-question assessment across Book One of The Shape of the Many.',
    canonical: SITE_URL + '/assessment-b1.html',
    extraHead: `<script>window.__ASSESS__=${JSON.stringify({ title: 'Book One', questions })}</script>`,
    body, bodyEnd: `<script src="assets/js/assessment.js"></script>`
  }));
}

function writeAbout(books, totalChapters, totalWords, pretty) {
  const body = `
    <a class="crumb" href="index.html">← The Shape of the Many</a>
    <article class="reader prose about">
      <p class="eyebrow">About the series</p>
      <h1>One argument, a hundred angles.</h1>
      <p><em>The Shape of the Many</em> is a five-book, ${totalChapters}-chapter study of human collective
      behaviour — roughly ${pretty(Math.round(totalWords / 1000))}k words — built from a single 100-item curriculum
      and written to read as one authored work rather than an encyclopedia.</p>

      <h2>The thesis</h2>
      <blockquote><p>${escapeHtml(THESIS)}</p></blockquote>
      <p>The wise crowd and the mob run the <em>same</em> machinery: local interaction producing order at the
      level of the many. What flips the sign is a set of nameable conditions — chiefly independence, diversity,
      and whether people act before or after they see each other. Aggregate independent, diverse judgments and
      you get collective wisdom; let people copy one another first and the same process yields cascades,
      panics, and conformity.</p>

      <h2>How it is built</h2>
      <ul>
        <li><strong>One fixed shape.</strong> Every chapter follows the same seven beats — idea, origin,
        mechanism, anchor example, the flip, the human weight, and a critique — so the argument stays legible
        across all ${totalChapters} chapters.</li>
        <li><strong>Permanent numbering.</strong> Items are never renumbered; the curriculum is a stable spine.</li>
        <li><strong>Honest sourcing.</strong> No invented authors, titles, journals, dates, DOIs, quotations, or
        statistics. Quotes are short and attributed; each chapter carries its own reference list.</li>
        <li><strong>Replication humility.</strong> Where a classic finding is contested or failed to replicate
        (Milgram’s framing, ego-depletion, some priming and Asch interpretations), the chapter’s critique says so.</li>
        <li><strong>WEIRD caution.</strong> “Universal” claims resting on narrow Western/student samples are flagged.</li>
        <li><strong>Verified before publication.</strong> A dedicated citation pass web-checked every chapter’s
        headline claims and cleared the “to verify” flags before release.</li>
      </ul>

      <h2>The five movements</h2>
      <ol>
        ${books.map((b) => `<li><a href="${bookFile(b.n)}"><strong>${escapeHtml(b.title)}</strong></a> — ${escapeHtml(b.gloss)}</li>`).join('\n        ')}
      </ol>

      <h2>Formats &amp; licence</h2>
      <p>Read online here, or download the complete series as Markdown and each book as a typeset 6×9 PDF and
      Word edition from the <a href="index.html#downloads">home page</a>. Chapter images are freely licensed and
      hotlinked from Wikimedia Commons, credited in each caption. The text is released under
      <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>; the site code is additionally
      MIT-licensed. Source and issues live on
      <a href="https://github.com/TheUnbornLabs/the-shape-of-the-many">GitHub</a>.</p>
    </article>`;
  writeFileSync(join(ROOT, 'about.html'), page({
    title: 'About & sources — The Shape of the Many',
    desc: 'How The Shape of the Many is built: its thesis, its seven-beat chapter shape, and its binding honest-sourcing and citation policy.',
    canonical: SITE_URL + '/about.html', body
  }));
}

build();
