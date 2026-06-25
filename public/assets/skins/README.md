# Skin Hero Assets

Drop final cinematic hero assets into this folder with these exact filenames:

- `lighthouse-hero.png`
- `circle-hero.png`
- `flame-hero.png`
- `compass-hero.png`

The app automatically uses a matching PNG when it exists. If an asset is missing or fails to load, the current CSS/SVG skin remains visible as the fallback.

Recommended source size: 1600 x 1600 px.
Minimum production size: 1200 x 1200 px.
Preview-safe size: 1024 x 1024 px.

Preferred formats:

- PNG for final transparent hero renders.
- WebP can be added later if file size becomes a problem, but the current runtime contract expects PNG.

Requirements:

- Transparent background.
- Centered subject within the square canvas.
- Preserve 8-12% transparent padding around the subject.
- Do not include UI text, buttons, wordmarks, or app chrome.
- Keep glow inside the asset subtle enough to combine with the app glow layer.
