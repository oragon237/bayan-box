# Bayan — Logo UI/UX Review Brief (Framework, pending logo concept)

> **Status**: ⚠️ **FRAMEWORK ONLY — concept critique PENDING.** The Logo & Graphic Designer agent is still producing `../logo/logo-concept.md`, `../logo/brand-guidelines.md`, `../logo/logo-integration.md`. This brief defines **what the UI/UX review will evaluate**, the **exact placement/sizing specs**, and a **fill-in checklist**. When the concept lands, the reviewer applies §2's checklist and records verdicts in §5.
> **Brand constraints**: no "Box" concept; Filipino motifs (bayong / jeepney / kalabaw); purple `#673de6` (bayan-600) + ink `#12111d`; DM Sans typography (PRD §9, `uiux/design-system.md`).

---

## 1. UI/UX Acceptance Criteria (what the logo must satisfy)

### 1.1 Design-system token fit
- Primary color must be **`#673de6` (bayan-600)** or a token-compatible purple; the secondary **`#12111d` (ink)** must read as deep charcoal, not pure black.
- The logo must render on all existing surfaces: white cards, `bg-ink-900` header (Shell), the `bayan-700→bayan-500` gradient hero, and the Auth.jsx gradient (`bayan-800→bayan-500`).
- **Dark-variant requirement**: a light/white mono mark for `ink-900` and gradient surfaces; a full-color mark for white/light surfaces. Both must be delivered in the brand package.
- Filipino motif must be **abstracted** (simplified bayong weave / jeepney silhouette / kalabaw horn line) — it must read as a *trustworthy logistics brand*, not a toy or souvenir.

### 1.2 Legibility at 44 px (app icon / favicon threshold)
- The mark must stay **recognizable at 44 px**, and a **simplified mono glyph must survive at 16–32 px** (favicon / PWA manifest icon).
- Rule: **no strokes thinner than ~2 px at 44 px**, no more than ~3 visual elements at favicon scale; if the full mark is too complex, ship a **reduced glyph** (single silhouette) for small sizes.
- Test: render at `16, 32, 44, 64, 192, 512 px`; the 16 px version must not become a purple blob.

### 1.3 Contrast (WCAG 2.1 AA)
- White mark on `bayan-600` → ≥ 4.5:1 (white on `#673de6` ≈ 6.3:1 ✓ per design-system).
- White mark on `ink-900` (`#0f172a`) → ≥ 4.5:1 (white on ink-900 ≈ 15:1 ✓).
- Purple mark on white → ≥ 4.5:1 for any text; **≥ 3:1 for large/logo text** (WCAG 1.4.3 exception for logotypes) — still aim for 4.5:1.
- Dark-variant mark on gradient hero → verify against `bayan-700` (`#5633c4`) and `bayan-500` (`#8058ee`) midpoints.

### 1.4 DM Sans pairing (wordmark)
- If the logo includes a wordmark, its letterforms must harmonize with **DM Sans 800/900** (geometric, slightly rounded terminals).
- Preferred: ship the wordmark **in DM Sans 800/900** (or a tight-tracking text lockup set in DM Sans) rather than a custom-drawn script, so the header next to the mark matches existing UI type.
- Vertical rhythm: the mark + wordmark lockup must sit cleanly on the `h-8` (32 px) and `h-14` (56 px) lines with balanced optical alignment (no baseline jump).

### 1.5 Scale & clear space
- Minimum clear space = **height of the mark ÷ 2** on all sides (documented in brand guidelines).
- The lockup must not exceed **120 px wide** at header scale (see §3) and must not crowd the bell/name/role cluster in Shell.jsx.
- A **negative-space / reversed** version is required for badges (e.g., the `bg-bayan-600` role chip, cart badge).

### 1.6 Rebrand integrity
- **No "Box"**, no box/cube, no 🧊 ice concept, no legacy `beboolbox`/`BayanBox` strings anywhere in deliverables.
- Logo file naming must be deployable: `/bayan-logo.svg` (primary), `/bayan-logo-mono-light.svg`, `/bayan-mark-512.png` (app icon), `/favicon.svg` + 32 px PNG.

---

## 2. Review Checklist (fill in when `../logo/logo-concept.md` exists)

For each item mark ✅ / ⚠️ / ❌ with a one-line note:

- [ ] **Token colors**: mark uses `#673de6` + `#12111d` (or token-compatible); no off-palette hues
- [ ] **44 px test**: mark recognizable at 44 px; no strokes < 2 px
- [ ] **16/32 px favicon**: simplified glyph survives; not a blob
- [ ] **Contrast**: white-on-bayan-600 ≥ 4.5:1; white-on-ink-900 ≥ 4.5:1; purple-on-white ≥ 4.5:1 (or ≥ 3:1 large-text with note)
- [ ] **Dark variant**: light mono mark provided for `ink-900` header + gradient hero
- [ ] **DM Sans pairing**: wordmark is DM Sans 800/900 or harmonizes; baseline aligns on h-8/h-14
- [ ] **Clear space**: documented ≥ mark-height/2; lockup ≤ 120 px wide at header scale
- [ ] **Filipino motif**: abstracted, brand-appropriate (bayong/jeepney/kalabaw), not toy-like
- [ ] **No "Box" / no legacy**: zero `Box`/`beboolbox`/🧊 references
- [ ] **File set**: `/bayan-logo.svg`, mono-light, 512 app icon, favicon 16+32 delivered
- [ ] **Alt text ready**: `alt="Bayan"` works for every placement (decorative variants → `alt=""`)

