// Book One assessment: sequential graded questions, then score + per-track guidance.
(function () {
  const A = window.__ASSESS__;
  const KEY = 'sm:mastery';
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  window.addEventListener('DOMContentLoaded', () => {
    if (!A) return;
    const root = document.getElementById('assessRoot');
    let i = 0, correct = 0;
    const byCat = {};

    function render() {
      if (i >= A.questions.length) return finish();
      const q = A.questions[i];
      root.innerHTML = `<div class="ix-block ix-quiz">
        <div class="assess-progress">Question ${i + 1} of ${A.questions.length} · ${esc(q.cat)}</div>
        <p class="ix-q">${esc(q.prompt)}</p>
        <div class="ix-options"></div>
        <div class="ix-explain" hidden></div>
        <div class="ix-score" hidden><button class="btn-primary" id="nextQ">${i + 1 < A.questions.length ? 'Next question →' : 'See results →'}</button></div>
      </div>`;
      const opts = root.querySelector('.ix-options');
      q.options.forEach((o, idx) => {
        const b = document.createElement('button'); b.className = 'ix-opt'; b.textContent = o;
        b.addEventListener('click', () => {
          if (root.dataset.locked) return; root.dataset.locked = '1';
          const right = idx === q.answer;
          byCat[q.cat] = byCat[q.cat] || { r: 0, n: 0 }; byCat[q.cat].n++; if (right) { byCat[q.cat].r++; correct++; }
          [...opts.children].forEach((c, k) => { c.disabled = true; if (k === q.answer) c.classList.add('is-correct'); if (k === idx && !right) c.classList.add('is-wrong'); });
          const ex = root.querySelector('.ix-explain');
          ex.innerHTML = `<strong class="${right ? 'ok' : 'no'}">${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(q.explanation)}`;
          ex.hidden = false;
          root.querySelector('.ix-score').hidden = false;
          root.querySelector('#nextQ').addEventListener('click', () => { i++; delete root.dataset.locked; render(); });
        });
        opts.appendChild(b);
      });
    }

    function finish() {
      const pct = Math.round(correct / A.questions.length * 100);
      const verdict = pct >= 80 ? 'You have the shape.' : pct >= 50 ? 'The shape is forming.' : 'Worth another pass.';
      const tracks = Object.entries(byCat).map(([cat, b]) =>
        `<div class="assess-track"><span>${esc(cat)}</span><span>${b.r}/${b.n}</span></div>`).join('');
      const weak = Object.entries(byCat).filter(([, b]) => b.r / b.n < 0.6).map(([c]) => c);
      root.innerHTML = `<div class="ix-block"><div class="assess-result">
        <span class="big">${correct}/${A.questions.length}</span>
        <p class="ix-q" style="margin:.3rem 0 0">${verdict}</p></div>
        <div style="margin:1rem 0">${tracks}</div>
        ${weak.length ? `<p class="mastery-note">Revisit: <strong>${weak.map(esc).join(', ')}</strong>.</p>` : '<p class="mastery-note">Strong across every track.</p>'}
        <div class="cta-row"><a class="btn-primary" href="dashboard.html">Your mastery map →</a>
          <a class="btn-ghost" href="${(A.next && A.next.href) || 'index.html'}">${(A.next && A.next.label) || 'Back to the books'}</a></div></div>`;
      // record assessment result
      const s = load(); s.assessments = s.assessments || {}; s.assessments[A.title] = { correct, total: A.questions.length, at: Date.now() }; save(s);
    }

    render();
  });
})();
