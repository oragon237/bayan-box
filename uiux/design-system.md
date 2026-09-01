# Bayan — UI/UX Design System Specification

> **Product**: Bayan — Provincial Last-Mile Logistics & Local E-Commerce PWA
> **Reference**: `bayanbox-prd-v3.md` §9 Design System; RULES-PER-ACCOUNT.md (role matrix)
> **Audience**: frontend engineers, designers, QA. All tokens below are consumed through Tailwind utility classes in `frontend/src`.
> **Version**: 1.0 · Status: As-built aligned (v3)

---

## 0. Guiding Principles

1. **Local-first, phygital**: surfaces must feel like a neighborhood *sari-sari* + a modern courier app — friendly, warm, trustworthy.
2. **One purple, one charcoal, one amber**: the entire UI is built from the `bayan-*` (brand purple), `ink-*` (deep charcoal neutrals), and `amber-*` (accent / earning / points) scales. No ad-hoc colors.
3. **Mobile-first PWA**: every screen is designed for a ~360 px viewport first, with bottom navigation, 44 px touch targets, and graceful offline behavior.
4. **Hierarchy through weight, not size-only**: DM Sans weights (700/800/900) carry emphasis; tiny `text-[9px]` type is avoided (see A11y §8).
5. **Progressive disclosure**: role determines landing page + tab set (RULES-PER-ACCOUNT §0). Keep the 5–7 bottom tabs stable; never show actions the role cannot take.

---

## 1. Color Tokens

Core brand purple: **`#673de6`** (`bayan-600`). Deep charcoal neutrals `ink-*`. Amber `amber-*` reserved for accent: loyalty, earnings, promos, and "Sponsored" ad badges.

### 1.1 Brand palette — `bayan-*`

| Token | Hex | Usage |
|---|---|---|
| `bayan-50` | `#f0ecfe` | Badge/card tint backgrounds, soft category chips |
| `bayan-100` | `#e0d8fd` | Soft image placeholder gradients, hover tints |
| `bayan-500` | `#8058ee` | Hero gradient endpoint (`to-bayan-500`) |
| `bayan-600` | **`#673de6`** | **Primary brand**: primary buttons, active nav, links, badges. White on `bayan-600` ≈ **6.3:1** (AA ✓) |
| `bayan-700` | `#5633c4` | Hover state for primary actions; hero gradient start (`from-bayan-700`) |

### 1.2 Neutral palette — `ink-*` (deep charcoal)

| Token | Hex | Usage |
|---|---|---|
| `ink-100` | `#f1f5f9` | App background, page tint |
| `ink-200` | `#e2e8f0` | Dividers, skeletons, disabled fills |
| `ink-300` | `#cbd5e1` | Borders (lighter), placeholder icons |
| `ink-400` | `#94a3b8` | **Meta/disabled only** — do NOT use for body copy (≈2.6:1 on white, fails AA) |
| `ink-500` | `#64748b` | Section labels, secondary meta text (AA ✓) |
| `ink-600` | `#475569` | Secondary body text, inactive bottom-nav text |
| `ink-700` | `#334155` | Body text, "Load more" buttons (AA ✓ ~10:1) |
| `ink-800` | `#1e293b` | Headings, product names, prices |
| `ink-900` | `#0f172a` | Dark surfaces: sticky header, dark sections |

### 1.3 Accent — `amber-*`

| Token | Hex | Usage |
|---|---|---|
| `amber-400` | `#fbbf24` | Demo badge bg (with `amber-950` text), star ratings, "Sponsored" badge bg |
| `amber-500` | `#f59e0b` | "Sponsored" badge, Points/earning CTAs (`hover:amber-600`) |
| `amber-600` | `#d97706` | Hover for amber CTAs |
| `amber-950` | `#451a03` | Text on amber-400 badges (high contrast ✓) |

### 1.4 Semantic / status tokens (maps to Tailwind defaults)

| Token | Hex | Usage |
|---|---|---|
| `red-500` | `#ef4444` | `SALE` / out-of-range warnings / destructive. White on red-500 ≈ 3.8:1 → use `red-600` for text-heavy warnings |
| `green-400` | `#4ade80` | "Online" pulse dot, success |
| `orange-600` | `#ea580c` | "Share & earn X%" affiliate hint (link-like, ≥ 12px) |
| `white/75–85` | — | Secondary text on dark surfaces (header, hero) |

