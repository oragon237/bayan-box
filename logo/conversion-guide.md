# Bayan — SVG → PNG Conversion Guide

> Converts the Habi Knot SVG assets (`logo/*.svg`) into the PNG files required by the PWA, favicon, and printed referral poster.
> Reference: `logo-integration.md` (Phase 2–3), `brand-guidelines.md` §4 (usage) & §8 (asset checklist)

---

## 1. Required sizes (from the integration plan)

| Output file | Source SVG | Size | Used for |
|---|---|---|---|
| `bayan-tile-512.png` | `bayan-tile.svg` | 512 × 512 | PWA install icon (any + maskable), splash |
| `bayan-tile-192.png` | `bayan-tile.svg` | 192 × 192 | PWA install icon |
| `bayan-mark-64x64.png` | `bayan-logo.svg` (or `bayan-icon.svg`) | 64 × 64 | dompdf referral poster (PNG-safe) |
| `bayan-icon-32.png` | `bayan-icon.svg` | 32 × 32 | Legacy favicon fallback (optional) |
| `bayan-lockup-1200x630.png` | `bayan-lockup.svg` | 1200 × 630 | Social / Open Graph share image |

> **Important**: `bayan-tile.svg` already renders the purple gradient squircle + centered white mark at 512 × 512. Do **not** resize it down with lossy scaling if a crisp result matters — export each PNG at its native size (see commands below). The lockup uses `<text>` (DM Sans); if the font is missing in a CLI renderer, the wordmark falls back to `system-ui` — acceptable for previews, but the production lockup should be converted to SVG paths first (see §4).

---

## 2. Option A — Inkscape (recommended, free & offline)

Install from <https://inkscape.org>. Then, from the `logo/` folder:

```bash
# 512 px app tile (any + maskable)
inkscape bayan-tile.svg --export-type=png --export-filename=bayan-tile-512.png --export-width=512 --export-height=512

# 192 px app tile
inkscape bayan-tile.svg --export-type=png --export-filename=bayan-tile-192.png --export-width=192 --export-height=192

# 64 px mark for the dompdf referral poster
inkscape bayan-logo.svg --export-type=png --export-filename=bayan-mark-64x64.png --export-width=64 --export-height=64

# 32 px favicon fallback
inkscape bayan-icon.svg --export-type=png --export-filename=bayan-icon-32.png --export-width=32 --export-height=32

# Social share image (1200 × 630)
inkscape bayan-lockup.svg --export-type=png --export-filename=bayan-lockup-1200x630.png --export-width=1200 --export-height=343
```

Notes:
- Older Inkscape (0.92.x) used `inkscape -z -e out.png -w 512 -h 512 in.svg`; the `--export-*` flags above are for Inkscape 1.x+. Check with `inkscape --version`.
- For the 1200 × 630 lockup, export with the same aspect ratio as the SVG (220:64 = 3.44:1). `1200 × 343` ≈ 3.5:1; if exact 1200 × 630 is required, place the lockup on a 1200 × 630 canvas (e.g., purple gradient background) in Inkscape first, then export at full canvas size.

---

## 3. Option B — ImageMagick

Install from <https://imagemagick.org> (or `choco install imagemagick` on Windows / `apt install imagemagick` on Linux). Note: ImageMagick renders SVG through a delegate (usually MSVG/rsvg); gradient + rounded corners in `bayan-tile.svg` may render slightly differently than in Inkscape — verify the output visually.

```bash
# Basic resize (keep aspect; 512 tile)
magick bayan-tile.svg -resize 512x512 bayan-tile-512.png

# 192 px tile
magick bayan-tile.svg -resize 192x192 bayan-tile-192.png

# 64 px mark
magick bayan-logo.svg -resize 64x64 bayan-mark-64x64.png

# 32 px favicon fallback
magick bayan-icon.svg -resize 32x32 bayan-icon-32.png

# Force exact dimensions (square tiles are 1:1 so -resize is fine; use -extent for canvas work)
magick bayan-lockup.svg -resize 1200x630 -background white -gravity center -extent 1200x630 bayan-lockup-1200x630.png
```

Notes:
- On older ImageMagick 6.x the binary is `convert`, not `magick`: `convert bayan-icon.svg -resize 64x64 bayan-mark-64x64.png`.
- If SVG rendering is wrong, install `librsvg` (`rsvg-convert`) — usually more faithful:
  `rsvg-convert -w 512 -h 512 bayan-tile.svg -o bayan-tile-512.png`

---

## 4. Option C — Online converter (no install)

1. Go to <https://cloudconvert.com/svg-to-png> (or <https://convertio.co/svg-png/>).
2. Upload the SVG file.
3. Set output format **PNG**; set the width/height you need (512 × 512, 192 × 192, 64 × 64).
4. Download and save to the target filename in the table in §1.

Caveats:
- Free tiers may queue or watermark large batches; for a handful of files it's fine.
- Verify the purple gradient and rounded squircle corners render correctly — some converters mishandle `<defs>` gradients.
- **Never upload proprietary assets to a service you don't trust** — these logo files are internal brand assets.

---

## 5. Verify & place the outputs

1. Open each PNG and confirm: purple gradient tile has rounded squircle corners, white mark centered, amber eye `#fbbf24`, no clipping.
2. Check transparency: `bayan-icon.png` / `bayan-mark-64x64.png` should have a transparent background (`file bayan-mark-64x64.png` should say "RGBA").
3. Copy outputs to where the app expects them (per `logo-integration.md`):
   - `bayan-tile-192.png` / `bayan-tile-512.png` → `frontend/public/`
   - `bayan-mark-64x64.png` → `backend/storage/app/public/` (referral poster controller)
   - `bayan-lockup-1200x630.png` → `frontend/public/` (OG image)

---

## 6. Production note — outline the wordmark

`bayan-lockup.svg` uses `<text>` for "bayan". For pixel-perfect cross-platform rendering:
- In Inkscape: select the text → **Path → Object to Path**, then save as `bayan-lockup-outlined.svg`.
- Or use FontForge / a font-to-path CLI to bake DM Sans 900 into paths.
- Re-run the PNG export from the outlined file. This removes any font-fallback risk in ImageMagick, CI pipelines, and dompdf.
