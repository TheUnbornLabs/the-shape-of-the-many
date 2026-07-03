# Quality Checklist — the pre-done gate

A chapter is not "Drafted" until every box is true. A batch is not "Verified" until the mechanical checks pass.

## Per-chapter gate

- [ ] All seven beats present (idea, origin, mechanism, anchor example, flip, human weight, critique).
- [ ] Beat 5 (The flip) names the tipping condition and cross-references the paired item by number + name.
- [ ] Beat 7 (The critique) is substantive — real limits/replication/contestation, not a token caveat.
- [ ] The thesis surfaces at least once, in this book's register.
- [ ] Anchor example is concrete and specific enough to be a memory hook.
- [ ] Prose, not bullet-spam. Lists only where genuinely enumerative.
- [ ] Every specific date/claim/quote traces to `references.md`; unconfirmed items flagged.
- [ ] Voice matches constants-and-style.md; no filler transitions, no AI throat-clearing.
- [ ] Length ~1,500–3,000 words (breathing with depth).
- [ ] Frontier thread surfaced where genuine, absent where it would be forced.

## Per-batch mechanical gate (run from shell)

```bash
BOOK="book-1-the-shape-forms"
# each folder has both files
for d in "$BOOK"/0*/; do echo "$d: $(ls "$d" | wc -l) files"; done
# chapter word counts within target
for d in "$BOOK"/0*/; do echo "$d $(wc -w < "$d/chapter.md")"; done
# all seven beats present (expect 7)
for d in "$BOOK"/0*/; do echo "$d beats=$(grep -cE '^## ' "$d/chapter.md")"; done
# scan for fabricated DOIs/links (inspect any hits by hand)
grep -rniE 'doi\.org|https?://doi' "$BOOK"/0*/references.md
```

Then update `progress-tracker.md` and write the batch note.
