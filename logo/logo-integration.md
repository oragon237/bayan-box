# Bayan — Logo-to-App Integration Plan

> **Goal**: Replace every legacy brand asset with the new **Habi Knot** logo system and clean up remaining pre-rebrand strings ("beboolbox", "BodegaBarangay", "BayanBox", legacy green `#16a34a`).
> **Primary doc**: `logo-concept.md` (SVG assets) · `brand-guidelines.md` (usage rules)
> **Verified against**: `frontend/src/components/Shell.jsx`, `frontend/src/pages/Auth.jsx`, `frontend/vite.config.js`, `frontend/index.html`, `frontend/public/manifest.webmanifest`, `frontend/public/favicon.svg`, `backend/resources/views/pdf/referral-poster.blade.php`
> **Tracking**: resolves `uiux/ui-audit.md` **Issue 13** (legacy beboolbox asset leaks).

---

## 0. Asset Inventory (drop these in `frontend/public/` first)

| New file | Replaces / purpose |
|---|---|
| `bayan-icon.svg` | `favicon.svg` (Habi Knot mark, transparent, purple+ink+amber) |
| `bayan-icon-white.svg` | header/dark surfaces mark |
| `bayan-logo.svg` | `beboolbox-logo.png` / `beboolbox-logo-1.png` (full-color mark) |
| `bayan-logo-white.svg` | white lockup for dark header & purple Auth screen |
| `bayan-tile-512.png`, `bayan-tile-192.png` | PWA install icons (purple gradient tile) |
| `bayan-mark-64x64.png` | dompdf-safe PNG for the referral poster |
| `bayan-share-1200x630.png` | social / Open Graph image |

**Delete after swap**: `frontend/public/beboolbox-logo.png`, `frontend/public/beboolbox-logo-1.png`.

---

## Phase 1 — Core UI swap (highest priority)

### 1.1 `frontend/src/components/Shell.jsx` — sticky header (dark `ink-900`)

Current (line 107–111):

```jsx
<div className="flex items-center gap-2">
  <img
    src="/beboolbox-logo.png"
    alt="Bayan"
    className="h-8 w-auto object-contain"
  />
</div>
```

Replace with the **white mark** (header is `bg-ink-900` — a purple/ink full-color mark would vanish into the dark header):

```jsx
<div className="flex items-center gap-2">
  <img src="/bayan-icon-white.svg" alt="Bayan" className="h-8 w-8 object-contain" />
</div>
```

- `h-8` (32 px) is fine for the mark-only variant. Do **not** use the wordmark lockup here — "bayan" would be unreadable at 32 px.
- ⚠️ **UI/UX to confirm**: final header size (h-8 vs h-9) and whether the mark should sit inside a `rounded-lg` tile for extra contrast on `ink-900`.

### 1.2 `frontend/src/pages/Auth.jsx` — login/signup screen (purple gradient)

Current (line 45–52):

```jsx
<div className="text-center mb-8">
  <img
    src="/beboolbox-logo.png"
    alt="Bayan"
    className="h-14 w-auto mx-auto object-contain"
  />
  <p className={`text-white/70 text-sm mt-3 ${mode === 'register' ? 'hidden' : ''}`}>BodegaBarangay · Provincial Last-Mile OS</p>
</div>
```

Replace with the **white lockup** (background is `from-bayan-800 via-bayan-700 to-bayan-500` — white mark pops on purple):

```jsx
<div className="text-center mb-8">
  <img
    src="/bayan-logo-white.svg"
    alt="Bayan"
    className="h-14 w-auto mx-auto object-contain"
  />
  <p className={`text-white/75 text-sm mt-3 ${mode === 'register' ? 'hidden' : ''}`}>Bayan · Provincial Last-Mile Logistics &amp; Local E-Commerce</p>
</div>
```

- The tagline "BodegaBarangay · Provincial Last-Mile OS" is a **legacy brand name** — must be replaced (see §5 sweep).
- ⚠️ **UI/UX to confirm**: lockup height on the 360 px viewport and tagline copy (the final tagline is a brand/content decision).

