# John Maxwell Voice Coach Demo

Mobile-first React/Vite concept demo for a John Maxwell voice coaching app. The interface follows the supplied concept board direction: luxury black background, serif Maxwell wordmark, gold light energy, minimal controls, and a glowing animated center symbol.

## Run

```bash
npm install
npm run dev
```

## Product Notes

- The app is a focused four-tab mobile experience: Home, Journal, Insights, and Profile.
- Home keeps the voice coaching interface with Maxwell Circle, Maxwell Compass, Maxwell Flame, and Leadership Beacon skins.
- The selected skin is persisted in `localStorage` under `john-maxwell-voice-skin`.
- The tap-to-speak area cycles fake demo states: `idle`, `listening`, `reflecting`, and `responding`.
- The realistic demo flow shows a transcript, then a Maxwell response that can be saved as an insight.
- Journal stores lightweight previous conversation examples and opens a conversation detail view.
- Insights lists saved coaching moments plus default leadership quotes.
- Profile includes simple preferences for preferred skin, voice, theme, and About John Maxwell.
- There is no backend and no real voice capture.

## Preview Notes

- Mobile view is the primary target. On wider screens the app remains centered in a phone-like luxury frame so it can be compared against the concept board.
- The central visuals are CSS-built and animated: a breathing gold circle, compass rose, rising flame, and lighthouse beacon.
- Animations are intentionally slow and subtle with gold, navy, and black tones.
- Current visual gaps before real voice integration: the tab icons are simple text glyphs rather than a refined icon set, the Journal entries are static seed data, and the voice response is scripted rather than streamed.

## Hero Asset Architecture

Every skin now renders through a shared `HeroVisual` layer:

```text
HeroVisual
├── Atmosphere Layer
├── Glow Layer
├── Motion Layer
│   └── Asset Layer
├── Particle Layer
└── State Effects Layer
```

Expected final asset paths:

- `/assets/skins/lighthouse-hero.png`
- `/assets/skins/circle-hero.png`
- `/assets/skins/flame-hero.png`
- `/assets/skins/compass-hero.png`

If the PNG exists, the app uses it. If it is missing or fails to load, the current SVG/CSS visual is used automatically.

Recommended asset size: 1600 x 1600 px. Minimum production size: 1200 x 1200 px. Use transparent-background PNGs, centered in a square canvas with 8-12% safe padding. Assets should not include UI controls, text, wordmarks, buttons, or phone chrome.