---

## 3. Exact Placement & Sizing Specs (real files)

### 3.1 Shell.jsx — sticky header (h-8)

**File**: `frontend/src/components/Shell.jsx` lines 107–111 (current: `<img src="/beboolbox-logo.png" alt="Bayan" className="h-8 w-auto object-contain" />`)

**Spec for the new logo**:
```jsx
<img src="/bayan-logo-mono-light.svg" alt="Bayan" className="h-8 w-auto object-contain" />
```
- **Size**: `h-8` = **32 px height**, width auto (cap lockup at 120 px total).
- **Variant**: mono-light (white/ink-900-friendly) — the header is `bg-ink-900 text-white`.
- **Neighbors**: sits inside a `flex items-center gap-2` row; keep ≥ 8 px gap before any other header element (name/role/bell/logout cluster is at the right edge).
- **Clear space**: the header already has `px-4` gutter; the mark needs its own `h-8` vertical padding respected by the container (`pt-4 pb-3` header padding is fine as-is).
- **Dark-variant check**: verify at 32 px on `#0f172a` — white ≥ 15:1 ✓ (no adjustment expected).

### 3.2 Auth.jsx — login/register screen (h-14)

**File**: `frontend/src/pages/Auth.jsx` lines 46–52 (current: `<img src="/beboolbox-logo.png" alt="Bayan" className="h-14 w-auto mx-auto object-contain" />` + legacy tagline `BodegaBarangay · Provincial Last-Mile OS`)

**Spec for the new logo**:
```jsx
<img src="/bayan-logo-mono-light.svg" alt="Bayan" className="h-14 w-auto mx-auto object-contain" />
```
- **Size**: `h-14` = **56 px height**, `mx-auto` centered, width auto.
- **Variant**: mono-light — the Auth page background is `bg-gradient-to-br from-bayan-800 via-bayan-700 to-bayan-500` (dark purple gradient).
- **Tagline**: the `BodegaBarangay · Provincial Last-Mile OS` subcopy (line 51) is **legacy/rebrand-required** — replace with the current tagline owned by Marketing ("Your neighbor barangay's store, at your door."), or remove. Flag to Marketing agent.
- **Clear space**: `mb-8` under the brand block already provides ≥ 56/2 = 28 px below the mark; keep.

### 3.3 Secondary placements (reference)
| Surface | File | Current | Spec |
|---|---|---|---|
| HomepageV2 footer | `frontend/src/pages/marketplace/HomepageV2.jsx` ~line 291 | `h-8 w-8 rounded-xl bg-bayan-600 text-white` emoji tile | swap tile for `bayan-logo.svg` at 32 px (or keep mark in white on bayan-600 tile) |
| PWA manifest / favicon | `frontend/index.html`, `vite.config.*` (`vite-plugin-pwa`) | legacy | `bayan-mark-512.png` + `/favicon.svg` (16+32) |
| Loading splash | `frontend/src/App.jsx` "Loading Bayan…" | text only | optional mono mark above text |

---

## 4. What the reviewer needs from the Logo agent

When `../logo/logo-concept.md` + `brand-guidelines.md` + `logo-integration.md` land, the reviewer requires at minimum:
1. Primary + mono-light + mono-dark mark files (SVG) and 512/192/64/44/32/16 px raster exports.
2. Color values declared (must map to `#673de6` / `#12111d` tokens).
3. Clear-space + minimum-size documentation.
4. Wordmark font declaration (must pair with DM Sans).
5. Any usage prohibitions (e.g., don't rotate, don't recolor).

---

## 5. Pending Verdict Table (to be completed post-concept)

| Criterion | Verdict | Notes |
|---|---|---|
| Token fit (§1.1) | ⏳ pending | — |
| 44 px legibility (§1.2) | ⏳ pending | — |
| Contrast (§1.3) | ⏳ pending | — |
| DM Sans pairing (§1.4) | ⏳ pending | — |
| Scale/clear space (§1.5) | ⏳ pending | — |
| Rebrand integrity (§1.6) | ⏳ pending | — |
| Shell h-8 placement (§3.1) | ⏳ pending | — |
| Auth h-14 placement (§3.2) | ⏳ pending | — |
| **Overall approval** | ⏳ pending | Reviewer name + date |

---

## 6. Immediate action items (do now, independent of the concept)

1. **Rebrand sweep**: replace `/beboolbox-logo.png` references in `Shell.jsx` (line 108) and `Auth.jsx` (line 47) with the new `/bayan-logo.*` once assets exist (audit Issue 13 in `uiux/ui-audit.md`).
2. **Tagline**: coordinate with Marketing to replace `BodegaBarangay · Provincial Last-Mile OS` in Auth.jsx (line 51).
3. **Re-check** this brief against `../logo/logo-concept.md` the moment it appears; fill §5 and report verdicts.
