#!/usr/bin/env python3
"""Assemble the static site.

Pages live in src/pages/ and pull shared chrome in with {{head}}, {{header}},
{{footer}}, {{icons}} and {{mixer}}. Each page is written to the same relative
path at the repo root, which is what GitHub Pages serves.

Landing pages for search intents (karaoke maker, isolate guitar, …) are not
hand-written: src/intents.py holds their copy and src/templates/intent.html their
layout, and each one is rendered to /<slug>/index.html.

Placeholders:
  {{version}}        hash of the CSS and JS, for cache-busting
  {{var:name}}       a per-page value (intent data; empty on other pages)
  {{appstore:ct}}    the App Store link, carrying a campaign token once
                     APPSTORE_PT is set; "@x" expands to "<page>-x"

sitemap.xml is generated from the rendered pages.

    python3 build.py
"""
import hashlib
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE = "https://musicaistudio.app"
APP_ID = "6742150522"

# App Store Connect → Analytics → Acquisition → Campaigns → "Generate campaign
# link" shows it as pt=… . While empty, download links carry no campaign data.
APPSTORE_PT = ""

# Pages kept out of the sitemap (and marked noindex in their own <head>).
UNLISTED = {"404.html", "stemsplit/index.html"}

assets = sorted((ROOT / "assets").glob("[cj]s*/*"))
version = hashlib.sha1(b"".join(p.read_bytes() for p in assets)).hexdigest()[:8]
partials = {p.stem: p.read_text() for p in (SRC / "partials").glob("*.html")}


def appstore_url(ct: str) -> str:
    if not APPSTORE_PT:
        return f"https://apps.apple.com/app/id{APP_ID}"
    return f"https://apps.apple.com/app/apple-store/id{APP_ID}?pt={APPSTORE_PT}&ct={ct[:40]}&mt=8"


def render(text: str, page: str, vars: dict) -> str:
    for _ in range(3):  # partials can contain placeholders of their own
        for name, body in partials.items():
            text = text.replace("{{" + name + "}}", body)
    text = text.replace("{{version}}", version)
    text = re.sub(r"\{\{var:(\w+)\}\}", lambda m: str(vars.get(m.group(1), "")), text)
    text = re.sub(
        r"\{\{appstore:(@?[\w-]+)\}\}",
        lambda m: appstore_url(page + "-" + m.group(1)[1:] if m.group(1).startswith("@") else m.group(1)),
        text,
    )
    left = re.findall(r"\{\{[^}]+\}\}", text)
    if left:
        sys.exit(f"{page}: unreplaced placeholders {sorted(set(left))}")
    return text


def page_name(rel: Path) -> str:
    return "home" if rel.parts == ("index.html",) else (rel.parts[0] if len(rel.parts) > 1 else rel.stem)


def write(rel: Path, text: str, built: list):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text)
    built.append(rel)
    print("built", rel)


built = []

for src in sorted((SRC / "pages").rglob("*.html")):
    rel = src.relative_to(SRC / "pages")
    write(rel, render(src.read_text(), page_name(rel), {}), built)

sys.path.insert(0, str(SRC))
from intents import INTENTS, intent_vars  # noqa: E402

template = (SRC / "templates" / "intent.html").read_text()
for intent in INTENTS:
    write(Path(intent["slug"]) / "index.html", render(template, intent["slug"], intent_vars(intent)), built)

urls = []
for rel in built:
    if str(rel) in UNLISTED:
        continue
    path = "/" if str(rel) == "index.html" else "/" + str(rel.parent) + "/"
    urls.append(f"  <url><loc>{SITE}{html.escape(path)}</loc></url>")
(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n"
)
print(f"sitemap.xml: {len(urls)} urls")