**Functional mapping**
- Primary action / active tab → `bayan-600`
- Success / online / money in → `green-*`
- Earning / points / promo / sponsored → `amber-*`
- Danger / sale / out-of-range → `red-*`
- Neutral text → `ink-600`/`ink-700`/`ink-800`

---

## 2. Typography Scale

Font family: **DM Sans** (fallback `system-ui`). Weights used: `500` (body), `700` (bold), `800` (extrabold), `900` (black). We use a compact type ramp — on a small provincial screen, size hierarchy + weight carry meaning.

| Token | Class | Size / Weight | Usage |
|---|---|---|---|
| `display` | `text-2xl font-black tracking-tight` | 24 px / 900 | Page hero headings ("Local Marketplace") |
| `title` | `text-lg font-black` | 18 px / 900 | Screen titles, featured names, sale price |
| `heading` | `text-sm font-bold` | 14 px / 700 | Card titles, product names, section headers |
| `body` | `text-sm text-ink-700` | 14 px / 500 | Descriptions, body copy |
| `label` | `text-xs font-bold` | 12 px / 700 | Field labels, buttons, chips |
| `meta` | `text-[11px] font-semibold text-ink-500` | 11 px / 600 | Meta, badges — **minimum practical size** |
| `micro-badge` | `text-[11px] font-bold` | 11 px / 700 | Badges (category, official, sponsored) — do NOT go below 10 px |
| `stat` | `text-lg font-black` | 18 px / 900 | KPI numbers, prices (`font-variant-numeric: tabular-nums`) |
| `price` | `text-lg font-black text-ink-900` | 18 px / 900 | Product price; `line-through` for original |

**Number rule**: all `₱` amounts use `toLocaleString()` grouping; prices always render `₱1,250` (never `₱ 1250`). Use `tabular-nums` in tables/KPIs so columns align.

**Do / don't**
- DO use `font-black` for money and hero statements.
- DO NOT use `text-[9px]` / `text-[10px]` for anything a user must *read* (see §8).

---

## 3. Spacing Scale

Standard Tailwind scale; the UI stays in the `2 → 4 → 5` range for density comfort.

| Token | Class | Value | Usage |
|---|---|---|---|
| `space-1` | `gap-1` / `p-1` | 4 px | Icon/label gaps in badges |
| `space-2` | `gap-2` / `px-2 py-2` | 8 px | Chip padding, inline gaps |
| `space-3` | `gap-3` / `p-3` | 12 px | Card padding (product card) |
| `space-4` | `px-4` / `pt-4` | 16 px | Page horizontal gutter, section gaps |
| `space-5` | `space-y-5` / `p-5` | 20 px | Section rhythm on Marketplace, hero padding |
| `space-6` | `p-6` | 24 px | Empty-state / error card padding |
| `card-gap` | `gap-4` | 16 px | Product grid gutters |

**Page gutters**: content `px-4` inside `max-w-5xl mx-auto` (`main` in Shell). Cards `rounded-2xl`; hero `rounded-3xl`.

---

## 4. Border Radius

| Token | Class | Value | Usage |
|---|---|---|---|
| `radius-sm` | `rounded-lg` | 8 px | Image crops inside cards, small buttons |
| `radius-md` | `rounded-xl` | 12 px | Buttons, inputs (`field`), chips, small CTAs |
| `radius-lg` | `rounded-2xl` | 16 px | **Default card radius** (product cards, sections, cart cards) |
| `radius-xl` | `rounded-3xl` | 24 px | Hero, banner, feature panels |
| `radius-full` | `rounded-full` | 9999 px | Badges, avatars, dots, online pill |

Rule: interactive touch chips and primary buttons use `rounded-xl`; static cards `rounded-2xl`; flagship surfaces `rounded-3xl`.

---

## 5. Shadows & Elevation

| Token | Class | Usage |
|---|---|---|
| `shadow-lift` | default `shadow-lift` (soft colored lift) | Product cards, banners, primary surfaces |
| `shadow-lift-dark` | default `shadow-lift-dark` | Sticky header over page content |
| `shadow-nav` | `shadow-[0_-4px_16px_rgba(15,23,42,0.06)]` | Bottom tab bar floating edge |
| `shadow-soft` | `shadow-sm` | Inputs, secondary surfaces |