---

## Phase 2 — PWA identity (favicon, manifest, install icons)

### 2.1 `frontend/public/favicon.svg` — replace wholesale

The current file is the **legacy green mark** (`#16a34a` square + white "B" + amber circle). Replace its contents with the Habi Knot primary mark:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Bayan">
  <path d="M32 5 L32 59" stroke="#12111d" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M8.5 18.5 L55.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M55.5 18.5 L8.5 45.5" stroke="#673de6" stroke-width="9" stroke-linecap="round" fill="none"/>
  <rect x="32" y="32" width="12" height="12" rx="3.5" transform="rotate(45 32 32)" fill="#f59e0b" stroke="#12111d" stroke-width="1.5"/>
</svg>
```

`index.html` already links `/favicon.svg` and `vite.config.js` precaches it (`includeAssets: ['favicon.svg']`) — no reference changes needed, only file content.

### 2.2 `frontend/public/manifest.webmanifest` — stale green theme + missing PNG icons

Current file is out of sync (still `theme_color: "#16a34a"`). Update to:

```json
{
  "name": "Bayan",
  "short_name": "Bayan",
  "description": "Provincial Last-Mile Logistics & Local E-Commerce",
  "start_url": "/",
  "display": "fullscreen",
  "display_override": ["fullscreen", "standalone"],
  "orientation": "portrait-primary",
  "theme_color": "#673de6",
  "background_color": "#12111d",
  "icons": [
    { "src": "/bayan-tile-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/bayan-tile-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/bayan-tile-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

> **Note**: a static `public/manifest.webmanifest` AND the vite-plugin-pwa injected manifest can both exist. The **source of truth at build time is `vite.config.js`** — update it in step 2.3, and either keep this static file identical or delete it to avoid a duplicate `<link rel="manifest">`. Confirm with the frontend lead which path is live.

### 2.3 `frontend/vite.config.js` — brand strings + install icons

- Manifest `name`: `"Bayan — BodegaBarangay"` → `"Bayan"` (legacy brand name).
- Manifest `theme_color` is already `#673de6` ✓ — keep.
- Add PNG icons to the `manifest.icons` array (mirror step 2.2) so installed PWA uses a real 192/512 tile:

```js
icons: [
  { src: 'bayan-tile-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
],
```

- Optionally add the PNGs to `includeAssets` for precaching.

### 2.4 PWA splash / offline / share

- **Splash**: with `display: fullscreen` + `background_color: "#12111d"`, installs will show the `bayan-tile-512.png` on a dark ink splash. The tile's purple gradient + white mark is the official splash graphic (brand-guidelines §4.7).
- **Offline**: the offline connectivity pill and offline banners (design-system §6.11) can optionally reuse `bayan-icon.svg` as the fallback art in offline empty states — **UI/UX to confirm** if/when to swap the emoji placeholder for the mark.
- **Social / share image**: add Open Graph tags in `index.html` pointing at `bayan-share-1200x630.png`:

```html
<meta property="og:title" content="Bayan — Provincial Last-Mile Logistics" />
<meta property="og:description" content="Ang habi ng bayan. Local stores, riders, and your community in one app." />
<meta property="og:image" content="/bayan-share-1200x630.png" />
```

---

## Phase 3 — Backend / printed asset (referral poster)

### 3.1 `backend/resources/views/pdf/referral-poster.blade.php`

This file still carries the **pre-rebrand brand**:
- `.brand { color: #16a34a; }` (green) → `#673de6` (purple)
- `<div class="brand">Bayan<span>Box</span></div>` → `Bayan` only (drop "Box")
- Footer `Bayan · BodegaBarangay · Referral Code: …` → `Bayan · Referral Code: …`
- Tagline `Sari-Sari Store Parcel Hub` and the "₱2.00 … every parcel" copy are legacy **parcel-domain** copy — ⚠️ **UI/UX or content owner to confirm** current referral offer copy before changing.

**Logo in the poster**: dompdf has limited SVG support — do **not** embed the SVG. Pass the mark as a base64 PNG data URL from the controller:

```php
// in the controller rendering the poster
$logo = base64_encode(file_get_contents(storage_path('app/public/bayan-mark-64x64.png')));
// pass $logoDataUrl = 'data:image/png;base64,' . $logo to the view
```

```blade
<img src="{{ $logoDataUrl }}" alt="Bayan" style="height:64px;width:auto;">
```

Place it above `.brand` (or replace the text "Bayan" block with the image + wordmark). dompdf renders PNG reliably.

---

## Phase 4 — Brand string sweep & QA

### 4.1 Sweep remaining legacy identifiers

```bash
cd frontend && grep -rniE "beboolbox|becoolbox|bodegabarangay|bayanbox|#16a34a" src public index.html vite.config.js
cd ../backend && grep -rniE "beboolbox|becoolbox|bodegabarangay|bayanbox|#16a34a|BayanBox" routes resources config
```

Known hits today (already located):
| File | Legacy string |
|---|---|
| `frontend/src/components/Shell.jsx:108` | `/beboolbox-logo.png` |
| `frontend/src/pages/Auth.jsx:47` | `/beboolbox-logo.png` |
| `frontend/src/pages/Auth.jsx:51` | `BodegaBarangay · Provincial Last-Mile OS` |
| `frontend/vite.config.js:12` | `Bayan — BodegaBarangay` |
| `frontend/public/manifest.webmanifest:8` | `theme_color: #16a34a` |
| `frontend/public/favicon.svg` | green `#16a34a` tile |
| `backend/resources/views/pdf/referral-poster.blade.php` | `#16a34a`, `BayanBox`, `BodegaBarangay` |

### 4.2 QA checklist (acceptance criteria)

| # | Check | Pass |
|---|---|---|
| 1 | Header shows white Habi Knot on `ink-900`, 32 px, `alt="Bayan"` | ☐ |
| 2 | Auth screen shows white lockup on purple gradient; tagline has no "BodegaBarangay" | ☐ |
| 3 | Browser tab favicon = Habi Knot (hard-refresh; PWA caches may need SW update) | ☐ |
| 4 | Installed PWA icon = purple tile; splash = tile on `#12111d` | ☐ |
| 5 | Referral poster PDF: purple "Bayan", Habi Knot logo, no "Box"/green | ☐ |
| 6 | `grep -i "beboolbox\|bodegabarangay\|bayanbox\|#16a34a"` returns **0** in `frontend/src`, `frontend/public`, `vite.config.js`, and poster blade | ☐ |
| 7 | `npm run build` completes; lighthouse PWA installability still passes (has 192 & 512 icons) | ☐ |

---

## 5. Coordination with the UI/UX Agent

The logo designer hands off to UI/UX on **placement & sizing confirmation** (do not ship without these sign-offs):

| # | Decision needed | Where |
|---|---|---|
| 1 | Header mark: `h-8` vs `h-9`; icon-only vs icon-in-tile | `Shell.jsx` §1.1 |
| 2 | Auth lockup height & tagline copy (brand decision) | `Auth.jsx` §1.2 |
| 3 | Use the mark in offline empty states / toasts, or keep emoji? | design-system §6.9/§6.11 |
| 4 | `background_color` `#12111d` vs white for the splash/manifest | manifest §2.2 |
| 5 | Referral poster copy (current offer text) & poster layout with the new logo | blade §3.1 |
| 6 | Add the logo to the design-system doc as the official mark (brand-guidelines cross-link) | `uiux/design-system.md` |

**Suggested sequencing** (effort-tagged, per ui-audit roadmap style):

| Step | Effort |
|---|---|
| 1. Swap `favicon.svg` + header + Auth (Phases 1–2.1) | S |
| 2. Manifest/icons/theme + build (Phase 2.2–2.4) | S |
| 3. Referral poster (Phase 3) | M |
| 4. String sweep + QA (Phase 4) | S |

Phases 1–2 should land in the same sprint as the ui-audit P0 batch (Issues 1–3) since they touch the same files (`Shell.jsx`, `Auth.jsx`).
