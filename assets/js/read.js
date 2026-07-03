// Reading page: renders one chapter + prev/next navigation.
(async function () {
  const bn = parseInt(qp('b'), 10);
  const cn = qp('c');
  const root = document.getElementById('readRoot');
  try {
    const m = await SM.getManifest();
    const book = m.books.find((b) => b.n === bn);
    if (!book) { root.innerHTML = '<p class="loading">Unknown chapter.</p>'; return; }

    const idx = book.chapters.findIndex((c) => c.num === cn);
    const meta = book.chapters[idx];
    const ch = await SM.getChapter(bn, cn);

    document.title = `${ch.title} — The Shape of the Many`;

    const prev = idx > 0 ? book.chapters[idx - 1] : null;
    const next = idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null;

    root.innerHTML = `
      <a class="crumb" href="book.html?b=${book.n}">← Book ${book.n} · ${escapeHtml(book.title)}</a>
      <p class="eyebrow">Chapter ${meta ? meta.n : ch.displayNum} · ${escapeHtml(book.title)}</p>
      <h1>${escapeHtml(ch.title)}</h1>
      <article class="prose">${ch.html}</article>
      ${ch.refsHtml ? `
      <details class="refs">
        <summary>References &amp; sources</summary>
        <div class="prose">${ch.refsHtml}</div>
      </details>` : ''}
      <nav class="chapter-nav">
        ${prev
          ? `<a class="prev" href="read.html?b=${book.n}&c=${prev.num}"><span class="dir">← Previous</span><span class="name">${escapeHtml(prev.title)}</span></a>`
          : `<a class="prev disabled"><span class="dir">← Previous</span><span class="name">Start of book</span></a>`}
        ${next
          ? `<a class="next" href="read.html?b=${book.n}&c=${next.num}"><span class="dir">Next →</span><span class="name">${escapeHtml(next.title)}</span></a>`
          : `<a class="next disabled"><span class="dir">Next →</span><span class="name">End of book</span></a>`}
      </nav>
    `;
    window.scrollTo(0, 0);
  } catch (e) {
    root.innerHTML = '<p class="loading">Could not load this chapter.</p>';
    console.error(e);
  }
})();
