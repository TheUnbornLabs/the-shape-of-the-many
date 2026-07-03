// Home page: hero stats + book list.
(async function () {
  try {
    const m = await SM.getManifest();

    const thesisEl = document.getElementById('thesis');
    if (thesisEl) thesisEl.textContent = m.meta.thesis;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statBooks', m.totals.books);
    set('statChapters', m.totals.chapters);
    set('statWords', Math.round(m.totals.words / 1000) + 'k');

    const list = document.getElementById('bookList');
    list.innerHTML = m.books.map((b) => `
      <a class="book-card" href="book.html?b=${b.n}">
        <div class="book-num">${b.n}</div>
        <div class="book-body">
          <h3>${escapeHtml(b.title)}</h3>
          <p>${escapeHtml(b.gloss)}</p>
        </div>
        <div class="book-meta">
          <b>${b.chapterCount}</b>chapters
          <div>items ${b.range[0]}–${b.range[1]}</div>
        </div>
      </a>`).join('');
  } catch (e) {
    document.getElementById('bookList').innerHTML =
      '<p class="loading">Could not load the manifest. Run <code>node scripts/build.mjs</code> first.</p>';
    console.error(e);
  }
})();