No hard offset shadows on mobile; use soft, low-opacity purple/charcoal lifts.

---

## 6. Component Inventory (with Tailwind examples)

### 6.1 Sticky header / navbar (role-aware)
- Dark charcoal surface `bg-ink-900 text-white`, `sticky top-0 z-40 shadow-lift-dark`.
- Left: logo mark (alt "Bayan"). Right (signed in): name (hidden below `sm`), role chip, bell w/ unread badge, connectivity pill, logout.
- Guest state: single `Login / Signup` primary button → `/login`.

```jsx
<header className="sticky top-0 z-40 bg-ink-900 text-white shadow-lift-dark">
  <span className="px-2 py-0.5 rounded-full bg-bayan-600 text-white text-[11px] font-bold uppercase tracking-wide">{user.role}</span>
  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-white/15">
    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" /> Online
  </span>
</header>
```
- Rule: exactly one primary action per header context; bell and logout are icon buttons ≥ 40 px tap area.

### 6.2 Bottom tab bar (per-role navigation)
- Fixed `bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]`.
- `grid-cols-6` (or `grid-cols-7` when > 6 tabs); each tab = icon `w-5 h-5` + 10–11 px label, active → `text-bayan-600`, icon `scale-110`.
- Role tab sets from `Shell.jsx tabsFor(role)` (RULES-PER-ACCOUNT §0). Cart tab carries a count badge (`min-w-[16px] h-4 rounded-full bg-bayan-600 text-white text-[9px]`).
- Recommended active treatment: pill indicator behind icon + `aria-current="page"`; add `pb-[env(safe-area-inset-bottom)]`.

```jsx
<NavLink className={({isActive}) =>
  `relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
    isActive ? 'text-bayan-600' : 'text-ink-600 hover:text-ink-800'}`}>
```

### 6.3 Hero panel (homepage)
- `rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift`, optional glow-orb deco.
- Headline `text-2xl font-black tracking-tight`, subcopy `text-white/75 text-sm`.
- CTA row: amber Points CTA (`bg-amber-500/90 hover:bg-amber-600 text-white rounded-xl border border-amber-400`) + glass secondary (`bg-white/15 hover:bg-white/25 backdrop-blur border-white/20`).

### 6.4 Banner carousel
- `relative rounded-2xl overflow-hidden`, image `h-36 sm:h-48 object-cover`, caption overlay.
- Dots: `w-2.5 h-2.5 rounded-full` centered at bottom — **minimum 10 px dots are decorative only; add a larger invisible hit area or prev/next arrows (44 px)**.

### 6.5 Product card (storefront grid)
Anatomy (Marketplace.jsx):
```
┌──────────────────────────┐
│ [image  h-28 rounded-xl ]│
│ badge  badge  badge       │  ← category, Bayan Official, Sponsored
│ Product name (2 lines)    │
│ ★★★★☆ (12)               │
│ description (2 lines)     │
│ ──────────────────────────│
│ ₱old  ₱sale  [SALE]  Stock│
│ 🪙 Earn +10 Suki          │
│ 🔗 Share & earn 5%        │
│ [Add to Cart  (primary)  ]│
└──────────────────────────┘
```
```jsx
<div className="card p-3 flex flex-col justify-between">
  <span className="inline-block bg-bayan-50 text-bayan-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Category</span>
  <span className="inline-block bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">Sponsored</span>
  <h3 className="font-bold text-ink-800 text-sm leading-snug">Name</h3>
  <button className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl">
    Add to Cart
  </button>
</div>
```

### 6.6 Badges & chips
| Badge | Class | Meaning |
|---|---|---|
| Category | `bg-bayan-50 text-bayan-700` | Product taxonomy |
| Bayan Official | `bg-bayan-600 text-white` | Admin-owned mall product |
| Sponsored | `bg-amber-500 text-white` | Paid ad campaign |
| SALE / -X% OFF | `bg-red-500 text-white` | Discounted (`sale_price`) |
| Role chip | `bg-bayan-600 text-white` | Header role indicator |
| Online/Offline | `bg-white/15` or `bg-amber-500/90 text-amber-950` | PWA connectivity |
| Demo | `bg-amber-400 text-amber-950` | Seed/demo account |

Filter chips (category): `chip border shrink-0`, active `bg-bayan-600 text-white border-bayan-600`, idle `bg-white text-ink-600 border-ink-200`.

