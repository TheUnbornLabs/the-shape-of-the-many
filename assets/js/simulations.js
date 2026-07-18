// Interactive demonstrations for Book One. Each is window.SIMS[name](mount).
// Self-contained, no dependencies, canvas/DOM only. Deterministic-ish; readable.
(function () {
  const SIMS = {};
  window.SIMS = SIMS;

  // ---- small helpers -------------------------------------------------------
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function slider(label, min, max, step, val, onInput) {
    const wrap = el('label', 'sim-slider');
    const out = el('span', 'sim-val', String(val));
    wrap.append(el('span', 'sim-lbl', label), out);
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    inp.addEventListener('input', () => { out.textContent = inp.value; onInput(parseFloat(inp.value)); });
    wrap.appendChild(inp);
    return { wrap, inp, out };
  }
  function frame(mount, title, blurb) {
    mount.innerHTML = `<div class="ix-tag">Interactive demonstration</div>
      <h3 class="sim-title">${title}</h3><p class="sim-blurb">${blurb}</p>
      <div class="sim-stage"></div><div class="sim-controls"></div><div class="sim-readout"></div>`;
    return { stage: mount.querySelector('.sim-stage'), controls: mount.querySelector('.sim-controls'), readout: mount.querySelector('.sim-readout') };
  }
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6b4f8a';
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--ink-faint').trim() || '#888';

  // ---- 1. Boids (Ch 3) -----------------------------------------------------
  SIMS.boids = function (mount) {
    const f = frame(mount, 'Flocking from three local rules', 'No leader, no plan. Each bird only separates, aligns, and coheres with nearby birds. Adjust the weights and watch order appear or dissolve.');
    const cv = el('canvas'); cv.width = 640; cv.height = 320; cv.className = 'sim-canvas';
    f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let P = { sep: 1.4, ali: 1.0, coh: 0.9, n: 80 };
    let birds = [];
    let seed = 42; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function init() { birds = Array.from({ length: P.n }, () => ({ x: rnd() * cv.width, y: rnd() * cv.height, vx: rnd() * 2 - 1, vy: rnd() * 2 - 1 })); }
    init();
    [['Birds', 20, 160, 1, 'n'], ['Separation', 0, 3, 0.1, 'sep'], ['Alignment', 0, 3, 0.1, 'ali'], ['Cohesion', 0, 3, 0.1, 'coh']]
      .forEach(([lbl, mn, mx, st, k]) => f.controls.appendChild(slider(lbl, mn, mx, st, P[k], (v) => { P[k] = v; if (k === 'n') init(); }).wrap));
    function step() {
      for (const b of birds) {
        let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, near = 0;
        for (const o of birds) { if (o === b) continue; const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy; if (d2 < 2500) { near++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d2 < 400) { sx -= dx; sy -= dy; } } }
        if (near) { ax /= near; ay /= near; cx = cx / near - b.x; cy = cy / near - b.y; }
        b.vx += P.sep * sx * 0.01 + P.ali * (ax - b.vx) * 0.05 + P.coh * cx * 0.0008;
        b.vy += P.sep * sy * 0.01 + P.ali * (ay - b.vy) * 0.05 + P.coh * cy * 0.0008;
        const sp = Math.hypot(b.vx, b.vy) || 1; const max = 2.4; if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
        b.x = (b.x + b.vx + cv.width) % cv.width; b.y = (b.y + b.vy + cv.height) % cv.height;
      }
    }
    let raf; function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = accent();
      for (const b of birds) { const a = Math.atan2(b.vy, b.vx); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath(); ctx.fill(); ctx.restore(); }
      step(); raf = requestAnimationFrame(draw);
    }
    draw();
    mount._cleanup = () => cancelAnimationFrame(raf);
  };

  // ---- 2. Granovetter threshold cascade (Ch 7) -----------------------------
  SIMS.threshold = function (mount) {
    const f = frame(mount, 'The threshold cascade', 'Each person acts once enough others already have. Identical average attitudes can yield calm or a riot depending only on the spread of thresholds — and on one low-threshold spark.');
    const N = 100; let P = { mean: 30, spread: 35, seeds: 1 };
    const grid = el('div', 'sim-grid'); f.stage.appendChild(grid);
    const dots = Array.from({ length: N }, () => { const d = el('span', 'sim-dot'); grid.appendChild(d); return d; });
    let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    let thresholds = [];
    function build() { thresholds = Array.from({ length: N }, () => Math.max(0, Math.min(100, P.mean + (rnd() * 2 - 1) * P.spread))); }
    build();
    function run() {
      build();
      // seeds = the lowest-threshold people, forced to act unconditionally
      const order = thresholds.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);
      for (let k = 0; k < P.seeds && k < N; k++) thresholds[order[k].i] = -1;
      const active = new Array(N).fill(false);
      let changed = true, rounds = 0;
      while (changed && rounds < N + 2) { changed = false; rounds++; const count = active.filter(Boolean).length; const frac = count / N * 100; for (let i = 0; i < N; i++) { if (!active[i] && thresholds[i] <= frac) { active[i] = true; changed = true; } } }
      dots.forEach((d, i) => d.classList.toggle('on', active[i]));
      const final = active.filter(Boolean).length;
      f.readout.innerHTML = `Final participation: <strong>${final}%</strong> of the crowd. Mean threshold ${P.mean}, spread ±${P.spread}, ${P.seeds} spark${P.seeds > 1 ? 's' : ''}. <em>Try spread 25 vs 5 at the same mean.</em>`;
    }
    [['Mean threshold', 0, 100, 1, 'mean'], ['Threshold spread', 0, 50, 1, 'spread'], ['Sparks (act first)', 0, 5, 1, 'seeds']]
      .forEach(([lbl, mn, mx, st, k]) => f.controls.appendChild(slider(lbl, mn, mx, st, P[k], (v) => { P[k] = v; run(); }).wrap));
    const btn = el('button', 'sim-btn', 'Re-roll & run'); btn.addEventListener('click', run); f.controls.appendChild(btn);
    run();
  };

  // ---- 3. Wisdom-of-crowds estimator (Ch 17) -------------------------------
  SIMS.crowd = function (mount) {
    const f = frame(mount, 'The wisdom-of-crowds estimator', 'The true value is 1000 (hidden from the crowd). Each person guesses with some error. Averaging cancels independent error — but turn up “influence” and watch guesses correlate and the crowd degrade.');
    const TRUE = 1000; let P = { n: 50, spread: 300, influence: 0, over: 0 };
    const cv = el('canvas'); cv.width = 640; cv.height = 160; cv.className = 'sim-canvas'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let seed = 99; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / 2; }
    function run() {
      const common = gauss() * P.spread * P.influence; // shared bias when influence>0
      const guesses = [];
      for (let i = 0; i < P.n; i++) {
        const isOver = i < P.over; const s = isOver ? P.spread * 2 : P.spread;
        guesses.push(TRUE + common + gauss() * s * (1 - P.influence * 0.6));
      }
      const crowd = guesses.reduce((a, b) => a + b, 0) / guesses.length;
      const avgIndErr = guesses.reduce((a, g) => a + Math.abs(g - TRUE), 0) / guesses.length;
      const crowdErr = Math.abs(crowd - TRUE);
      const bestErr = Math.min(...guesses.map((g) => Math.abs(g - TRUE)));
      // draw number line 200..1800
      ctx.clearRect(0, 0, cv.width, cv.height);
      const x = (v) => 20 + (Math.max(200, Math.min(1800, v)) - 200) / 1600 * (cv.width - 40);
      ctx.strokeStyle = ink(); ctx.beginPath(); ctx.moveTo(20, 110); ctx.lineTo(cv.width - 20, 110); ctx.stroke();
      ctx.fillStyle = ink(); ctx.font = '11px sans-serif'; ctx.fillText('200', 16, 128); ctx.fillText('1800', cv.width - 44, 128);
      ctx.fillStyle = accent();
      guesses.forEach((g) => { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(x(g), 90 - rnd() * 30, 3, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      // truth
      ctx.strokeStyle = '#2f6f6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x(TRUE), 40); ctx.lineTo(x(TRUE), 118); ctx.stroke();
      // crowd average
      ctx.strokeStyle = accent(); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x(crowd), 40); ctx.lineTo(x(crowd), 118); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
      ctx.fillStyle = '#2f6f6a'; ctx.fillText('truth 1000', x(TRUE) - 24, 34);
      const verdict = crowdErr < avgIndErr * 0.9 ? 'The crowd beats its average member.'
        : crowdErr > avgIndErr * 1.1 ? 'The crowd is now worse than the average member — independence lost.'
        : 'The crowd is no better than a single member — copying has erased the advantage.';
      f.readout.innerHTML = `Crowd estimate <strong>${crowd.toFixed(0)}</strong> · crowd error <strong>${crowdErr.toFixed(0)}</strong> vs average individual error <strong>${avgIndErr.toFixed(0)}</strong> (best single ${bestErr.toFixed(0)}). <em>${verdict}</em>`;
    }
    [['Participants', 3, 300, 1, 'n'], ['Diversity (error spread)', 20, 500, 10, 'spread'], ['Influence (copying 0–1)', 0, 1, 0.05, 'influence'], ['Overconfident loud voices', 0, 20, 1, 'over']]
      .forEach(([lbl, mn, mx, st, k]) => f.controls.appendChild(slider(lbl, mn, mx, st, P[k], (v) => { P[k] = v; run(); }).wrap));
    const btn = el('button', 'sim-btn', 'New crowd'); btn.addEventListener('click', run); f.controls.appendChild(btn);
    run();
  };

  // ---- 4. Condorcet jury (Ch 18) -------------------------------------------
  SIMS.condorcet = function (mount) {
    const f = frame(mount, 'Condorcet’s jury theorem', 'Each juror votes independently and is correct with probability p. See how majority accuracy climbs toward certainty when p > 0.5 — and collapses toward zero when p < 0.5.');
    let P = { p: 0.6, n: 25 };
    const cv = el('canvas'); cv.width = 640; cv.height = 220; cv.className = 'sim-canvas'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    function majorityCorrect(p, n) { // P(at least ceil(n/2) of n correct)
      const need = Math.floor(n / 2) + 1; let logC = 0, sum = 0;
      // iterative binomial to avoid overflow
      const lgamma = (z) => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); };
      for (let k = need; k <= n; k++) { const lp = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p); sum += Math.exp(lp); }
      return sum;
    }
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const W = cv.width - 60, H = cv.height - 50, x0 = 45, y0 = 20;
      ctx.strokeStyle = ink(); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + H); ctx.lineTo(x0 + W, y0 + H); ctx.stroke();
      ctx.fillStyle = ink(); ctx.font = '11px sans-serif';
      ctx.fillText('1.0', 24, y0 + 6); ctx.fillText('0.5', 24, y0 + H / 2); ctx.fillText('0', 30, y0 + H);
      ctx.fillText('jury size →', x0 + W - 66, y0 + H + 18);
      ctx.strokeStyle = ink(); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, y0 + H / 2); ctx.lineTo(x0 + W, y0 + H / 2); ctx.stroke(); ctx.setLineDash([]);
      const maxN = 99;
      ctx.strokeStyle = accent(); ctx.lineWidth = 2; ctx.beginPath();
      for (let n = 1; n <= maxN; n += 2) { const acc = majorityCorrect(P.p, n); const px = x0 + (n / maxN) * W, py = y0 + H - acc * H; if (n === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.lineWidth = 1;
      const acc = majorityCorrect(P.p, P.n); const px = x0 + (P.n / maxN) * W, py = y0 + H - acc * H;
      ctx.fillStyle = '#2f6f6a'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill();
      f.readout.innerHTML = `With each juror ${(P.p * 100).toFixed(0)}% accurate, a jury of <strong>${P.n}</strong> is right <strong>${(acc * 100).toFixed(1)}%</strong> of the time. ${P.p < 0.5 ? '<em>Below 50% competence, more voters make the majority more reliably wrong.</em>' : P.p > 0.5 ? '<em>Above 50%, numbers push accuracy toward certainty.</em>' : ''}`;
    }
    f.controls.appendChild(slider('Juror competence p', 0.3, 0.9, 0.01, P.p, (v) => { P.p = v; draw(); }).wrap);
    f.controls.appendChild(slider('Jury size (odd)', 1, 99, 2, P.n, (v) => { P.n = v; draw(); }).wrap);
    draw();
  };

  // ---- 5. Diversity prediction theorem (Ch 19) -----------------------------
  SIMS.diversity = function (mount) {
    const f = frame(mount, 'Crowd error = average error − diversity', 'The identity is exact. Increase the spread of opinions (diversity) at a fixed average ability and the crowd’s error falls by precisely that amount.');
    const TRUE = 100; let P = { n: 12, spread: 20, bias: 0 };
    const stage = el('div', 'sim-diversity'); f.stage.appendChild(stage);
    let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function run() {
      const preds = Array.from({ length: P.n }, () => TRUE + P.bias + (rnd() * 2 - 1) * P.spread);
      const crowd = preds.reduce((a, b) => a + b, 0) / preds.length;
      const avgErr = preds.reduce((a, p) => a + (p - TRUE) ** 2, 0) / preds.length;
      const diversity = preds.reduce((a, p) => a + (p - crowd) ** 2, 0) / preds.length;
      const crowdErr = (crowd - TRUE) ** 2;
      const bars = preds.map((p) => `<span class="dv-dot" style="left:${((p - 40) / 120 * 100).toFixed(1)}%"></span>`).join('');
      stage.innerHTML = `<div class="dv-line"><span class="dv-truth" style="left:${((TRUE - 40) / 120 * 100)}%"></span><span class="dv-crowd" style="left:${((crowd - 40) / 120 * 100).toFixed(1)}%"></span>${bars}</div>`;
      f.readout.innerHTML = `Average individual error <strong>${avgErr.toFixed(1)}</strong> − diversity <strong>${diversity.toFixed(1)}</strong> = crowd error <strong>${crowdErr.toFixed(1)}</strong>. <em>Raising diversity lowers crowd error one-for-one, even with unchanged average ability.</em>`;
    }
    [['Members', 3, 40, 1, 'n'], ['Diversity (spread)', 0, 60, 1, 'spread'], ['Shared bias', -30, 30, 1, 'bias']]
      .forEach(([lbl, mn, mx, st, k]) => f.controls.appendChild(slider(lbl, mn, mx, st, P[k], (v) => { P[k] = v; run(); }).wrap));
    const btn = el('button', 'sim-btn', 'New sample'); btn.addEventListener('click', run); f.controls.appendChild(btn);
    run();
  };
})();
