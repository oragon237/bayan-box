# Bayan — UI/UX Improvement Audit

> Scope: existing React frontend vs. PRD v3 Design System (§9) + RULES-PER-ACCOUNT.md matrix.
> Files inspected: `frontend/src/components/Shell.jsx`, `frontend/src/pages/marketplace/Marketplace.jsx`, plus PRD screen references (cart/checkout, merchant dashboard, rider map, admin finance, staff dispatch).
> Severity: **P0** = blocks usability/a11y conformance · **P1** = clear UX regression · **P2** = polish & consistency · **P3** = nice-to-have.

---

## Issue 1 — [P0] Readable text is set in `text-ink-400` on white (fails WCAG AA)

**Where**: `Marketplace.jsx` — description `text-xs text-ink-400`, "Stock:" and review counts `text-[10px] text-ink-400`; `Shell.jsx` — inactive bottom-nav tabs `text-ink-400`. `#94a3b8` on white ≈ **2.6:1**, below the 4.5:1 body-text requirement (and even 3:1 large-text bar).

**Fix**: Promote text tokens —
- Descriptions / body → `text-ink-600` (or `ink-700`).
- Meta ("Stock: 48", "(12)") → `text-ink-500` at **min 11–12 px**.
- Inactive nav tabs → `text-ink-600 hover:text-ink-800` (still clearly secondary vs. active `bayan-600`).
- Reserve `ink-400` exclusively for `disabled:` states and decorative icons.

**Files**: `frontend/src/pages/marketplace/Marketplace.jsx`, `frontend/src/components/Shell.jsx`, and all pages reusing `text-ink-400` for copy.

---

## Issue 2 — [P0] Type ramp bottoms out at `text-[9px]` / `text-[10px]` badges

**Where**: `Marketplace.jsx` SALE badge `text-[9px]`, category/brand/sponsored badges `text-[10px]`, cart-count badge `text-[9px]` (`Shell.jsx`), stock/review meta `text-[10px]`. On a 360 px provincial phone this is illegible, especially for low-vision and elderly users — core Bayan audience.

**Fix**: Adopt the design-system badge scale: badges min **11 px bold** (`text-[11px]`), body meta min 12 px, KPI/prices 18 px. Cart badge may stay 10 px as a *count indicator*, but enlarge hit area.

**Files**: `Marketplace.jsx`, `Shell.jsx`, shared `ui.jsx` primitives.

---

## Issue 3 — [P0] Nested interactive elements in product cards (invalid HTML/a11y)

**Where**: `Marketplace.jsx` — each card contains a `<button>` wrapping the whole image, then a **second** `<button>` on the product name (plus the badges), i.e., `<button>` inside the card’s clickable area with no single-link semantics. Screen readers announce ambiguously and click routing can double-fire.

**Fix**: Make the card **one** semantic unit: wrap the card in a single `<a>`/navigable card (or use `onClick` + `role="link"` + keyboard handler), moving the ad `click` tracker into that one handler. Keep `Add to Cart` as a separate real button with `e.stopPropagation()`.

**Files**: `Marketplace.jsx` (both the featured carousel cards and the main grid cards), mirrored in `Search.jsx` if the same pattern exists.

---

## Issue 4 — [P1] Bottom nav: weak active state, crowded 7 columns, no safe-area padding

**Where**: `Shell.jsx` — active tab is only `text-bayan-600` + icon `scale-110`; no persistent indicator, no `aria-current="page"`. At 7 tabs (`grid-cols-7`) on a 360 px screen each tab is ~51 px wide → taps bleed into neighbors. No `env(safe-area-inset-bottom)`, so the iOS home indicator overlaps tab labels. Customer/merchant tab sets push 7 items (RULES §1/§3) → worst case.

**Fix**:
- Add an active pill/underline indicator behind the icon (e.g., `before:` rounded pill `bg-bayan-100` + `text-bayan-700` icon), `aria-current="page"`.
- Raise tab row to `min-h-14` and add `pb-[env(safe-area-inset-bottom)]`.
- Consolidate tab sets: e.g., customer merge "Bookings" under a "More" overflow or drop duplicate "Points" into a header shortcut, keeping ≤ 6 tabs.

**Files**: `frontend/src/components/Shell.jsx` (layout + `tabsFor`).

---

## Issue 5 — [P1] Add-to-cart reports success even when the sync fails (offline-unsafe)

**Where**: `Marketplace.jsx` `addToCart` — `client.post('/cart/sync', …).catch(() => {})` then immediately `notify('Added to cart.', 'success')`. On a bad network the user sees success, the header badge never updates, and the mutation is lost — contradicts the offline-first PWA promise (PRD §2.2, §4.7).

**Fix**:
- Route cart mutations through `offlineQueue.js` (IndexedDB); show a **pending** state ("Added — will sync when online") and bump `queueCount` in the header pill.
- Only toast `success` on confirmed response; toast `error` with Retry on failure.
- Refresh cart count from the queue locally so the badge is truthful offline.

