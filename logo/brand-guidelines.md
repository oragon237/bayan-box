# Bayan — Brand Asset Guidelines

> **Brand**: Bayan — Provincial Last-Mile Logistics & Local E-Commerce PWA  
> **Reference**: `bayanbox-prd-v3.md §9`, `uiux/design-system.md` (authoritative tokens)  
> **Applies to**: frontend (React/Tailwind), PWA assets, printed referral posters, social media  
> **Version**: 1.0

---

## 1. Brand Foundation

Bayan is the **"phygital" heartbeat of the Philippine province** — a friendly, trustworthy platform that connects sari-sari stores, local MSMEs, riders, customers, and skilled workers in one woven marketplace. The brand is:

- **Filipino-first** — local culture, local language, local pride.
- **Neighborly** — like the sari-sari tiangge where everyone knows your name.
- **Trustworthy** — money, parcels, and deliveries handled with care and full traceability.

**One line**: *"Ang habi ng bayan — pina-deliver namin, pinagkakatiwala namin."*  
(The weave of the town — we deliver it, we steward it.)

---

## 2. Color Palette

### 2.1 Primary brand palette — `bayan-*` (purple)

| Token | Hex | Usage rule |
|---|---|---|
| `bayan-50` | `#f0ecfe` | Badge/card tint backgrounds, soft category chips |
| `bayan-100` | `#e0d8fd` | Soft image placeholder gradients, hover tints |
| `bayan-500` | `#8058ee` | Hero gradient endpoint, light purple backgrounds |
| `bayan-600` | **`#673de6`** | **PRIMARY.** Buttons, active nav, links, logo strands, role chips |
| `bayan-700` | `#5633c4` | Hover states, hero gradient start, app icon gradient start |
| `bayan-800` | `#4627a5` | Deep purple surfaces (Auth.jsx gradient uses via-bayan-800) |

**Rules**
- One purple. Never introduce a second purple hex.
- `bayan-600` is the single brand anchor for interactive elements (white text on it = 6.3:1 AA ✓).
- Gradients: always `from-bayan-700` → `to-bayan-500` (dark to light purple), never reversed unexpectedly.

### 2.2 Secondary neutral palette — `ink-*` (deep charcoal)

| Token | Hex | Usage rule |
|---|---|---|
| `ink-100` | `#f1f5f9` | App background, page tint |
| `ink-200` | `#e2e8f0` | Dividers, skeletons, disabled fills |
| `ink-300` | `#cbd5e1` | Borders (lighter), placeholder icons |
| `ink-400` | `#94a3b8` | **DISABLED / decorative ONLY** — never readable copy (2.6:1 ✗) |
| `ink-500` | `#64748b` | Section labels, secondary meta text (AA ✓) |
| `ink-600` | `#475569` | Secondary body text, inactive bottom-nav text |
| `ink-700` | `#334155` | Body text (AA ✓) |
| `ink-800` | `#1e293b` | Headings, product names, prices |
| `ink-900` | `#0f172a` | Dark surfaces: sticky header, dark sections. **Logo ink = `#12111d`** (a deeper, warmer charcoal reserved for the logo/wordmark so it reads as true black-charcoal) |

**Rules**
- Dark UI (headers, dark sections) always uses `ink-900` (`#0f172a`) as the surface.
- Text hierarchy: headings `ink-800`, body `ink-700`, meta `ink-500`.
- Never `ink-400` for anything a user must read.

### 2.3 Accent palette — `amber-*` (suki / points / earning)

| Token | Hex | Usage rule |
|---|---|---|
| `amber-400` | `#fbbf24` | Logo eye on dark bg, demo badges, star ratings |
| `amber-500` | `#f59e0b` | Logo eye on light bg, "Sponsored" badges, Points CTAs |
| `amber-600` | `#d97706` | Hover for amber CTAs |
| `amber-950` | `#451a03` | Text on amber-400 badges (high contrast ✓) |

**Rules**
- Amber = **earning, points, loyalty, promos, sponsored** — never a general-purpose CTA color.
- The logo eye uses `amber-500` on light backgrounds, `amber-400` on dark/purple tiles.

### 2.4 Semantic / status palette

| Token | Hex | Usage rule |
|---|---|---|
| `red-500` | `#ef4444` | SALE badges, out-of-range warnings (use red-600 for text) |
| `red-600` | `#dc2626` | Warning / destructive **text** (4.8:1 ✓) |
| `green-400` | `#4ade80` | "Online" pulse dot, success |
| `green-600` | `#16a34a` | Money-in / positive values (finance screens) |
| `orange-600` | `#ea580c` | Affiliate "Share & earn" hint links |