### 6.7 Buttons
| Variant | Class | Use |
|---|---|---|
| Primary | `bg-bayan-600 hover:bg-bayan-700 text-white font-bold rounded-xl transition` | Add to cart, place order, submit |
| Amber | `bg-amber-500/90 hover:bg-amber-600 text-white` | Points/economy CTAs |
| Glass (dark bg) | `bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20` | Hero secondary |
| Ghost/neutral | `bg-ink-100 hover:bg-ink-200 text-ink-700` | "Load More", tertiary |
| Icon | `w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20` | Logout, call, navigate |
| Disabled | `disabled:bg-ink-200 disabled:text-ink-400` | Out-of-stock — must read as inactive |

Min height: `py-2` + `text-xs` ≈ 34 px for compact; primary CTA `py-2.5` ≈ 40 px+. Full-width for single-action CTAs.

### 6.8 Forms (`field` pattern)
- Inputs/selects: `field` class → `bg-white rounded-2xl border border-ink-200 px-3 py-2 text-sm`, focus ring `focus:ring-2 ring-bayan-600/40 border-bayan-600`.
- Checkbox: `w-4 h-4 text-bayan-600 rounded border-ink-300` ("On Sale" filter).
- Labels: `text-xs font-bold text-ink-700`; helper `text-[11px] text-ink-500`.
- Errors: `text-red-600 text-xs` inline, plus `aria-invalid`.
- **Coordinate inputs** (profile/cart): paired lat/lng fields with a GPS button (`📍`) and map click-to-pick; show warning when hub defaults are used.

### 6.9 Empty states (shared pattern)
```jsx
<EmptyState icon="🛍️" title="No products" hint="Try adjusting your filters." />
```
Anatomy: centered icon (48 px), `title` (`text-sm font-bold text-ink-700`), `hint` (`text-sm text-ink-500`), optional primary action button + retry. Use on: marketplace no-results, cart empty, rider deliveries, merchant orders, staff dispatch, admin finance cash-outs.

### 6.10 Skeletons & loading
- Card skeleton: `h-52 bg-ink-200 rounded-2xl animate-pulse-soft`.
- Spinner: `w-7 h-7 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin`.
- Infinite scroll tail: spinner while loading, "You've reached the end" when `hasMore === false`.

### 6.11 Connectivity / offline (PWA)
- Header pill: green pulse `Online` / amber `Offline` + queue count badge (queued mutations).
- Offline behaviors: IndexedDB queue (`offlineQueue.js`, 1,000-entry cap), flush on reconnect to `/api/sync/offline-queue`; page-level offline banners with cached fallback copy; read screens show last-cached data + "You're offline — showing saved data".

### 6.12 Toasts
`useToast()` — brief, non-blocking; success (add to cart), info (login prompt), error (sync failure). Show a *pending* state for offline-queued actions instead of silent success.

---

## 7. Role-Screen Matrix (what each role sees)

Per RULES-PER-ACCOUNT: landing page = `/` → role dashboard. Tab sets (Shell.jsx) summarized:

| Role | Landing | Bottom tabs (primary) | Must-show surfaces |
|---|---|---|---|
| Customer | Marketplace Home | Shop, Cart, Affiliate, Orders, Points, Bookings, Profile | storefront, cart+checkout, tracking, points shop |
| Merchant | Merchant Dashboard | Dashboard, Affiliate, Cart, Ads, Orders, Profile | products, fulfillment, analytics, wallet, payout |
| Rider | Rider Dashboard | Dashboard, Route, Deliveries, Wallet, Affiliate, Profile | delivery map (🏪→🏠), earnings, COD |
| Staff | Staff Dashboard | Dashboard, Scan, Inventory, Dispatch, Mall, Finance | ops console, remittance |
| Admin | Admin Dashboard | Dashboard, Merchants, Riders, Settings, Ads, Finance | verification, finance overview |
| Provider | Marketplace Home | Shop, Profile, Jobs, Affiliate, Delivery | jobs, bookings |

Guardrail: never render an action a role cannot perform (e.g., staff never sees personal affiliate UI — backend 403; pending merchants never see product CRUD).

---

## 8. Accessibility & Mobile-First PWA Rules

