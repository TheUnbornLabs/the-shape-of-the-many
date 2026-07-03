// Build the static reading site for "The Shape of the Many".
// Walks the source book folders, renders each chapter's markdown to HTML,
// and emits data/manifest.json + data/chapters/bN/NNN.json for the site,
// then copies the typeset editions into downloads/.
//
// Usage: node scripts/build.mjs
import {
  readdirSync, readFileSync, writeFileSync, mkdirSync,
  existsSync, copyFileSync, rmSync, statSync
} from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const CH_OUT = join(DATA, 'chapters');
const DL = join(ROOT, 'downloads');

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

// ---- Tiny, purpose-built Markdown renderer ---------------------------------
// The corpus is disciplined prose: one H1, several H2 "beat" headings,
// a leading blockquote epigraph, occasional bullet lists, and *em* / **strong**
// inline emphasis. No tables, links, images, code fences, or raw HTML.
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function inline(s) {
  // Operate on already-escaped text; markers are literal characters.
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
}
function renderMarkdown(md, { dropFirstH1 = false } = {}) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null;      // array of <li> strings when inside a list
  let quote = null;     // array of quote lines when inside a blockquote
  let seenH1 = false;

  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
  };
  const flushList = () => {
    if (list) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; }
  };
  const flushQuote = () => {
    if (quote) { out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = null; }
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flushAll(); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = h[1].length;
      if (level === 1) {
        seenH1 = true;
        if (dropFirstH1) continue;         // title supplied by the page chrome
      }
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
  return { html: out.join('\n'), hadH1: seenH1 };
}

function wordCount(md) {
  return (md.replace(/[#>*_`-]/g, ' ').match(/\b[\w’'-]+\b/g) || []).length;
}

// ---- Parse a chapter directory --------------------------------------------
function firstH1Title(md) {
  const m = md.match(/^#\s+(.*)$/m);
  return m ? m[1].trim() : null;
}
function firstEpigraph(md) {
  const m = md.match(/^>\s?(.*(?:\n>.*)*)/m);
  if (!m) return null;
  return m[0].replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim();
}

function build() {
  rmSync(CH_OUT, { recursive: true, force: true });
  mkdirSync(CH_OUT, { recursive: true });

  const manifestBooks = [];
  let totalChapters = 0;
  let totalWords = 0;

  for (const book of BOOKS) {
    const bookDir = join(ROOT, book.dir);
    const bOut = join(CH_OUT, `b${book.n}`);
    mkdirSync(bOut, { recursive: true });

    // Front matter + back matter (rendered, stored alongside chapters)
    const frontFile = readdirSync(bookDir).find((f) => /front-matter\.md$/.test(f));
    const backFile = readdirSync(bookDir).find((f) => /^zzz-.*\.md$/.test(f));
    let frontHtml = '', backHtml = '';
    if (frontFile) frontHtml = renderMarkdown(readFileSync(join(bookDir, frontFile), 'utf8'), { dropFirstH1: true }).html;
    if (backFile) backHtml = renderMarkdown(readFileSync(join(bookDir, backFile), 'utf8'), { dropFirstH1: true }).html;
    writeFileSync(join(bOut, 'matter.json'), JSON.stringify({ frontHtml, backHtml }, null, 0));

    // Chapters
    const chapterDirs = readdirSync(bookDir)
      .filter((f) => /^\d{3}-/.test(f) && statSync(join(bookDir, f)).isDirectory())
      .sort();

    const chapters = [];
    for (const cd of chapterDirs) {
      const num = cd.slice(0, 3);
      const slug = cd.slice(4);
      const chPath = join(bookDir, cd, 'chapter.md');
      if (!existsSync(chPath)) continue;
      const md = readFileSync(chPath, 'utf8');
      const rawTitle = firstH1Title(md) || `${parseInt(num, 10)}. ${slug}`;
      const title = rawTitle.replace(/^\d+\.\s*/, '');
      const displayNum = parseInt(num, 10);
      const epigraph = firstEpigraph(md);
      const { html } = renderMarkdown(md, { dropFirstH1: true });
      const words = wordCount(md);
      totalWords += words;

      // references.md → its own rendered block
      const refPath = join(bookDir, cd, 'references.md');
      let refsHtml = '';
      if (existsSync(refPath)) refsHtml = renderMarkdown(readFileSync(refPath, 'utf8'), { dropFirstH1: true }).html;

      writeFileSync(join(bOut, `${num}.json`), JSON.stringify({
        book: book.n, num, displayNum, slug, title, epigraph, words, html, refsHtml
      }, null, 0));

      chapters.push({ num, n: displayNum, slug, title, epigraph, words });
    }

    totalChapters += chapters.length;
    manifestBooks.push({
      n: book.n, dir: book.dir, slug: book.dir.replace(/^book-\d+-/, ''),
      title: book.title, range: book.range, gloss: book.gloss,
      chapterCount: chapters.length,
      words: chapters.reduce((s, c) => s + c.words, 0),
      hasFront: !!frontFile, hasBack: !!backFile,
      chapters
    });
  }

  const manifest = {
    meta: { title: 'The Shape of the Many', subtitle: 'A five-book study of human collective behaviour', thesis: THESIS },
    totals: { books: BOOKS.length, chapters: totalChapters, words: totalWords },
    books: manifestBooks
  };
  writeFileSync(join(DATA, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // ---- Downloads: copy typeset editions + markdown masters -----------------
  mkdirSync(DL, { recursive: true });
  const typeset = join(ROOT, 'masters', 'typeset');
  const masters = join(ROOT, 'masters');
  let copied = 0;
  const copyIf = (src, dst) => { if (existsSync(src)) { copyFileSync(src, dst); copied++; } };
  if (existsSync(typeset)) {
    for (const f of readdirSync(typeset)) {
      if (/\.(pdf|docx)$/i.test(f)) copyIf(join(typeset, f), join(DL, f));
    }
  }
  if (existsSync(masters)) {
    for (const f of readdirSync(masters)) {
      if (/\.md$/i.test(f)) copyIf(join(masters, f), join(DL, f));
    }
  }

  console.log(`manifest.json: ${manifest.totals.books} books, ${manifest.totals.chapters} chapters, ${manifest.totals.words.toLocaleString()} words`);
  for (const b of manifestBooks) console.log(`  Book ${b.n}  ${b.title.padEnd(22)} ${String(b.chapterCount).padStart(3)} ch  ${String(b.words).padStart(7)} w`);
  console.log(`downloads/: ${copied} files copied`);
}

build();
