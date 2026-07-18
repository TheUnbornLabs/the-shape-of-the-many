// Chapter page enhancement: scroll progress bar + remember last-read chapter.
(function () {
  const bar = document.getElementById('readProgress');
  function onScroll() {
    if (!bar) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Store where the reader is, for "continue reading" on the home page.
  try {
    const r = document.querySelector('.reader');
    if (r) {
      localStorage.setItem('sm:last', JSON.stringify({
        href: location.pathname.split('/').pop(),
        title: r.getAttribute('data-title') || document.title,
        book: r.getAttribute('data-book') || ''
      }));
    }
  } catch (e) { /* private mode: ignore */ }
})();