**Files**: `frontend/src/pages/marketplace/Marketplace.jsx`, `frontend/src/services/offlineQueue.js`, `frontend/src/components/Shell.jsx` (badge source).

---

## Issue 6 — [P1] Out-of-range (>100 km) delivery messaging is buried / inconsistent

**Where**: PRD §4.7 + §2.3: delivery beyond `max_delivery_km` (100) must be **rejected with a clear out-of-range message** and the Place Order button **blocked** — enforced backend (422) and frontend. The cart estimate shows "a red warning instead of a fee." Risk: carts are filled before the user ever sees this; a 422 at checkout with a raw message is a dead-end with no next step.

**Fix** (audit of the cart/checkout screen flow):
- Cart delivery-estimate card: when distance > 100 km render an explicit **out-of-range banner** (red, icon): "📍 Delivery unavailable — address is outside our 100 km service area." + `[Pickup instead]` or `[Change address]` actions.
- Checkout: disable `Place Order` with helper text *and* on any backend 422 keep the friendly banner, never raw error JSON.
- Surface merchant distance early on product detail ("ships from Mang Juan Store, 3.2 km").

**Files**: `frontend/src/pages/cart/Cart.jsx`, checkout flow, `frontend/src/services/` delivery estimate (OSRM + fallback), mirror the banner component from `Marketplace.jsx` patterns.

---

## Issue 7 — [P1] Empty states are ad-hoc and inconsistent across screens

**Where**: `Marketplace.jsx` mixes a custom inline error card ("No products currently available." + Retry) *and* the shared `<EmptyState>`, with different copy, icons, and no CTA depth. Rider deliveries, merchant orders, staff dispatch queue, and admin finance cash-outs all render their own "No X" text (per PRD §4.8/§4.17/§4.21 references) — no shared component, no offline-aware copy, no next-step action.

**Fix**: Standardize on one `EmptyState` (icon + title + hint + optional CTA + retry) from `ui.jsx`:
- Rider deliveries: "No active deliveries — new jobs will appear here." + `[Pull to refresh]` + SOS shortcut.
- Staff dispatch: "Dispatch queue is clear." + auto-dispatch hint.
- Merchant orders: "No pending orders yet." + `[View Products]`.
- Admin finance: "No pending cash-outs." + wallet summary link.
- Offline variant: "You're offline — showing last saved data." + reconnect CTA.

**Files**: `frontend/src/components/ui.jsx` (EmptyState), all consumers.

---

## Issue 8 — [P1] Banner carousel controls fail the 44 px touch-target rule

**Where**: `Marketplace.jsx` — carousel "dots" are `w-2.5 h-2.5` (10 px) buttons; image is the only tap target, and there's no prev/next affordance. 10 px targets violate WCAG 2.5.5 / our §8.1.

**Fix**: Enlarge hit area (invisible padding `p-2` on dots → ≥ 44 px target), add prev/next chevrons (44 px), auto-advance that pauses on focus/hover/touch, and `aria-live` for screen readers. Dots get `aria-label="Slide i of n"`.

**Files**: `frontend/src/pages/marketplace/Marketplace.jsx`.

---

## Issue 9 — [P2] Header icon-only controls are 36 px and lack labels/aria

**Where**: `Shell.jsx` — logout is `w-9 h-9` (36 px) with only a `title="Sign out"` tooltip; the bell (`NotificationsBell`) has no visible/aria label; the demo role `<select>` is styled like a chip, easy to tap by accident and confusing for real use. Role chip text is `text-[10px]`.

**Fix**: Icon buttons → `min-w-11 min-h-11` (44 px) with `aria-label`; keep `title` as secondary. Role chip → `text-[11px]`. Gate the demo switcher behind a clear "Demo controls" affordance (dev-only flag), never shown to end users.

**Files**: `frontend/src/components/Shell.jsx`, `frontend/src/components/NotificationsBell.jsx`.

---

## Issue 10 — [P2] Product image placeholder is a purple emoji box with a remote fallback

**Where**: `Marketplace.jsx` — featured cards use `https://placehold.co/400x400/673de6/ffffff?text=📦` as image fallback (remote dependency, breaks offline, inconsistent with `card` gradient placeholder `from-bayan-100 to-ink-100` + 🛒 used in the grid).

**Fix**: Use a single local placeholder treatment (gradient `bayan-100→ink-100` + emoji glyph, as in the grid) and keep `alt` = product name. No remote placeholder in an offline-first PWA.

**Files**: `Marketplace.jsx` (and any other page referencing placehold.co).

---

## Issue 11 — [P2] Money formatting & color semantics on admin finance

