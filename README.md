# The Shape of the Many

A five-book series: a rigorous, literary study of human collective behaviour, built from a shared 100-item curriculum split into five "movements." The series argues one thesis from a hundred angles and reads as a single authored work.

**Thesis:** The wise crowd and the mob are the same people. One mechanism — local interaction producing group-level order — runs under different conditions, and a nameable condition (chiefly independence, diversity, and whether people act before or after they see each other) flips the sign between collective wisdom and collective catastrophe.

## The five books

1. **The Shape Forms** (items 1–25) — the mechanism, its evolutionary roots, the wise crowd.
2. **The Shape Breaks** (items 26–43) — cascades, panics, conformity; the frontier (imposed silence).
3. **The Shape Flows** (items 44–59) — networks and contagion.
4. **The Shape Holds Power** (items 60–85) — markets, governance, ideology; the climax.
5. **The Shape Remade** (items 86–100) — digital swarms, the toolkit; epistemic humility.

## Layout

```
The Shape of the Many/
├── README.md                 ← this file
├── constants-and-style.md    ← thesis, voice, motif, cross-reference map (read every batch)
├── master-list.md            ← the permanent numbered index of all 100 items
├── writing-template.md       ← the fixed 7-beat per-chapter shape
├── citation-policy.md        ← binding honest-sourcing rules
├── quality-checklist.md      ← the pre-done gate
├── progress-tracker.md       ← live status per item
├── batch-notes/              ← one note per batch
├── handoff/                  ← per-book handoff summaries
└── book-N-.../NNN-slug/      ← chapter.md + references.md per item
```

## Rules (non-negotiable)

- **Numbering is permanent.** Never renumber; retire slots instead of shifting.
- **One fixed template, applied identically** to all 100 chapters.
- **Honest sourcing.** Never fabricate a citation; flag anything unverified.
- **Verify mechanically after every batch**, then update the tracker and write a batch note.
- Build one book at a time, in batches of ~5, pausing at checkpoints for review.

## Read online

This repository doubles as a static reading website (GitHub Pages). Every page is
**pre-rendered to real HTML at build time** — no framework, no runtime content
fetching — so crawlers, no-JS readers, and link previews get the actual text.
JavaScript only enhances (search, reading progress, continue-reading).

- `index.html` — series home: thesis, five books, stats, downloads (all baked in).
- `book-N.html` — a book's front matter, chapter list, and closing synthesis.
- `c-bN-NNN.html` — one fully-rendered chapter, with image, references, prev/next.
- `about.html` — thesis, method, and the binding citation policy.
- `assets/` — one stylesheet + small enhancement scripts (search / progress / continue).
- `data/manifest.json` — lightweight index used only by the search box.
- `sitemap.xml`, `robots.txt`, per-page Open Graph / Twitter / JSON-LD metadata.
- `downloads/` — the typeset 6×9 PDFs, DOCX, and Markdown masters.

### Interactive edition (Book One pilot)

Book One chapters carry a learning layer, driven by data in `data/interactive/book-1.json`
and rendered at build time: an **opening prediction**, **confidence-rated quizzes**, and
five **live simulations** — boids flocking (Ch 3), the threshold cascade (Ch 7), the
wisdom-of-crowds estimator (Ch 17), the Condorcet jury (Ch 18), and the diversity-prediction
identity (Ch 19). Progress is stored locally (no accounts) and surfaced on `dashboard.html`
(a mastery map + confidence calibration); `assessment-b1.html` is the end-of-book test.
Engine: `assets/js/interactive.js`, `simulations.js`, `dashboard.js`, `assessment.js`.
To extend to later books, add `data/interactive/book-N.json` in the same shape and rebuild.

### Chapter images

Each chapter carries one relevant, freely-licensed image **hotlinked** from
Wikimedia Commons — no image files live in this repo, so it stays light. The
mapping of chapter → search subject lives in `scripts/images.mjs`, and the
resolved URLs + attribution are cached in `data/images.json`.

```
node scripts/images.mjs            # fetch any chapters missing an image
node scripts/images.mjs --force    # re-fetch all
node scripts/images.mjs 4/085      # re-pick one chapter (edit its query first)
```

To swap a specific image, edit that chapter's query in `scripts/images.mjs`,
re-run it for that key, then rebuild. Every image shows author + licence + a
link back to Commons in its caption.

### Build the site data

```
node scripts/build.mjs
```

This walks the `book-*/` folders, renders each `chapter.md` to HTML, writes the
manifest and per-chapter JSON, and copies the typeset editions into `downloads/`.
Re-run it after editing any chapter. Then open `index.html` (serve the folder, e.g.
`python -m http.server`, since the pages `fetch` JSON).

### Publish to GitHub Pages

The generated `data/` and `downloads/` are committed, so Pages serves the site
directly from the `main` branch root — no build step, no Actions workflow
(`.nojekyll` keeps Jekyll out of the way). After editing chapters:

```
node scripts/build.mjs
git add -A && git commit -m "Update chapters" && git push
```

GitHub rebuilds the Pages site on push. Live at
<https://theunbornlabs.github.io/the-shape-of-the-many/>.

## Status

**Complete.** 100/100 chapters drafted, mechanically verified, and citation-checked;
five Markdown masters plus a combined master assembled; typeset 6×9 PDF + DOCX per book
(902 pp total). Reading website generated. See `progress-tracker.md`.
