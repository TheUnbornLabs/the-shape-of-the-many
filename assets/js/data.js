// Shared data layer for "The Shape of the Many" static site.
// Loads the manifest and per-chapter JSON via fetch (GitHub Pages friendly).
window.SM = (function () {
  const cache = { manifest: null, chapters: {} };

  async function getManifest() {
    if (cache.manifest) return cache.manifest;
    const res = await fetch('data/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('manifest ' + res.status);
    cache.manifest = await res.json();
    return cache.manifest;
  }

  async function getChapter(book, num) {
    const key = book + '/' + num;
    if (cache.chapters[key]) return cache.chapters[key];
    const res = await fetch(`data/chapters/b${book}/${num}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error('chapter ' + res.status);
    const data = await res.json();
    cache.chapters[key] = data;
    return data;
  }

  async function getMatter(book) {
    const res = await fetch(`data/chapters/b${book}/matter.json`, { cache: 'no-cache' });
    if (!res.ok) return { frontHtml: '', backHtml: '' };
    return res.json();
  }

  // Flat, searchable list of every chapter across every book.
  let flat = null;
  async function getAllChapters() {
    if (flat) return flat;
    const m = await getManifest();
    flat = [];
    for (const b of m.books) {
      for (const c of b.chapters) {
        flat.push({ book: b.n, bookTitle: b.title, num: c.num, n: c.n, slug: c.slug, title: c.title, epigraph: c.epigraph || '' });
      }
    }
    return flat;
  }

  function search(list, q) {
    if (!q || q.trim().length < 2) return [];
    const t = q.toLowerCase().trim();
    return list
      .filter((c) => c.title.toLowerCase().includes(t) ||
                     c.slug.toLowerCase().includes(t) ||
                     (c.epigraph && c.epigraph.toLowerCase().includes(t)) ||
                     String(c.n) === t)
      .slice(0, 30);
  }

  return { getManifest, getChapter, getMatter, getAllChapters, search };
})();

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function qp(name) { return new URLSearchParams(location.search).get(name); }

// Global search box (present on every page).
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('globalSearch');
  const box = document.getElementById('searchResults');
  if (!input || !box) return;
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value;
      if (!q || q.trim().length < 2) { box.hidden = true; box.innerHTML = ''; return; }
      const all = await SM.getAllChapters();
      const hits = SM.search(all, q);
      box.innerHTML = hits.length
        ? hits.map((c) =>
            `<a href="read.html?b=${c.book}&c=${c.num}">
               <span class="sr-meta">Book ${c.book} · ${escapeHtml(c.bookTitle)} · №${c.n}</span>
               <span class="sr-title">${escapeHtml(c.title)}</span>
             </a>`).join('')
        : '<a><span class="sr-title">No matches</span></a>';
      box.hidden = false;
    }, 150);
  });
  document.addEventListener('click', (ev) => {
    if (!box.contains(ev.target) && ev.target !== input) box.hidden = true;
  });
});