**Where**: Admin/Staff finance overview (PRD §4.21, RULES §5/§6) shows "flow of money" — but `₱` formatting, thousands separators, and positive/negative semantics are applied inconsistently across wallet tables (audit the screens against the wireframe in `uiux/wireframes.md` #5).

**Fix**:
- One `formatPeso()` helper: `₱` + `toLocaleString()`, `tabular-nums`, aligned columns.
- Color rules: money-in `green-600`, money-out `ink-600`, **held/escrow** amber `⏳ held` (never shown as available), payable/outstanding with distinct chips.
- Empty remittance log → shared EmptyState; remittance rows show `recorded_by` staff audit.

**Files**: admin + staff finance pages (e.g., `frontend/src/pages/admin/*`, `frontend/src/pages/staff/*`), shared `utils` money helper.

---

## Issue 12 — [P2] Infinite-scroll list lacks end-state and offline fallback

**Where**: `Marketplace.jsx` — `hasMore === false` renders nothing (no "You've reached the end"), and the load-error path replaces the grid with a bare text card. Offline: products fail with "Could not load products. Check your connection." and zero cached fallback.

**Fix**: Render an end-of-list footer ("You're all caught up — 🏪 that's everything from local stores."). On fetch failure, keep last successful products on screen + show an offline banner (cached read), per §8.6. Distinguish 401 (→ login redirect) from offline (→ banner).

**Files**: `frontend/src/pages/marketplace/Marketplace.jsx`.

---

## Issue 13 — [P2] Legacy brand asset leaks (rebrand consistency)

**Where**: `Shell.jsx` loads `/beboolbox-logo.png` (alt "Bayan") — the pre-rebrand `becoolbox` filename persists. PRD v1 docs reference the old brand; the PWA still ships the old mark.

**Fix**: Rename/replace the asset (`bayan-logo.svg`) and update the reference; sweep `beboolbox`/`becoolbox` strings in `frontend/src` (brand consistency for the "Bayan" PWA).

**Files**: `frontend/src/components/Shell.jsx`, asset folder, `frontend/public`.

---

## Issue 14 — [P2] Filters/category chips lack interactive semantics

**Where**: `Marketplace.jsx` — category chip row and "On Sale" checkbox have no `aria-pressed`/`aria-checked` beyond native checkbox (chips are buttons), no `role="tablist"`, and the row scroll has no fade affordance.

**Fix**: Add `aria-pressed` toggling on chips, `aria-label` on the scroll row, and a right-edge fade mask to signal "swipe for more". Keep active chip `bg-bayan-600 text-white` (6.3:1 ✓).

**Files**: `frontend/src/pages/marketplace/Marketplace.jsx`.

---

## Issue 15 — [P3] Rider map lacks legend, offline tile fallback, and empty-queue polish

**Where**: Rider delivery map (PRD §4.8): merchant→customer polyline + markers, "Navigate" opens Google Maps. Gaps: no map legend explaining 🏪/🏠, no fallback when OSM/MapLibre tiles fail offline, ETA not tied to the 1.3× buffer (PRD §2.2), no obvious "no deliveries" refresh.

**Fix**: Add a compact legend chip row (🏪 Merchant · 🏠 Customer · ⏱ ETA), tile-failure placeholder ("Map offline — showing distance only"), keep the "Navigate"/"Call" buttons ≥ 44 px, and use the shared EmptyState for an empty queue.

**Files**: `frontend/src/pages/rider/*` (delivery detail + dashboard map components).

---

## Prioritized roadmap

| # | Issue | Severity | Effort | Quick win? |
|---|---|---|---|---|
| 1 | ink-400 text contrast | P0 | S | ✅ swap tokens |
| 2 | 9–10 px type | P0 | S | ✅ scale up badges |
| 3 | Nested interactive cards | P0 | M | refactor card wrapper |
| 4 | Bottom nav states/safe area | P1 | M | pill + padding |
| 5 | Offline-unsafe add-to-cart | P1 | M | route via queue |
| 6 | Out-of-range messaging | P1 | M | banner + block CTA |
| 7 | Ad-hoc empty states | P1 | M | shared EmptyState |
| 8 | Carousel touch targets | P1 | S | ✅ hit areas |
| 9 | Header icon a11y | P2 | S | ✅ 44px + labels |
| 10 | Remote placeholder image | P2 | S | ✅ local fallback |
| 11 | Finance money formatting | P2 | M | formatPeso + colors |
| 12 | Infinite-scroll end/offline state | P2 | S | ✅ footer + cache |
| 13 | Legacy beboolbox asset | P2 | S | ✅ rename |
| 14 | Filter chip semantics | P2 | S | ✅ aria-pressed |
| 15 | Rider map legend/fallback | P3 | M | legend + fallback |

**Suggested sprint order**: P0 batch (1–3) → P1 batch (4–8) → P2 batch (9–14) → P3 (15). Each fix lands against the tokens and patterns in `uiux/design-system.md`.
