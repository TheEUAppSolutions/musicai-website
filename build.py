#!/usr/bin/env python3
"""Assemble the static site.

Pages live in src/pages/ and pull shared chrome in with {{head}}, {{header}},
{{footer}} and {{icons}}. Each page is written to the same relative path at the
repo root, which is what GitHub Pages serves. {{version}} becomes a hash of the
CSS and JS so browsers pick up changes without a manual cache-bust.

    python3 build.py
"""
import hashlib
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

assets = sorted((ROOT / "assets").glob("[cj]s*/*"))
version = hashlib.sha1(b"".join(p.read_bytes() for p in assets)).hexdigest()[:8]
partials = {p.stem: p.read_text() for p in (SRC / "partials").glob("*.html")}


def render(text: str) -> str:
    for _ in range(2):  # partials may contain {{version}}
        for name, body in partials.items():
            text = text.replace("{{" + name + "}}", body)
        text = text.replace("{{version}}", version)
    return text


for page in sorted((SRC / "pages").rglob("*.html")):
    out = ROOT / page.relative_to(SRC / "pages")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(page.read_text()))
    print("built", out.relative_to(ROOT))
