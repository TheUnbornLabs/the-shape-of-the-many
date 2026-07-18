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

  // ---- 6. Information cascade (Ch 26) --------------------------------------
  SIMS.cascade = function (mount) {
    const f = frame(mount, 'The information cascade', 'One hidden urn is the truth. Each person gets a noisy private hint but sees only the PUBLIC choices before them. Watch how, once two choices agree, everyone rationally copies — sometimes into a shared error.');
    let P = { acc: 0.7, n: 24 };
    const row = el('div', 'sim-cascade-row'); f.stage.appendChild(row);
    let seed = 13; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function run() {
      const truth = rnd() < 0.5 ? 'B' : 'R';
      let pubB = 0, pubR = 0; const picks = [];
      for (let i = 0; i < P.n; i++) {
        const signal = rnd() < P.acc ? truth : (truth === 'B' ? 'R' : 'B');
        const eB = pubB + (signal === 'B' ? 1 : 0), eR = pubR + (signal === 'R' ? 1 : 0);
        const choice = eB > eR ? 'B' : eR > eB ? 'R' : signal;
        picks.push({ choice, signal }); if (choice === 'B') pubB++; else pubR++;
      }
      row.innerHTML = picks.map((p) => `<span class="cas-cell ${p.choice === 'B' ? 'b' : 'r'}" title="private hint: ${p.signal === 'B' ? 'BLUE' : 'RED'}">${p.choice}</span>`).join('');
      const finalChoice = pubB > pubR ? 'B' : 'R', correct = finalChoice === truth;
      f.readout.innerHTML = `Hidden truth: <strong>${truth === 'B' ? 'BLUE' : 'RED'}</strong>. The crowd converged on <strong>${finalChoice === 'B' ? 'BLUE' : 'RED'}</strong> — <em>${correct ? 'correct this time.' : 'wrong: a cascade locked onto the false option.'}</em> Re-run: with lower accuracy, cascades onto the wrong answer are common.`;
    }
    f.controls.appendChild(slider('Private-hint accuracy', 0.55, 0.95, 0.01, P.acc, (v) => { P.acc = v; run(); }).wrap);
    const btn = el('button', 'sim-btn', 'New run'); btn.addEventListener('click', run); f.controls.appendChild(btn); run();
  };

  // ---- 7. Asch conformity (Ch 35) -----------------------------------------
  SIMS.asch = function (mount) {
    const f = frame(mount, 'The Asch conformity pressure', 'The matching line is obvious (it is B). But when a unanimous group answers wrongly before you, the pressure to conform rises with group size — and collapses if even one ally breaks ranks.');
    const cv = el('canvas'); cv.width = 640; cv.height = 150; cv.className = 'sim-canvas'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let P = { size: 3, ally: false };
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.lineWidth = 6; ctx.lineCap = 'round';
      const refH = 80; ctx.strokeStyle = accent(); ctx.beginPath(); ctx.moveTo(80, 125); ctx.lineTo(80, 125 - refH); ctx.stroke();
      ctx.fillStyle = ink(); ctx.font = '12px sans-serif'; ctx.fillText('reference', 48, 142);
      const hs = [refH * 0.7, refH, refH * 1.3], labels = ['A', 'B', 'C'];
      hs.forEach((h, i) => { const x = 300 + i * 110; ctx.strokeStyle = i === 1 ? accent() : ink(); ctx.beginPath(); ctx.moveTo(x, 125); ctx.lineTo(x, 125 - h); ctx.stroke(); ctx.fillStyle = ink(); ctx.fillText(labels[i], x - 4, 142); });
      const base = P.size <= 0 ? 0 : Math.min(0.37, 0.02 + 0.12 * Math.log2(P.size + 1));
      const conf = P.ally ? base * 0.15 : base;
      f.readout.innerHTML = `The correct answer is <strong>B</strong>. With a unanimous majority of <strong>${P.size}</strong>${P.ally ? ' but one dissenting ally' : ''}, roughly <strong>${Math.round(conf * 100)}%</strong> of people echo the group’s wrong answer. <em>${P.ally ? 'A single ally shatters the pressure.' : 'Pressure rises with size, then plateaus around 3–4.'}</em>`;
    }
    f.controls.appendChild(slider('Unanimous majority', 1, 8, 1, P.size, (v) => { P.size = v; draw(); }).wrap);
    const lab = el('label', 'sim-slider'); lab.innerHTML = '<span class="sim-lbl">One dissenting ally</span>';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.style.marginTop = '.3rem'; cb.addEventListener('change', () => { P.ally = cb.checked; draw(); }); lab.appendChild(cb); f.controls.appendChild(lab);
    draw();
  };

  // ---- 8. Small-world rewiring (Ch 44) ------------------------------------
  SIMS.smallworld = function (mount) {
    const f = frame(mount, 'The small-world rewiring', 'A ring where each node links to near neighbours is very clustered but has long paths. Rewire a fraction of edges at random and watch the average distance between nodes collapse.');
    const cv = el('canvas'); cv.width = 640; cv.height = 320; cv.className = 'sim-canvas'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    const N = 24, K = 4; let P = { p: 0 };
    let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function build() {
      const adj = Array.from({ length: N }, () => new Set());
      for (let i = 0; i < N; i++) for (let j = 1; j <= K / 2; j++) { const b = (i + j) % N; adj[i].add(b); adj[b].add(i); }
      for (let i = 0; i < N; i++) for (let j = 1; j <= K / 2; j++) if (rnd() < P.p) { const b = (i + j) % N; adj[i].delete(b); adj[b].delete(i); let t = Math.floor(rnd() * N), g = 0; while ((t === i || adj[i].has(t)) && g++ < 50) t = Math.floor(rnd() * N); adj[i].add(t); adj[t].add(i); }
      return adj;
    }
    function avgPath(adj) { let tot = 0, cnt = 0; for (let s = 0; s < N; s++) { const d = new Array(N).fill(-1); d[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); for (const v of adj[u]) if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } } for (let t = 0; t < N; t++) if (t !== s && d[t] > 0) { tot += d[t]; cnt++; } } return cnt ? tot / cnt : 0; }
    function draw() {
      const adj = build(); const cx = cv.width / 2, cy = cv.height / 2, R = 135; const pos = [];
      for (let i = 0; i < N; i++) { const a = i / N * 2 * Math.PI; pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.strokeStyle = ink(); ctx.globalAlpha = 0.45;
      for (let i = 0; i < N; i++) for (const j of adj[i]) if (j > i) { ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = accent(); for (const [x, y] of pos) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
      const L = avgPath(adj); f.readout.innerHTML = `Rewiring probability <strong>${P.p.toFixed(2)}</strong> → average path length <strong>${L.toFixed(2)}</strong> steps. <em>${P.p < 0.02 ? 'A pure lattice: neighbours only, far apart.' : 'A few random shortcuts collapse the distance — six degrees of separation.'}</em>`;
    }
    f.controls.appendChild(slider('Rewiring probability', 0, 0.5, 0.02, P.p, (v) => { P.p = v; draw(); }).wrap);
    const btn = el('button', 'sim-btn', 'Re-roll'); btn.addEventListener('click', draw); f.controls.appendChild(btn); draw();
  };

  // ---- 9. Network contagion, SIR (Ch 53) ----------------------------------
  SIMS.network = function (mount) {
    const f = frame(mount, 'Contagion on a network (SIR)', 'Green = susceptible, red = infected, grey = recovered. Each step, infected nodes infect susceptible neighbours with probability β and recover with probability γ. Above R ≈ 1 it becomes an epidemic.');
    const G = 26, cell = 12; const cv = el('canvas'); cv.width = G * cell; cv.height = G * cell; cv.className = 'sim-canvas'; cv.style.maxWidth = (G * cell) + 'px'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let P = { beta: 0.3, gamma: 0.12 }, state, timer, t;
    let seed = 17; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function reset() { state = new Array(G * G).fill(0); const c = Math.floor(G / 2); state[c * G + c] = 1; t = 0; }
    function neigh(i) { const x = i % G, y = i / G | 0, r = []; if (x > 0) r.push(i - 1); if (x < G - 1) r.push(i + 1); if (y > 0) r.push(i - G); if (y < G - 1) r.push(i + G); return r; }
    function step() { const nx = state.slice(); let I = 0; for (let i = 0; i < state.length; i++) if (state[i] === 1) { I++; if (rnd() < P.gamma) nx[i] = 2; for (const j of neigh(i)) if (state[j] === 0 && rnd() < P.beta) nx[j] = 1; } state = nx; return I; }
    function draw() { for (let i = 0; i < state.length; i++) { ctx.fillStyle = state[i] === 0 ? '#5aa06f' : state[i] === 1 ? '#b0413e' : '#9a938a'; ctx.fillRect((i % G) * cell, (i / G | 0) * cell, cell - 1, cell - 1); } }
    function loop() { const I = step(); draw(); t++; const S = state.filter((v) => v === 0).length, R = state.filter((v) => v === 2).length, r0 = P.beta * 4 / P.gamma; f.readout.innerHTML = `Step ${t} · susceptible ${S} · infected ${I} · recovered ${R} · R₀ ≈ <strong>${r0.toFixed(2)}</strong> ${r0 > 1 ? '(epidemic)' : '(fizzles out)'}`; if (I > 0 && t < 400) timer = setTimeout(loop, 110); }
    function start() { clearTimeout(timer); reset(); draw(); loop(); }
    f.controls.appendChild(slider('Transmission β', 0.02, 0.6, 0.02, P.beta, (v) => { P.beta = v; }).wrap);
    f.controls.appendChild(slider('Recovery γ', 0.02, 0.4, 0.02, P.gamma, (v) => { P.gamma = v; }).wrap);
    const btn = el('button', 'sim-btn', 'Restart outbreak'); btn.addEventListener('click', start); f.controls.appendChild(btn);
    start(); mount._cleanup = () => clearTimeout(timer);
  };

  // ---- 10. Schelling segregation (Ch 67) ----------------------------------
  SIMS.schelling = function (mount) {
    const f = frame(mount, 'Schelling’s segregation model', 'Two groups share a grid with empty cells. Each agent is content if at least the threshold fraction of its neighbours share its colour; discontent agents move to a random empty cell. Mild preferences produce stark segregation.');
    const G = 30, cell = 11; const cv = el('canvas'); cv.width = G * cell; cv.height = G * cell; cv.className = 'sim-canvas'; cv.style.maxWidth = (G * cell) + 'px'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let P = { thr: 0.33 }, grid, timer;
    let seed = 29; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function reset() { grid = Array.from({ length: G * G }, () => rnd() < 0.1 ? 0 : rnd() < 0.5 ? 1 : 2); }
    function happy(i) { const c = grid[i]; if (c === 0) return true; const x = i % G, y = i / G | 0; let same = 0, tot = 0; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue; const n = grid[ny * G + nx]; if (n === 0) continue; tot++; if (n === c) same++; } return tot === 0 ? true : same / tot >= P.thr; }
    function step() { const empties = []; for (let i = 0; i < grid.length; i++) if (grid[i] === 0) empties.push(i); let moved = 0; for (let i = 0; i < grid.length; i++) if (grid[i] !== 0 && !happy(i) && empties.length) { const k = Math.floor(rnd() * empties.length), dst = empties[k]; grid[dst] = grid[i]; grid[i] = 0; empties[k] = i; moved++; } return moved; }
    function seg() { let same = 0, tot = 0; for (let i = 0; i < grid.length; i++) { if (grid[i] === 0) continue; const x = i % G, y = i / G | 0; for (const [dx, dy] of [[1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (nx >= G || ny >= G) continue; const n = grid[ny * G + nx]; if (n === 0) continue; tot++; if (n === grid[i]) same++; } } return tot ? same / tot : 0; }
    function draw() { ctx.clearRect(0, 0, cv.width, cv.height); for (let i = 0; i < grid.length; i++) { ctx.fillStyle = grid[i] === 0 ? 'rgba(0,0,0,0.05)' : grid[i] === 1 ? '#6b4f8a' : '#c98a3a'; ctx.fillRect((i % G) * cell, (i / G | 0) * cell, cell - 1, cell - 1); } }
    function loop() { const moved = step(); draw(); const s = seg(); f.readout.innerHTML = `Similar-neighbour threshold <strong>${Math.round(P.thr * 100)}%</strong> · same-colour adjacency <strong>${Math.round(s * 100)}%</strong> · ${moved} moved. <em>${moved === 0 ? 'Settled — segregated even though everyone was fairly tolerant.' : 'Sorting…'}</em>`; if (moved > 0) timer = setTimeout(loop, 170); }
    function start() { clearTimeout(timer); reset(); draw(); loop(); }
    f.controls.appendChild(slider('Similar-neighbour threshold', 0.1, 0.8, 0.05, P.thr, (v) => { P.thr = v; }).wrap);
    const btn = el('button', 'sim-btn', 'Reset & run'); btn.addEventListener('click', start); f.controls.appendChild(btn);
    start(); mount._cleanup = () => clearTimeout(timer);
  };

  // ---- 11. Keynes beauty contest (Ch 61) ----------------------------------
  SIMS.beauty = function (mount) {
    const f = frame(mount, 'Keynes’ two-thirds beauty contest', 'Guess a number 0–100. The winner is closest to two-thirds of everyone’s average. See where your guess lands against a crowd that reasons a chosen number of steps deep.');
    let P = { levels: 2, guess: 33 };
    const inWrap = el('div', 'sim-guess'); inWrap.innerHTML = '<span class="sim-lbl">Your guess (0–100)</span>';
    const gi = document.createElement('input'); gi.type = 'number'; gi.min = 0; gi.max = 100; gi.value = 33; gi.className = 'sim-num'; inWrap.appendChild(gi); f.stage.appendChild(inWrap);
    let seed = 41; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function run() {
      P.guess = Math.max(0, Math.min(100, parseFloat(gi.value) || 0));
      const crowd = []; for (let i = 0; i < 200; i++) { const lvl = Math.floor(rnd() * (P.levels + 1)); crowd.push(Math.max(0, Math.min(100, 50 * Math.pow(2 / 3, lvl) + (rnd() * 2 - 1) * 4))); }
      crowd.push(P.guess); const avg = crowd.reduce((a, b) => a + b, 0) / crowd.length, target = 2 / 3 * avg;
      const winner = crowd.reduce((best, g) => Math.abs(g - target) < Math.abs(best - target) ? g : best, crowd[0]);
      f.readout.innerHTML = `Crowd average <strong>${avg.toFixed(1)}</strong> → target (⅔ of it) <strong>${target.toFixed(1)}</strong>. Winning guess ≈ <strong>${winner.toFixed(1)}</strong>. Yours (${P.guess.toFixed(0)}) was ${Math.abs(P.guess - target).toFixed(1)} away. <em>${P.levels >= 4 ? 'Deep reasoning drives the crowd toward 0 — the Nash equilibrium almost nobody reaches.' : 'Real crowds reason a step or two, so the target sits near 20–35, not 0.'}</em>`;
    }
    f.controls.appendChild(slider('Crowd’s reasoning depth', 0, 6, 1, P.levels, (v) => { P.levels = v; run(); }).wrap);
    const btn = el('button', 'sim-btn', 'Submit guess'); btn.addEventListener('click', run); f.controls.appendChild(btn);
    gi.addEventListener('change', run); run();
  };

  // ---- 12. Iterated prisoner's dilemma tournament (Ch 95) -----------------
  SIMS.ipd = function (mount) {
    const f = frame(mount, 'The prisoner’s dilemma tournament', 'Five strategies play repeated games against each other (Axelrod’s tournament). Mutual cooperation pays 3/3, mutual defection 1/1, a lone betrayal 5/0. See which survives.');
    let P = { rounds: 50, noise: 0 };
    let seed = 53; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const strategies = {
      'Always cooperate': () => () => 'C',
      'Always defect': () => () => 'D',
      'Tit-for-Tat': () => (myH, oppH) => oppH.length ? oppH[oppH.length - 1] : 'C',
      'Grudger': () => { let mad = false; return (myH, oppH) => { if (oppH.length && oppH[oppH.length - 1] === 'D') mad = true; return mad ? 'D' : 'C'; }; },
      'Random': () => () => rnd() < 0.5 ? 'C' : 'D'
    };
    const PAY = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };
    function playMatch(a, b) { const fa = strategies[a](), fb = strategies[b](), ha = [], hb = []; let sa = 0, sb = 0; for (let i = 0; i < P.rounds; i++) { let ma = fa(ha, hb), mb = fb(hb, ha); if (P.noise && rnd() < P.noise) ma = ma === 'C' ? 'D' : 'C'; if (P.noise && rnd() < P.noise) mb = mb === 'C' ? 'D' : 'C'; const [pa, pb] = PAY[ma + mb]; sa += pa; sb += pb; ha.push(ma); hb.push(mb); } return [sa, sb]; }
    function run() {
      const names = Object.keys(strategies), score = {}; names.forEach((n) => score[n] = 0);
      for (let i = 0; i < names.length; i++) for (let j = 0; j < names.length; j++) { const [sa] = playMatch(names[i], names[j]); score[names[i]] += sa; }
      const ranked = names.slice().sort((a, b) => score[b] - score[a]);
      f.readout.innerHTML = '<div class="ipd-table">' + ranked.map((n, k) => `<div class="assess-track"><span>${k + 1}. ${n}</span><span>${score[n]}</span></div>`).join('') + '</div>' + `<p style="margin:.6rem 0 0"><em>${P.noise > 0.05 ? 'With noise, unforgiving strategies suffer — forgiveness helps recover from accidental defections.' : 'The “nice” strategies (never defect first) typically top the table — Axelrod’s finding.'}</em></p>`;
    }
    f.controls.appendChild(slider('Rounds per match', 5, 200, 5, P.rounds, (v) => { P.rounds = v; run(); }).wrap);
    f.controls.appendChild(slider('Noise (misfires)', 0, 0.2, 0.01, P.noise, (v) => { P.noise = v; run(); }).wrap);
    const btn = el('button', 'sim-btn', 'Run tournament'); btn.addEventListener('click', run); f.controls.appendChild(btn); run();
  };

  // ---- 13. Conway's Game of Life (Ch 97) ----------------------------------
  SIMS.life = function (mount) {
    const f = frame(mount, 'Conway’s Game of Life', 'Four rules on a grid: a live cell with 2–3 live neighbours survives; a dead cell with exactly 3 is born; all else dies. From this, gliders crawl and structures compute.');
    const G = 46, cell = 8; const cv = el('canvas'); cv.width = G * cell; cv.height = G * cell; cv.className = 'sim-canvas'; cv.style.maxWidth = (G * cell) + 'px'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let grid, timer, running = true;
    let seed = 61; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function reset() { grid = Array.from({ length: G * G }, () => rnd() < 0.28 ? 1 : 0); }
    function step() { const n = new Array(G * G); for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; c += grid[((y + dy + G) % G) * G + ((x + dx + G) % G)]; } const i = y * G + x; n[i] = grid[i] ? (c === 2 || c === 3 ? 1 : 0) : (c === 3 ? 1 : 0); } grid = n; }
    function draw() { ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = accent(); for (let i = 0; i < grid.length; i++) if (grid[i]) ctx.fillRect((i % G) * cell, (i / G | 0) * cell, cell - 1, cell - 1); }
    function loop() { if (running) step(); draw(); timer = setTimeout(loop, 90); }
    const b1 = el('button', 'sim-btn', 'Pause / play'); b1.addEventListener('click', () => running = !running);
    const b2 = el('button', 'sim-btn', 'Reseed'); b2.addEventListener('click', reset);
    f.controls.append(b1, b2);
    reset(); loop(); f.readout.innerHTML = 'Simple local rules; complex global life. Look for “gliders” — five-cell patterns that travel diagonally across the grid.';
    mount._cleanup = () => clearTimeout(timer);
  };

  // ---- 14. Power law from preferential attachment (Ch 98) -----------------
  SIMS.powerlaw = function (mount) {
    const f = frame(mount, 'Power laws from rich-get-richer', 'Grow a network by adding nodes that attach preferentially to already-popular nodes. The result is a heavy-tailed degree distribution — a few giant hubs, most nodes tiny — nothing like a bell curve.');
    const cv = el('canvas'); cv.width = 640; cv.height = 240; cv.className = 'sim-canvas'; f.stage.appendChild(cv); const ctx = cv.getContext('2d');
    let P = { strength: 1, n: 2000 };
    let seed = 71; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    function run() {
      const deg = [1, 1], targets = [0, 1];
      for (let i = 2; i < P.n; i++) { let t; if (rnd() < Math.min(1, P.strength)) t = targets[Math.floor(rnd() * targets.length)]; else t = Math.floor(rnd() * i); deg[i] = 1; deg[t]++; targets.push(i, t); }
      const maxD = Math.max(...deg), bins = new Array(maxD + 1).fill(0); deg.forEach((d) => bins[d]++);
      ctx.clearRect(0, 0, cv.width, cv.height); const W = cv.width - 50, H = cv.height - 40, x0 = 40, y0 = 10;
      ctx.strokeStyle = ink(); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + H); ctx.lineTo(x0 + W, y0 + H); ctx.stroke();
      ctx.fillStyle = ink(); ctx.font = '11px sans-serif'; ctx.fillText('log degree →', x0 + W - 74, y0 + H + 16); ctx.fillText('log count', 2, y0 + 8);
      ctx.fillStyle = accent(); for (let d = 1; d < bins.length; d++) if (bins[d] > 0) { const lx = Math.log(d) / Math.log(maxD || 2), ly = Math.log(bins[d]) / Math.log(deg.length); ctx.beginPath(); ctx.arc(x0 + lx * W, y0 + H - ly * H, 3, 0, 7); ctx.fill(); }
      f.readout.innerHTML = `Largest hub: <strong>${maxD}</strong> links; most nodes have just 1–2. On log–log axes the tail falls in a near-straight line — the signature of a power law. <em>${P.strength > 0.8 ? 'Strong preferential attachment → extreme hubs.' : 'Weaken it toward random attachment and the hubs shrink.'}</em>`;
    }
    f.controls.appendChild(slider('Preferential attachment', 0, 1, 0.05, P.strength, (v) => { P.strength = v; run(); }).wrap);
    const btn = el('button', 'sim-btn', 'Regrow network'); btn.addEventListener('click', run); f.controls.appendChild(btn); run();
  };
})();
