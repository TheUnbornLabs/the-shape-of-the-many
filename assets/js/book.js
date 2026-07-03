// Book page: front matter + chapter list + back matter.
(async function () {
  const bn = parseInt(qp('b'), 10);
  const root = document.getElementById('bookRoot');
  try {
    const m = await SM.getManifest();
    const book = m.books.find((b) => b.n === bn);
    if (!book) { root.innerHTML = '<p class="loading">Unknown book.</p>'; return; }

    document.title = `Book ${book.n} · ${book.title} — The Shape of the Many`;

    const matter = await SM.getMatter(book.n);

    const rows = book.chapters.map((c) => `
      <a class="chapter-row" href="read.html?b=${book.n}&c=${c.num}">
        <span class="cn">${c.n}</span>
        <span class="ct"><b>${escapeHtml(c.title)}</b>
          ${c.epigraph ? `<span>${escapeHtml(truncate(c.epigraph, 120))}</span>` : ''}</span>
        <span class="cw">${c.words.toLocaleString()} w</span>
      </a>`).join('');

    root.innerHTML = `
      <a class="crumb" href="index.html">← The Shape of the Many</a>
      <header class="book-head">
        <p class="eyebrow">Book ${book.n} of ${m.totals.books} · items ${book.range[0]}–${book.range[1]}</p>
        <h1>${escapeHtml(book.title)}</h1>
        <p class="gloss">${escapeHtml(book.gloss)}</p>
      </header>

      ${matter.frontHtml ? `
      <details class="matter-fold" open>
        <summary>Front matter — introduction &amp; movements</summary>
        <div class="prose">${matter.frontHtml}</div>
      </details>` : ''}

      <h2 class="section-title">Chapters</h2>
      <div class="chapter-list">${rows}</div>

      ${matter.backHtml ? `
      <details class="matter-fold">
        <summary>Bridges &amp; synthesis — end of book</summary>
        <div class="prose">${matter.backHtml}</div>
      </details>` : ''}
    `;
  } catch (e) {
    root.innerHTML = '<p class="loading">Could not load this book.</p>';
    console.error(e);
  }
})();

function truncate(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }
