# Bayan — Logo Design Concept

> **Brand**: Bayan — Provincial Last-Mile Logistics & Local E-Commerce PWA  
> **Designer role**: Logo & Graphic Designer  
> **Reference**: `bayanbox-prd-v3.md §9`, `uiux/design-system.md`, `uiux/ui-audit.md` (Issue 13)  
> **Status**: Concept proposal, ready for design refinement

---

## 1. Logo Name & Concept

### Mark: **"Habi Knot"** (Habing Bayan — the weave of the town)

| Element | Meaning |
|---|---|
| **Weave / Habi** | The bayong (woven market bag), banig (woven mat), and habi textile — distinctly Filipino handcraft. The bayong is the market bag that carries goods, making it the perfect symbol for local commerce. |
| **Three strands** | Merchant → Rider → Customer — the three community threads that Bayan weaves together. Each strand is essential; the knot only holds when all three interlock. |
| **Hexagon** | A town node, a meeting point, a "suki" hub. Not a box — a community center. The hexagonal silhouette also subtly echoes the hexagonal shape of woven banig. |
| **Amber diamond eye** | The "suki" (trusted relationship) at the center of every transaction. Also reads as the town plaza / heart of the barangay. The amber color ties to Bayan's Suki Points loyalty and earning CTAs. |

### Why this concept — and not the alternatives

| Concept | Rejected because |
|---|---|
| **Box / Parcel** | Explicitly instructed to avoid. Reads as generic logistics (LBC, J&T, DHL). |
| **Jeepney** | Too complex geometrically for a favicon; risks looking like a transport company (UV Express, jeepney routes). |
| **Kalabaw (carabao)** | Agricultural — reads as farming/meat, not commerce. Difficult to simplify cleanly at 16px without looking like a generic buffalo. |
| **Bayong (literal bag)** | Packaging-adjacent; read as "bag" icon, risks confusion with Box. |
| **Philippine flag sun** | Too close to government/heraldry; our 6-ray alternating weave is distinct from the 8-ray flag sun. |
| **Habi Knot (chosen)** | Abstract, geometric, scalable, uniquely Filipino craft reference, not a copy of any existing brand. Works at 16px and 512px. |

---

## 2. Logo Architecture

**Combination mark** — icon-primary, wordmark-secondary. The icon is the hero; the wordmark "bayan" (DM Sans 900, lowercase) sits beside or below the icon.

```
┌──────────┐  ┌──────────────┐
│  Habi    │  │  bayan       │
│  Knot    │  │  (wordmark)  │
│  icon    │  │              │
└──────────┘  └──────────────┘
  64×64 px      ~140×64 px
```

- **Primary lockup**: horizontal (icon + wordmark, side by side)
- **Stacked lockup**: icon above wordmark (for square spaces, social media)
- **Icon-only**: mark alone (favicon, app icon, header avatar, badge, notification)
- **Wordmark-only**: "bayan" in DM Sans 900 (legal pages, forms, when icon is redundant)

---

## 3. Color Palette

The Habi Knot uses three colors from the Bayan design system:

| Token | Hex | Role in Logo |
|---|---|---|
| `bayan-600` | **`#673de6`** | Diagonal strands (purple, two of three strands) |
| `ink-900` | **`#12111d`** | Vertical strand + diamond eye outline (deep charcoal) |
| `amber-500` | **`#f59e0b`** | Woven hub eye fill (accent, suki node) |
| `white` | **`#ffffff`** | Strands on dark backgrounds (app icon tile, dark header) |
| `ink-100` | **`#f1f5f9`** | App icon tile background (light variant) |

### Variant palettes

| Variant | Strands | Eye fill | Eye stroke | Background |
|---|---|---|---|---|
| Full color (light) | Purple + Ink | Amber | Ink | Transparent |
| Mono ink | Ink | Ink | — | Transparent |
| Mono white | White | White | — | Transparent |
| App icon tile | White | Amber-400 `#fbbf24` | White | Purple gradient |
| Dark header | White | Amber-400 `#fbbf24` | White | Ink-900 |

---

## 4. Typography — Wordmark

| Attribute | Value |
|---|---|
| **Font family** | DM Sans (fallback `system-ui, sans-serif`) |
| **Weight** | 900 (Black) |
| **Case** | lowercase `bayan` |
| **Letter-spacing** | `-0.02em` (tight) |
| **Size (lockup)** | 40–44 px (relative to 64 px tall icon) |
| **Color** | `ink-900` (#12111d) on light; `white` on dark |
| **Optional accent** | An amber dot (•) after the wordmark, or none — the icon provides the color pop |

The wordmark is intentionally **lowercase** and **very bold** — friendly, approachable, provincial. No all-caps, no "BayanBox" (the "Box" is dropped, consistent with rebranding to just "Bayan").

---

## 5. Shape Language

| Element | Shape | Radius | Reasoning |
|---|---|---|---|
| Icon outline | Hexagonal (6-pointed star silhouette) | Rounded caps (4.5 px) | Soft, friendly, not rigid |
| Strands | Thick rounded strokes | 9 px width, round caps | Bold, readable at small sizes |
| Woven eye | Rounded diamond (squircle) | 12×12 px, rx 3.5 | Echoes weave diamond motif; rounded so it's not sharp |
| Wordmark | Upright sans-serif | — | DM Sans is round, warm, open |

**Rounded > angular**: the entire logo avoids sharp corners. Even the diamond eye has `rx 3.5` rounding. This aligns with the design system's `rounded-2xl` (16 px) card radius language.

---

## 6. Spacing & Clear Space

| Rule | Value |
|---|---|
| **Clear space minimum** | 1× the height of the wordmark "b" bowl (~8 px) around the entire lockup |
| **Icon-to-wordmark gap** | 12 px (horizontal lockup) |
| **Stacked lockup gap** | 8 px between icon-bottom and wordmark-top |
| **Minimum width (lockup)** | 160 px (below which → icon-only) |
| **Minimum icon size** | 24 × 24 px (favicon) |
| **Minimum icon size (app)** | 192 × 192 px (PWA install) |

---

## 7. Inline SVG — Primary Mark (favicon-ready)

The primary mark is a **64×64 viewBox** SVG using only two brand colors (`#673de6` purple, `#12111d` ink) plus the amber eye accent. This is safe for light-transparent backgrounds (white pages, documents).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Bayan">
  <!-- Habi Knot — three interwoven community strands -->
  <path d="M32 5 L32 59" stroke="#12111d" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M8.5 18.5 L55.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M55.5 18.5 L8.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
  <!-- Woven hub eye (suki node / town center) -->
  <rect x="32" y="32" width="12" height="12" rx="3.5" transform="rotate(45 32 32)" fill="#f59e0b" stroke="#12111d" stroke-width="1.5"/>
</svg>
```

### Rendering on different backgrounds

| Background | How it reads | Contrast |
|---|---|---|
| **Light (white, ink-100)** | Purple diagonal strands + ink vertical strand + amber eye. Strands are vivid against white. The amber eye pops. | Purple on white: 6.3:1 ✓; Ink on white: 18:1 ✓; Amber on white: 3.5:1 (decorative, OK) |
| **Dark (ink-900, purple)** | The ink vertical strand disappears into the dark bg. → **Use the white variant** (below) or the app icon tile on dark backgrounds. | Dark variant solves this. |
| **Favicon (16–32 px)** | The six arms blur into a hexagonal knot shape; the amber eye becomes a warm dot. The weave reads as a geometric flower/knot. | High contrast: purple+ink on light bg. |
| **App icon tile (purple gradient)** | White strands + amber eye on purple. High contrast, readable. | White on purple: 6.3:1 ✓; Amber on purple: ~3.6:1 (decorative, OK) |

### White variant (for dark backgrounds, dark header, ink-900 surfaces)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Bayan">
  <path d="M32 5 L32 59" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M8.5 18.5 L55.5 45.5" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M55.5 18.5 L8.5 45.5" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
  <rect x="32" y="32" width="12" height="12" rx="3.5" transform="rotate(45 32 32)" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/>
</svg>
```

---

## 8. Inline SVG — App Icon Tile (512×512, PWA install)

The app icon tile places the Habi Knot inside a squircle-filled purple gradient, with white strands and an amber eye. This is the icon shown when users install the PWA and on the home screen.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Bayan">
  <defs>
    <linearGradient id="bayanTile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5633c4"/>
      <stop offset="100%" stop-color="#8058ee"/>
    </linearGradient>
  </defs>
  <!-- Squircle tile -->
  <rect width="512" height="512" rx="115" fill="url(#bayanTile)"/>
  <!-- Habi Knot mark, white, centered, scaled to 280 px -->
  <g transform="translate(116 116) scale(4.375)">
    <path d="M32 5 L32 59" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M8.5 18.5 L55.5 45.5" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M55.5 18.5 L8.5 45.5" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
    <rect x="32" y="32" width="12" height="12" rx="3.5" transform="rotate(45 32 32)" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/>
  </g>
  <!-- Safe-zone marker (optional, for maskable icon design): 80 % bounding box shown as a dashed guide -->
  <!-- <rect x="51" y="51" width="410" height="410" rx="60" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 8" opacity="0.15"/> -->
</svg>
```

### Maskable icon safe zone

The mark fits within the central 80 % of the tile (positions 51–461 in 512×512), meeting the W3C maskable icon standard. No critical content is in the outer 10 % crop zone.

---

## 9. Inline SVG — Horizontal Lockup (icon + wordmark)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64" role="img" aria-label="Bayan logo">
  <!-- Habi Knot mark -->
  <g transform="translate(0 0)">
    <path d="M32 5 L32 59" stroke="#12111d" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M8.5 18.5 L55.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M55.5 18.5 L8.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
    <rect x="32" y="32" width="12" height="12" rx="3.5" transform="rotate(45 32 32)" fill="#f59e0b" stroke="#12111d" stroke-width="1.5"/>
  </g>
  <!-- Wordmark: "bayan" in DM Sans 900 -->
  <text x="72" y="44" font-family="'DM Sans', system-ui, sans-serif" font-weight="900" font-size="40" letter-spacing="-1.5" fill="#12111d">bayan</text>
</svg>
```

> **Note**: The `<text>` element assumes DM Sans is loaded. For production, the wordmark should be converted to SVG paths (`<path>`) to guarantee cross-platform rendering. The spacing and sizing above are guidelines; a typographer should refine the wordmark kerning.

---

## 10. Logo Variants Summary

| File | Purpose | Format |
|---|---|---|
| `bayan-logo.svg` | Full-color mark (transparent bg) | SVG |
| `bayan-logo-white.svg` | White mark (for dark headers) | SVG |
| `bayan-icon.svg` | Mark only, full-color (favicon, app icon) | SVG |
| `bayan-icon-white.svg` | Mark only, white (dark bg) | SVG |
| `bayan-lockup.svg` | Horizontal icon + wordmark | SVG |
| `bayan-tile-512.png` | App icon tile (512×512, purple gradient) | PNG |
| `bayan-tile-192.png` | App icon tile (192×192) | PNG |
| `bayan-lockup-1200x630.png` | Social share / OG image | PNG |
| `bayan-mark-64x64.png` | dompdf-safe PNG (for referral poster) | PNG |

---

## 11. Design Rationale Summary

The Habi Knot logo is **not a box**. It is not an arrow. It is not a generic globe or map pin. It is a **woven community knot** — a visual metaphor for Bayan's mission: weaving together provincial merchants, riders, and customers through a shared phygital marketplace. The weave pattern is unmistakably Filipino (bayong, banig, habi) yet abstract enough to work as a modern app icon. The amber center — the "suki eye" — represents the trusted relationship at the heart of every transaction, and ties directly to Bayan's loyalty system (Suki Points, amber accent tokens).

> **"Hindi kahon. Habi ng bayan."**  
> — Not a box. The weave of the community.