---

## 3. Typography

**Font family**: DM Sans (fallback `system-ui`). Loaded in `index.html` with weights 400/500/700/800/900. Weights used in the brand: **500** (body), **700** (bold), **800** (extrabold), **900** (black).

| Role | Size / Weight | Usage |
|---|---|---|
| Display | 24 px / 900 (`text-2xl font-black tracking-tight`) | Hero headings, page titles |
| Title | 18 px / 900 (`text-lg font-black`) | Screen titles, featured names, sale prices |
| Heading | 14 px / 700 (`text-sm font-bold`) | Card titles, product names, section headers |
| Body | 14 px / 500 (`text-sm text-ink-700`) | Descriptions, body copy |
| Label | 12 px / 700 (`text-xs font-bold`) | Field labels, buttons, chips |
| Meta | 11 px / 600 (`text-[11px] font-semibold text-ink-500`) | Meta, badges (min practical size) |
| Stat / Price | 18 px / 900 (`text-lg font-black`) + `tabular-nums` | KPI numbers, prices |

**Wordmark**: "bayan" in DM Sans **900 lowercase**, `-0.02em` tracking. Never all-caps.

**Number rule**: `₱` amounts always formatted `₱1,250` with grouping and `tabular-nums`. Never `P1250` or `₱ 1250`.

**A11y rules**: no body copy below 12 px; badges ≥ 11 px bold; prices ≥ 18 px. Hierarchy via **weight**, not size-only.

---

## 4. Logo Usage

### 4.1 Logo variants

| Variant | Use | File |
|---|---|---|
| Full-color mark | Light backgrounds, documents, favicon | `bayan-logo.svg` |
| White mark | Dark surfaces (`ink-900` header), dark hero | `bayan-logo-white.svg` |
| App icon tile | PWA install, home screen, browser tab | `bayan-tile-512.png` / `192.png` |
| Horizontal lockup | Header, login, marketing | `bayan-lockup.svg` |
| Stacked lockup | Square spaces, social avatars | (stacked lockup SVG) |

### 4.2 Clear space

- Minimum clear space = **8 px** (the height of the "b" bowl) on all sides of the lockup.
- Never place the logo closer than that to text, UI edges, or other marks.
- Icon-to-wordmark gap = **12 px** in the horizontal lockup.

### 4.3 Minimum sizes

| Context | Minimum |
|---|---|
| Mark (icon) | 24 × 24 px — below this use the mark alone, never the lockup |
| Horizontal lockup | 160 px wide |
| Wordmark | 60 px wide |
| App icon (install) | 192 × 192 px (provide 512 × 512 for store-quality) |

### 4.4 Dark & light variants

- **Light backgrounds** (white, `ink-100`): full-color mark (purple + ink + amber eye).
- **Dark surfaces** (`ink-900` header, dark hero, dark tile): **white mark** with `amber-400` eye — never the ink strand on a dark bg (it disappears).
- **Purple gradient tile**: white mark + `amber-400` eye (this is the app icon).

### 4.5 Favicon

- Use the **mark only** (no wordmark) — `bayan-icon.svg` at 32 px and 16 px.
- On light backgrounds: purple + ink + amber eye. The six arms read as a hexagonal knot with a warm center.
- Do not use the app icon tile as the favicon unless the tile is explicitly desired (the transparent mark is cleaner in the browser tab).

### 4.6 App icon (PWA)

- Squircle tile, purple gradient (`#5633c4` → `#8058ee`), white Habi Knot, amber-400 eye.
- **Maskable**: mark fits within the central 80 % safe zone (no cropping of strands).
- Provide both 512 × 512 and 192 × 192 PNG renders.

### 4.7 PWA splash

- Splash uses the app icon tile on a `#673de6` or `ink-900` background (see `logo-integration.md`).
- Do not put the lockup (icon + wordmark) into the splash tile — the tile must be the mark alone.

### 4.8 Logo do / don't

| ✅ Do | ❌ Don't |
|---|---|
| Use only official variants (full color / white / tile) | Recolor strands arbitrarily |
| Keep clear space ≥ 8 px | Stretch, rotate, or add drop shadows |
| Use mark alone under 160 px lockup width | Place on busy photos without a background scrim |
| Match `bayan-600` / `#12111d` / `amber-500` exactly | Use the old green `#16a34a` or any "BayanBox" text |