### 8.1 Touch targets (must)
- **All interactive controls ≥ 44 × 44 px** effective hit area. Icon buttons: `w-9 h-9` (36 px) are **too small** — add invisible padding or `min-w-11 min-h-11`. Carousel dots, sort selects, and header icon buttons need larger hit areas.
- Bottom nav items: target `min-h-14` (56 px) + `pb-[env(safe-area-inset-bottom)]` for iOS home indicator.
- Minimum gap between adjacent targets ≥ 8 px.

### 8.2 Contrast (WCAG 2.1 AA)
- Body text on white: ≥ `ink-600` (`#475569`, 7.6:1). Never `ink-400` (`#94a3b8`, 2.6:1) for readable copy — reserve for disabled/decorative.
- White on `bayan-600` = 6.3:1 ✓ (buttons, role chip, active tab).
- White on `red-500` = 3.8:1 → for SALE badges keep 9–11 px bold only, or use `red-600` (`#dc2626`, ≈4.8:1) for warning text.
- White on `amber-500` = 2.9:1 → use `amber-600` text or keep badge minimal; prefer `amber-950` on `amber-400` (✓).
- Text on dark `ink-900` must be `white/80+`.

### 8.3 Typography
- No body copy below 12 px. Badges: min 11 px bold. Prices/statistics: 18 px min.
- `line-clamp-2` for card descriptions (do not overflow).
- Use `tabular-nums` for money/KPIs.

### 8.4 Keyboard & semantics
- Real `<button>`/`<a>` semantics; **no nested interactive elements** (a card should be one link/button, not button-inside-button).
- Active bottom tab: `aria-current="page"`; category chips: `aria-pressed` or role="tablist".
- Images: meaningful `alt` (product names); decorative → `alt=""`.
- Visible focus ring on inputs/buttons (`focus-visible:ring-2 ring-bayan-600`).
- Map "Navigate"/"Call" links: descriptive labels, open external maps.

### 8.5 Mobile-first layout
- Base layout targets 360–414 px; grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- `max-w-5xl mx-auto` page container; sticky header + fixed bottom nav; content bottom padding `pb-28` so nothing is hidden behind the nav.
- Horizontal scroll rows (`overflow-x-auto`) for featured/ad carousels and category chips — ensure scroll affordance (fade edge or "swipe" hint).

### 8.6 Offline / PWA rules
- **Writes**: enqueue to IndexedDB queue, show "pending" toast + header queue badge, flush on reconnect. Never claim success silently.
- **Reads**: cache latest list/detail; on failure show offline banner + cached content, not a dead error.
- Connectivity pill is the single source of truth (Shell `online` + `queueCount`).
- Service worker precache via `vite-plugin-pwa`; keep `display: fullscreen` behavior.
- Errors distinguish: offline ("Check your connection"), session expired (401 → re-login), and business errors (422 → friendly message, e.g., out-of-range delivery).

---

## 9. Do / Don't Quick Reference

| ✅ Do | ❌ Don't |
|---|---|
| `bayan-600` for primary actions & active states | Introduce a second brand purple or random hex |
| `ink-600/700/800` for readable text | `text-ink-400` for descriptions/stock/reviews |
| 44 px touch targets, safe-area padding | 36 px icon-only buttons, 10 px carousel dots |
| Shared `EmptyState` with retry/CTA everywhere | Per-page ad-hoc "No X" paragraphs |
| Optimistic writes visible as "pending" when offline | `.catch(() => {})` then toast "Added to cart" |
| One semantic card (single link) | Nested `<button>` inside `<button>` |
| `₱1,250` tabular money formatting | `₱ 1250` or `P1250` inconsistency |

---

## 10. Files that implement these tokens today

| File | Implements |
|---|---|
| `frontend/src/components/Shell.jsx` | Header, role chip, connectivity pill, bottom nav, cart badge |
| `frontend/src/pages/marketplace/Marketplace.jsx` | Hero, banner carousel, featured row, filters, product grid, badges, empty state |
| `frontend/src/components/ui.jsx` | `EmptyState`, `useToast`, `field` styles (shared primitives) |
| `frontend/src/components/icons.jsx` | Icon set (Home, Route, Wallet, etc.) |
| `frontend/tailwind.config.*` | Token registration (`bayan-*`, `ink-*`, shadows, DM Sans) |

*Design-system drift should be tracked against `uiux/ui-audit.md`.*
