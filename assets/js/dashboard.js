// Mastery dashboard: reads local progress and renders per-track mastery + calibration.
(function () {
  const cfg = window.__MASTERY__;
  const KEY = 'sm:mastery';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function levelOf(ratio, engaged) {
    if (!engaged) return ['none', 'Not started'];
    if (ratio >= 0.8) return ['mastered', 'Mastered'];
    if (ratio >= 0.5) return ['proficient', 'Proficient'];
    return ['developing', 'Developing'];
  }
  const DESC = {
    none: 'Answer this track’s chapter quizzes to begin.',
    developing: 'You can name the ideas, but correlated evidence and edge cases still trip you.',
    proficient: 'You reliably diagnose the mechanism; push toward the harder “what happens next?” cases.',
    mastered: 'You predict how these systems tip between wisdom and failure.'
  };

  window.addEventListener('DOMContentLoaded', () => {
    const s = load();
    const chapters = s.chapters || {};
    const root = document.getElementById('masteryRoot');
    root.innerHTML = cfg.books.map((bk) =>
      `<h2 class="section-title" style="margin:.6rem 0 .2rem">${esc(bk.title)}</h2>` + bk.cats.map((cat) => {
        const engaged = Object.values(chapters).filter((c) => c.cat === cat.key);
        const done = engaged.length;
        const correct = engaged.reduce((a, c) => a + c.correct, 0);
        const total = engaged.reduce((a, c) => a + c.total, 0);
        const ratio = total ? correct / total : 0;
        const [cls, label] = levelOf(ratio, done > 0);
        return `<div class="mastery-cat">
          <h3>${esc(cat.name)}</h3>
          <span class="lvl ${cls}">${label}</span>
          <div class="mastery-bar"><i style="width:${Math.round(ratio * 100)}%"></i></div>
          <p>${DESC[cls]} ${done ? `(${done}/${cat.chapters} chapters engaged · ${correct}/${total} correct)` : ''}</p>
        </div>`;
      }).join('')
    ).join('');

    // Confidence calibration
    const cal = s.confidence;
    if (cal && (cal.high.n + cal.medium.n + cal.low.n) > 0) {
      const box = document.getElementById('calibration');
      const row = (lbl, b) => b.n ? `<div class="assess-track"><span>When you felt <strong>${lbl}</strong> confidence</span><span>${Math.round(b.r / b.n * 100)}% correct <span style="color:var(--ink-faint)">(${b.n})</span></span></div>` : '';
      box.innerHTML = `<div class="ix-tag">Confidence calibration</div>
        <p class="mastery-note">Good judgment means being right about how right you are.</p>
        ${row('high', cal.high)}${row('medium', cal.medium)}${row('low', cal.low)}`;
      box.hidden = false;
    }
  });
})();
