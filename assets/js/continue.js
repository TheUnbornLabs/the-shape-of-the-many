// Home page enhancement: show a "Continue reading" card if the visitor has
// opened a chapter before. Purely additive — hidden by default in the HTML.
(function () {
  try {
    const raw = localStorage.getItem('sm:last');
    if (!raw) return;
    const last = JSON.parse(raw);
    if (!last || !last.href) return;
    const el = document.getElementById('continueReading');
    if (!el) return;
    el.innerHTML = `<a class="continue-card" href="${last.href}">
      <span class="continue-label">Continue reading</span>
      <span class="continue-title">${(last.title || 'Where you left off').replace(/[&<>"]/g, '')}</span>
    </a>`;
    el.hidden = false;
  } catch (e) { /* ignore */ }
})();
