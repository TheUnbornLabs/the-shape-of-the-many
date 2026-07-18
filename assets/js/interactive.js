// Interactive learning engine for "The Shape of the Many".
// Data-driven: each chapter page sets window.__IX__ = { book, ch, catKey, catName, data }.
// Renders an opening prediction, a confidence-rated quiz, and mounts a simulation.
// Mastery is stored locally (no accounts, no server). Research-lab tone, not gamified.
(function () {
  const IX = window.__IX__;
  const KEY = 'sm:mastery';

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function recordChapter(correct, total) {
    if (!IX) return;
    const s = load();
    s.chapters = s.chapters || {};
    s.chapters[`${IX.book}/${IX.ch}`] = { cat: IX.catKey, catName: IX.catName, correct, total, at: Date.now() };
    save(s);
  }
  function recordConfidence(level, right) {
    const s = load();
    s.confidence = s.confidence || { high: { r: 0, n: 0 }, medium: { r: 0, n: 0 }, low: { r: 0, n: 0 } };
    const b = s.confidence[level]; if (!b) return;
    b.n++; if (right) b.r++; save(s);
  }

  // ---- Prediction ----------------------------------------------------------
  function renderPrediction(mount, p) {
    if (!mount || !p) return;
    mount.className = 'ix-block ix-predict';
    mount.innerHTML = `<div class="ix-tag">Predict — before you read</div>
      <p class="ix-q">${esc(p.prompt)}</p>
      <div class="ix-options"></div>
      <div class="ix-reveal" hidden></div>`;
    const opts = mount.querySelector('.ix-options');
    p.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'ix-opt'; b.textContent = o;
      b.addEventListener('click', () => {
        if (mount.dataset.done) return; mount.dataset.done = '1';
        [...opts.children].forEach((c) => c.disabled = true);
        b.classList.add('picked');
        if (p.answer != null) opts.children[p.answer].classList.add('is-key');
        const r = mount.querySelector('.ix-reveal');
        r.innerHTML = `<strong>${p.answer == null ? 'Your prediction is noted.' : (i === p.answer ? 'Your intuition matches the chapter.' : 'The chapter will challenge this.')}</strong> ${esc(p.reveal)}`;
        r.hidden = false;
      });
      opts.appendChild(b);
    });
  }

  // ---- Quiz ----------------------------------------------------------------
  const TYPE_LABEL = { concept: 'Concept check', scenario: 'Scenario diagnosis', predict: 'What happens next?' };
  function renderQuiz(mount, questions) {
    if (!mount || !questions || !questions.length) return;
    mount.className = 'ix-block ix-quiz';
    mount.innerHTML = `<div class="ix-tag">Test your understanding</div><div class="ix-questions"></div><div class="ix-score" hidden></div>`;
    const wrap = mount.querySelector('.ix-questions');
    let answered = 0, correct = 0;

    questions.forEach((q, qi) => {
      const card = document.createElement('div');
      card.className = 'ix-question';
      card.innerHTML = `<div class="ix-qtype">${TYPE_LABEL[q.type] || 'Question'}</div>
        <p class="ix-q">${esc(q.prompt)}</p>
        <div class="ix-options"></div>
        <div class="ix-confidence" hidden><span>How confident are you?</span>
          <button data-c="low">Low</button><button data-c="medium">Medium</button><button data-c="high">High</button></div>
        <div class="ix-explain" hidden></div>`;
      const opts = card.querySelector('.ix-options');
      let choice = null;
      q.options.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'ix-opt'; b.textContent = o;
        b.addEventListener('click', () => {
          if (card.dataset.locked) return;
          choice = i;
          [...opts.children].forEach((c) => c.classList.remove('picked'));
          b.classList.add('picked');
          card.querySelector('.ix-confidence').hidden = false;
        });
        opts.appendChild(b);
      });
      card.querySelectorAll('.ix-confidence button').forEach((cb) => {
        cb.addEventListener('click', () => {
          if (card.dataset.locked || choice == null) return;
          card.dataset.locked = '1';
          const right = choice === q.answer;
          [...opts.children].forEach((c, i) => {
            c.disabled = true;
            if (i === q.answer) c.classList.add('is-correct');
            if (i === choice && !right) c.classList.add('is-wrong');
          });
          card.querySelector('.ix-confidence').innerHTML = `<span>Your confidence: <strong>${cb.dataset.c}</strong></span>`;
          const ex = card.querySelector('.ix-explain');
          ex.innerHTML = `<strong class="${right ? 'ok' : 'no'}">${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(q.explanation)}`;
          ex.hidden = false;
          recordConfidence(cb.dataset.c, right);
          answered++; if (right) correct++;
          if (answered === questions.length) {
            recordChapter(correct, questions.length);
            const sc = mount.querySelector('.ix-score');
            sc.innerHTML = `You answered <strong>${correct}/${questions.length}</strong> correctly. Progress saved to this device — see your <a href="dashboard.html">mastery map</a>.`;
            sc.hidden = false;
          }
        });
      });
      wrap.appendChild(card);
    });
  }

  // ---- Simulation mount ----------------------------------------------------
  function mountSim(mount) {
    if (!mount) return;
    const name = mount.dataset.sim;
    const fn = window.SIMS && window.SIMS[name];
    if (!fn) { mount.remove(); return; }
    mount.className = 'ix-block ix-sim';
    fn(mount);
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!IX) return;
    renderPrediction(document.getElementById('ix-predict'), IX.data.prediction);
    mountSim(document.getElementById('ix-sim'));
    renderQuiz(document.getElementById('ix-quiz'), IX.data.questions);
  });
})();