---

## 5. Iconography Style

- **Stroke-based, rounded**: consistent with the Habi Knot. Icons use rounded caps/joins, never sharp corners.
- **Stroke width**: 1.75–2 px on a 24 px grid (design-system `icons.jsx` set).
- **Corner radius**: rounded-2xl (16 px) cards, rounded-xl (12 px) interactive chips.
- **Icon sizes**: 16 / 20 / 24 / 32 px; bottom nav icons `w-5 h-5` (20 px); tap targets ≥ 44 px.
- **Color**: `ink-600` idle, `bayan-600` active — same as design-system nav rules.
- **Emoji vs icons**: emojis (🏪 🏠 🪙 📍) are allowed for friendly meta in the UI (per current app usage) but **never** replace the logo mark. The Habi Knot is the only official logo.

---

## 6. Photography & Image Style

Bayan's imagery should feel like **your neighbor's province** — warm, real, community-first:

| Principle | Direction |
|---|---|
| **Warmth** | Golden-hour light, warm color grades (amber/golden casts), not cold/clinical |
| **Locality** | Sari-sari storefronts, jeepneys, market aisles, bayong bags, rice paddies, provincial streets |
| **People** | Real Filipinos at work: riders on motorbikes, merchants behind counters, customers smiling |
| **Authenticity** | Candid over staged; avoid corporate stock-photo stiffness |
| **Purpose** | Every image supports a story: delivery, commerce, community, trust |

**Image treatment rules**
- Product images: clean on white or soft `bayan-100→ink-100` gradient placeholders (never remote `placehold.co` — offline-first PWA, per ui-audit Issue 10).
- Banner/hero images: overlay a purple gradient scrim (`from-bayan-700/80 to-bayan-500/70`) so white text stays legible.
- Alt text: meaningful, describes the subject ("Rider delivering a bayong of groceries to a sari-sari store").

---

## 7. Brand Voice

**Filipino-first, neighborly, trustworthy.** Write the way a trusted kuya/ate would talk — clear, warm, and a little playful, but always reliable.

| Trait | Example |
|---|---|
| **Neighborly** | "Kumusta, kabayan! Ready na ang order mo." |
| **Trustworthy** | "May 72-hour hold pa ang commission mo — safe at recorded." |
| **Local-first** | "Delivered from Mang Juan Store, 3.2 km away." |
| **Suki / loyalty** | "May +10 Suki points ka na. Sulit!" |
| **Clear about money** | "₱1,250 na ang nasa wallet mo." |

**Tone rules**
- Use natural Taglish/regional code-switching **in friendly copy** (not in system/error messages).
- Errors: calm and specific — "Check your connection" / "Delivery unavailable — outside our 100 km service area." Never raw JSON or jargon.
- Money: always exact, formatted, tabular. Never "approx ₱."
- Avoid: corporate buzzwords ("synergy", "leverage"), sarcasm, scare tactics, or text-heavy marketing.

**Wordlist**

| ✅ Use | ❌ Avoid |
|---|---|
| Bayan (brand, lowercase) | BayanBox, beboolbox, BodegaBarangay, becoolbox |
| Suki / Suki Points | Loyalty credits (vague) |
| Rider / merchant / customer | Driver / vendor / user (when roles matter) |
| Delivery | Parcel only when referring to the legacy parcel domain |
| Provincial | Rural (diminishing) |
| PWA offline mode | "App is down" |

---

## 8. Asset Checklist (approved deliverables)

| Asset | Format | Where it lands |
|---|---|---|
| `bayan-logo.svg` | SVG | `frontend/public/` |
| `bayan-logo-white.svg` | SVG | `frontend/public/` |
| `bayan-icon.svg` | SVG | `frontend/public/` (replaces `favicon.svg`) |
| `bayan-icon-white.svg` | SVG | `frontend/public/` |
| `bayan-lockup.svg` | SVG | `frontend/public/` |
| `bayan-tile-512.png` / `-192.png` | PNG | `frontend/public/` (manifest icons) |
| `bayan-mark-64x64.png` | PNG | backend (dompdf referral poster) |
| `bayan-share-1200x630.png` | PNG | social / OG / PWA share |
| `bayan-splash.png` | PNG | PWA splash |

All assets must be generated from the approved Habi Knot concept (`logo-concept.md`) and validated against this guideline's color, spacing, and minimum-size rules.
