# musicaistudio.app

Marketing site for **Stem Split** (App Store id6742150522), by Music AI Studio Ltd.
Plain static HTML/CSS/JS on GitHub Pages, no framework and no dependencies.

## Layout

| Path | What |
|---|---|
| `src/pages/` | Page sources. Edit these, not the generated copies at the root. |
| `src/partials/` | Shared `head`, `header`, `footer` and the SVG `icons` sprite. |
| `assets/` | CSS, JS, images. Screens are the app's raw captures from `MusicMastering/fastlane/screenshots_src/raw`. |
| `assets/js/mixer.js` | The "hear it split" demo: an original loop synthesised live with Web Audio, six stems with mute/solo. No audio files, nothing licensed. |
| `.well-known/apple-app-site-association` | **Universal Links for the app.** `/stemsplit?promo_code=…` opens Stem Split (see `SceneDelegate.handleSelfHostedUniversalLink`). Don't remove it. |
| `stemsplit/` | Fallback page for that link when the app isn't installed. |

## Build and preview

```bash
python3 build.py                        # renders src/pages → repo root
python3 -m http.server 4175             # http://localhost:4175
```

Commit the generated root files; Pages serves `main` as is.

## URLs the app and App Store depend on

Keep these working: `/privacy-policy/`, `/term-and-conditions/` (cited in the App Store
description and inside the app), `/stemsplit`, `/.well-known/apple-app-site-association`.
