#!/usr/bin/env python3
import sys, os, re, subprocess, glob

ROOT = "/sessions/great-gracious-brahmagupta/mnt/The Shape of the Many"
OUTDIR = os.path.join(ROOT, "masters", "typeset")
HEADER = os.path.join(ROOT, "typeset", "header.tex")

# book_key: (folder, Title, Subtitle, out_stem)
BOOKS = {
 "1": ("book-1-the-shape-forms", "The Shape Forms", "Book One", "Book-1-The-Shape-Forms"),
 "2": ("book-2-the-shape-breaks", "The Shape Breaks", "Book Two", "Book-2-The-Shape-Breaks"),
 "3": ("book-3-the-shape-flows", "The Shape Flows", "Book Three", "Book-3-The-Shape-Flows"),
 "4": ("book-4-the-shape-holds-power", "The Shape Holds Power", "Book Four", "Book-4-The-Shape-Holds-Power"),
 "5": ("book-5-the-shape-remade", "The Shape Remade", "Book Five", "Book-5-The-Shape-Remade"),
}

SERIES = "The Shape of the Many"
SERIES_SUB = "How order rises from crowds, and how it breaks"

def strip_title_block(fm_text):
    # Remove the leading "# The Shape of the Many" / "## Book X — ..." / tagline block
    # from the front-matter file; keep from the first "## Movement" onward.
    idx = fm_text.find("## Movement")
    return fm_text[idx:] if idx != -1 else fm_text

def promote_headings(text):
    # Promote "## " (movement intros / bridges / synthesis) to "# " so they become chapters.
    out = []
    for line in text.splitlines():
        if line.startswith("## "):
            out.append("#" + line[2:])   # ## X -> # X
        else:
            out.append(line)
    return "\n".join(out)

def build(book_key):
    folder, title, sub, stem = BOOKS[book_key]
    bdir = os.path.join(ROOT, folder)
    parts = []

    # Front matter (movement intros) -> chapters
    fm_files = glob.glob(os.path.join(bdir, "000-*.md"))
    if fm_files:
        fm = open(fm_files[0], encoding="utf-8").read()
        parts.append(promote_headings(strip_title_block(fm)))

    # Chapters in numeric order
    chdirs = sorted(glob.glob(os.path.join(bdir, "[0-9][0-9][0-9]-*/")))
    for d in chdirs:
        ch = open(os.path.join(d, "chapter.md"), encoding="utf-8").read().rstrip()
        parts.append(ch)

    # Bridges + synthesis -> chapters
    zz = glob.glob(os.path.join(bdir, "zzz-*.md"))
    if zz:
        parts.append(promote_headings(open(zz[0], encoding="utf-8").read()))

    body = "\n\n".join(parts)
    # remove thematic-break rules if any slipped in
    body = re.sub(r'(?m)^-{3,}\s*$', '', body)
    # collapse >2 blank lines
    body = re.sub(r'\n{3,}', '\n\n', body)

    src = os.path.join(OUTDIR, stem + ".typeset.md")
    with open(src, "w", encoding="utf-8") as f:
        f.write(body)

    common = [
        "pandoc", src,
        "--from", "markdown+smart",
        "--top-level-division=chapter",
        "-V", "documentclass=book",
        "-V", "classoption=oneside",
        "-V", f"title={title}",
        "-V", f"subtitle={SERIES} \\textperiodcentered\\ {sub}",
        "-V", "author=",
        "-V", "lang=en-GB",
        "--toc", "--toc-depth=1",
    ]

    # PDF via xelatex
    pdf = os.path.join(OUTDIR, stem + ".pdf")
    pdf_cmd = common + [
        "--pdf-engine=xelatex",
        "-V", "geometry:paperwidth=6in,paperheight=9in,inner=0.85in,outer=0.65in,top=0.8in,bottom=0.8in",
        "-V", "mainfont=TeX Gyre Pagella",
        "-V", "fontsize=11pt",
        "-V", "linkcolor=black", "-V", "urlcolor=black",
        "-H", HEADER,
        "-o", pdf,
    ]
    r = subprocess.run(pdf_cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("PDF FAIL", stem)
        print(r.stderr[-2500:])
        return False

    # DOCX
    docx = os.path.join(OUTDIR, stem + ".docx")
    docx_cmd = common + ["-o", docx]
    r2 = subprocess.run(docx_cmd, capture_output=True, text=True)
    if r2.returncode != 0:
        print("DOCX FAIL", stem); print(r2.stderr[-1500:]); return False

    ps = os.path.getsize(pdf); ds = os.path.getsize(docx)
    print(f"OK {stem}: PDF {ps//1024} KB, DOCX {ds//1024} KB")
    return True

if __name__ == "__main__":
    for k in sys.argv[1:]:
        build(k)
