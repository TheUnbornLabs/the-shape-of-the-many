// Progressive enhancement: global chapter search over the static manifest.
// The site is fully readable without this file; it only adds the search box.
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  let flat = null;
  async function getChapters() {
    if (flat) return flat;
    const m = await fetch('data/manifest.json', { cache: 'no-cache' }).then((r) => r.json());
    flat = [];
    for (const b of m.books) for (const c of b.chapters)
      flat.push({ book: b.n, bookTitle: b.title, n: c.n, title: c.title, epigraph: c.epigraph || '', file: c.file });
    return flat;
  }
  function search(list, q) {
    const t = q.toLowerCase().trim();
    return list.filter((c) =>
      c.title.toLowerCase().includes(t) ||
      (c.epigraph && c.epigraph.toLowerCase().includes(t)) ||
      String(c.n) === t
    ).slice(0, 30);
  }
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
        const hits = search(await getChapters(), q);
        box.innerHTML = hits.length
          ? hits.map((c) => `<a href="${c.file}">
               <span class="sr-meta">Book ${c.book} · ${escapeHtml(c.bookTitle)} · №${c.n}</span>
               <span class="sr-title">${escapeHtml(c.title)}</span></a>`).join('')
          : '<a><span class="sr-title">No matches</span></a>';
        box.hidden = false;
      }, 150);
    });
    document.addEventListener('click', (ev) => { if (!box.contains(ev.target) && ev.target !== input) box.hidden = true; });
  });
})();
