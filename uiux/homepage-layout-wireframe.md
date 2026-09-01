# Bayan — New Homepage Layout (Wireframe + Section Spec)

> **Owner**: UI/UX (this doc) · **Copy/offers**: Marketing agent (see open slots)
> **Inspiration**: Temu's *mechanic* — dense entry points, price anchoring, urgency, gamified loyalty — NOT its look. Bayan keeps its **purple `#673de6` / charcoal `ink-*` / amber** identity, Filipino-local content, and adds what Temu lacks: **neighborhood trust** (verified local merchants, store→door distance, real barangay anchor).
> **Positioning**: "Your neighbor barangay's store, at your door."
> **Target route**: replaces/upgrades the customer landing at `/` (currently `MarketplaceHome.jsx`) inside `Shell.jsx` bottom nav. Rebrand: **Bayan** (drop "Box" — `marketing/LandingPage.jsx` still shows `BayanBox`, see §9).
> **Reference**: `bayanbox-prd-v3.md` §4.3/§4.4/§4.7/§4.8/§4.11/§4.14/§4.20; `uiux/design-system.md`.

---

## 1. What we keep vs. what we add (vs. Temu)

| Temu mechanic (steal) | Bayan adaptation (better) |
|---|---|
| Dense grid, tiny cards | 3-col mobile grid with **readable** name/price (11–14 px, `ink-800`), ≥44 px tap targets on CTAs |
| Price anchoring "from ₱X" | True "from ₱" (multi-unit SKUs, PRD `products.unit`) + strikethrough original + `-X% OFF` amber/red badge |
| Flash deals + countdown | `flash_deal` ad campaigns (PRD §4.14) + **Suki Points** earn-reward tie-in (PRD §4.10) |
| Category shortcut icons | Category **icon rail** from `GET /api/products/categories` (PRD §4.4) + points shop pinned |
| Hero promo carousel + stacked banners | Admin `banners` carousel (`GET /api/banners`) + stacked promo banner stack (Points Shop, Skilled Workers, free-delivery promo) |
| Gamified loyalty hooks | **Suki Points balance pill** + "Earn +N Suki" on cards + Points Shop banner (PRD §4.9/§4.10) |
| Discount/free-shipping banners | **Local** offers: "Free delivery over ₱500 from your barangay", COD-safe copy |
| Mobile-first, thumb-friendly | Safe-area bottom nav, 44 px targets, offline-first PWA states (PRD §2.2) |

**What makes it *Bayan*, not a clone**: location anchor ("Deliver to: Tara, Sipocot ▾"), merchant distance/verified badges, GCash/Maya/COD trust, PIN + photo proof strip, no copycat mascot/slogan — the identity is purple/charcoal, not red/orange.

---

## 2. Mobile Wireframe (360–414 px, top → bottom)

```
┌────────────────────────────────────────────────┐
│ STICKY HEADER  (bg-ink-900, z-40, safe-area)   │
│  [🏪 Bayan]          (Deliver to: Tara ▾)  🔍 🛒│
│   (Online·queue=0)   ·  [Login/Signup or bell]  │
├────────────────────────────────────────────────┤
│ SEARCH BAR (below header, sticky row)          │
│  [ 🔍 Search products, stores, or opis…  ]     │
├────────────────────────────────────────────────┤
│ HERO CAROUSEL  (rounded-2xl, h-40/48)          │
│  ┌──────────────────────────────────────────┐  │
│  │  [admin banner slide — promo img]        │  │
│  │  [ CTA: Shop now →  link_url ]           │  │
│  └──────────────────────────────────────────┘  │
│      • ● •            ← dots + ‹ › arrows     │
├────────────────────────────────────────────────┤
│ URGENCY / DEAL BAR  (amber gradient strip)     │
│  ⚡ Flash Deals today      ⏱ 02:59:41  [See all]│
├────────────────────────────────────────────────┤
│ CATEGORY ICON RAIL  (horizontal scroll)        │
│  🥬     🍳     🧶     📦     🏝️     🪙     ➕   │
│ Fresh  Cooks Crafts Pkg.  Goods Points  More   │
├────────────────────────────────────────────────┤
│ FLASH-SALE GRID  (2-col, countdown chips)      │
│  ┌───────────┐  ┌───────────┐                  │
│  │ [img] ⏱01 │  │ [img] ⏱01 │   -40% OFF      │
│  │ name line │  │ name line │   (amber badge)  │
│  │ ★★★★ (12) │  │ ★★★ (40)  │                  │
│  │ ₱120 ~~₱200│  │ ₱45 ~~₱80│   earn +N Suki  │
│  │  [ + Add ] │  │  [ + Add ]│                  │
│  └───────────┘  └───────────┘                  │
├────────────────────────────────────────────────┤
│ STACKED PROMO BANNERS  (rounded-2xl stack)     │
│  [🪙 Points Shop — redeem with Suki Points]  → │
│  [🧑🔧 Skilled Workers — hire nearby pros]   → │
│  [🛵 Free delivery over ₱500 in your barangay]→│
├────────────────────────────────────────────────┤
│ PRODUCT GRID  "Shop local barangays"           │
│  [Fresh Produce] [Home Cooks] [On Sale ▾ sort] │
│  ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ img  │ │ img  │ │ img  │   3-col dense      │
│  │ name │ │ name │ │ name │   (col-span-3→6)   │
│  │ ★(12)│ │ ★(40)│ │ ★(8) │                    │
│  │from ₱35│ │from ₱250│ │from ₱120│            │
│  │ ₱35  │ │ ₱250 │ │ ₱120 │   strikethrough    │
│  │[+🛒]  │ │[+🛒]  │ │[+🛒]  │                    │
│  └──────┘ └──────┘ └──────┘                    │
│   [Load more / infinite scroll]                │
├────────────────────────────────────────────────┤
│ TRUST STRIP  (chips row)                       │
│  ✓ GCash·Maya·COD   ✓ PIN+📷 proof   ✓ 100 km  │
├────────────────────────────────────────────────┤
│ FOOTER  (brand blurb, quick links, © Bayan)    │
├────────────────────────────────────────────────┤
│ BOTTOM NAV (fixed): 🏠 Shop · 🛒 Cart · 🔗 Aff. │
│                      📦 Orders · ⭐ Pts · 👤 Prof│
└────────────────────────────────────────────────┘
```

**Region legend**: `HEADER` (identity + location anchor) · `SEARCH` (faceted entry to `/search`) · `HERO CAROUSEL` (admin promos) · `DEAL BAR` (urgency) · `CATEGORY RAIL` (discovery) · `FLASH GRID` (time-boxed offers) · `PROMO STACK` (loyalty + services) · `PRODUCT GRID` (dense browsing with price anchoring) · `TRUST STRIP` (payments/proof/offline) · `FOOTER + BOTTOM NAV`.

---

## 3. Desktop Grid Variant (≥1024 px)

```
┌────────────────────────────────────────────────────────────┐
│ HEADER: [Bayan]  Shop Deals Points  [Deliver to ▾] 🔍 [🛒] │
├──────────────────────────────┬─────────────────────────────┤
│ HERO CAROUSEL (w-full h-64)  │ SIDE PANEL (w-72)           │
│  [admin banner]              │  ⚡ Flash deal countdown     │
│  • ● •                       │  🪙 Suki balance + [Redeem]  │
├──────────────────────────────┤  🧑🔧 Hire a provider        │
│ CATEGORY RAIL (full width)   │  🛵 Delivery estimate CTA    │
│ DEAL BAR (amber, countdown)  └─────────────────────────────┤
├────────────────────────────────────────────────────────────┤
│ FLASH GRID (4-col)  [img][img][img][img]  -40% OFF          │
├────────────────────────────────────────────────────────────┤
│ PROMO BANNERS (3-up grid): Points · Workers · Free ship     │
├────────────────────────────────────────────────────────────┤
│ PRODUCT GRID (4-6 col):  from ₱X · strike-through · +🛒     │
│   [Load more]                                              │
├────────────────────────────────────────────────────────────┤
│ TRUST STRIP (centered chips)  ·  FOOTER (4-col links)      │
└────────────────────────────────────────────────────────────┘
```

- Desktop keeps the same vertical story; side panel pulls the "utility" blocks (Suki, flash countdown, delivery estimator) into a sticky `lg:sticky lg:top-24` column.
- Grids scale: `grid-cols-3 md:grid-cols-4 lg:grid-cols-6`; cards stay compact with `line-clamp-2`.

---

## 4. Section-by-Section Spec

### 4.1 Sticky Header + Location Anchor
- **Purpose**: identity, connectivity, and the single most local signal — *where you deliver*.
- **Data source**: `GET /api/auth/me` (user), `GET /api/profile` (fixed lat/lng, PRD §4.22); guest → "Deliver to: <municipality> ▾" from `GET /api/products` filter or geolocation prompt.
- **Tailwind**: `sticky top-0 z-40 bg-ink-900 text-white shadow-lift-dark`, logo `rounded-xl bg-bayan-600` tile + `Bayan` (`font-black tracking-tight`), location pill `bg-white/10 rounded-full text-xs font-bold`, connectivity pill (existing Shell), cart badge `bg-bayan-600 text-white text-[10px]`.
- **A11y**: header buttons ≥44 px; `aria-label` on icon buttons; location pill is a real button → opens delivery-pick modal.

### 4.2 Search Bar
- **Purpose**: fastest entry to faceted browse (PRD §4.4) — Temu buries search; we keep it first-class under the header.
- **Data source**: navigates to `/search?q=…`; suggestions from `GET /api/products?q=` (debounced).
- **Tailwind**: `flex items-center gap-2 p-2.5 bg-ink-50 border border-ink-200 rounded-2xl focus-within:ring-2 focus-within:ring-bayan-500` (reuse `MarketplaceHome.jsx` pattern).

### 4.3 Hero Carousel
- **Purpose**: admin-owned promo stage.
- **Data source**: `GET /api/banners` (PRD §4.18); `link_url` per slide.
- **Tailwind**: `relative rounded-2xl overflow-hidden`, img `h-40 sm:h-48 object-cover`, CTA chip `bg-bayan-600 text-white rounded-xl`, dots `w-2.5 h-2.5 rounded-full` (wrap in ≥44 px hit area + `‹ ›` arrows, per design-system §8.1), auto-advance 5 s with `aria-live`.

### 4.4 Urgency / Deal Bar (countdown)
- **Purpose**: create time-boxed urgency for today's flash deals.
- **Data source**: nearest active `flash_deal` ad campaign (PRD §4.14 `ad_campaigns`) + `GET /api/products?on_sale=1`; countdown to `flash_deal.ends_at` (fallback: end of day).
- **Tailwind**: `bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 rounded-2xl px-4 py-3 flex items-center justify-between font-bold`, countdown `font-black tabular-nums`, "See all" link `underline`.

### 4.5 Category Icon Rail
- **Purpose**: one-tap discovery by category; scrollable rail keeps grid dense.
- **Data source**: `GET /api/products/categories` (PRD §4.4); + pinned "Points Shop" (→ `/points-shop`).
- **Tailwind**: `flex gap-3 overflow-x-auto pb-2 no-scrollbar`, each `w-16 shrink-0 flex flex-col items-center`, icon tile `w-14 h-14 rounded-2xl bg-bayan-50 flex items-center justify-center text-2xl`, label `text-[11px] font-bold text-ink-700`.

### 4.6 Flash-Sale Grid (2-col)
- **Purpose**: time-boxed, high-discount offers — the conversion engine.
- **Data source**: `flash_deal` + top `on_sale` products (`GET /api/products?on_sale=1&sort=discount`); per-item `sale_price` → % badge (PRD §4.5 `effectivePrice`).
- **Tailwind**: `grid grid-cols-2 gap-3`, card `card p-2.5`, badge `bg-red-500 text-white text-[11px] font-bold rounded-full absolute top-2 right-2`, countdown chip `bg-ink-900/70 text-white text-[10px]`, price row `flex items-baseline gap-1.5`, strike `text-xs text-ink-400 line-through`, sale `text-base font-black text-ink-900`, `🪙 Earn +N Suki` in `text-[11px] font-semibold text-bayan-600` (PRD §4.9).

### 4.7 Stacked Promo Banners
- **Purpose**: cross-sell the loyalty + services rails (Points Shop, Skilled Workers, free delivery).
- **Data source**: static routes `/points-shop`, `/providers`; free-delivery copy slot for Marketing; delivery threshold from config (`marketplace.*` / promos, PRD §4.20).
- **Tailwind**: stacked `card p-4 flex items-center gap-3`, `bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200` (Points), `from-bayan-50 to-bayan-100 border-bayan-200` (Workers), arrow `→ text-ink-300` with `group-hover:translate-x-0.5`.

### 4.8 Dense Product Grid (price anchoring)
- **Purpose**: the long-tail browse surface — many entry points in 1–2 screens.
- **Data source**: `GET /api/products` (faceted, PRD §4.4); `featured_campaigns` from `homepage_featured` ads (PRD §4.14); grid filters (category chip / sort).
- **Price anchoring**: `from ₱X` when product has multiple units/SKUs (`products.unit`); otherwise single price; always `strikethrough` original + `-X% OFF` on `sale_price`.
- **Tailwind**: `grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5`, card `card p-2 flex flex-col`, name `text-xs font-bold text-ink-800 line-clamp-2`, rating `text-amber-400`, price `text-sm font-black text-ink-900`, add button `w-full py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl disabled:bg-ink-200`.
- **A11y**: cards are **one** semantic link (no nested buttons — audit Issue 3); add-to-cart is a separate real button.

### 4.9 Trust Strip
- **Purpose**: de-risk first purchase — payment breadth, proof of delivery, service area, offline-first.
- **Data source**: static copy slots; values from config (GCash/Maya/COD, PIN + photo, `max_delivery_km` = 100, offline queue, PRD §4.7/§4.8/§2.2).
- **Tailwind**: `flex flex-wrap justify-center gap-2`, chips `px-3 py-1.5 rounded-full bg-ink-100 text-ink-600 text-[11px] font-bold`.

### 4.10 Footer + Bottom Nav
- **Footer**: brand blurb, 3 link columns (Platform / For Partners / Company), `© Bayan` — content sourced from `marketing/LandingPage.jsx` but **rebranded** (no "Box").
- **Bottom nav**: existing `Shell.jsx` per-role tabs; customer gets Shop · Cart · Affiliate · Orders · Points · Bookings · Profile; keep ≤6 visible + safe-area padding (design-system §8.1; audit Issue 4).

---

## 5. Data Source Map

| Block | Endpoint / source | PRD § |
|---|---|---|
| Header / user / location | `GET /api/auth/me`, `GET /api/profile` | 4.1, 4.22 |
| Search | `/search?q=` → `GET /api/products` | 4.4 |
| Hero carousel | `GET /api/banners` | 4.18 |
| Deal bar / flash grid | `GET /api/products?on_sale=1` + `ad_campaigns` (`flash_deal`) | 4.5, 4.14 |
| Category rail | `GET /api/products/categories` | 4.4 |
| Product grid | `GET /api/products` (filters/sort/pagination) | 4.4 |
| Featured | `featured_campaigns` (`homepage_featured` ads) | 4.14 |
| Suki points | `GET /api/loyalty`, `/points-shop` | 4.9, 4.10 |
| Delivery estimate | `GET /api/delivery-cost` (merchant-origin, OSRM) | 4.7, 2.3 |
| Trust values | `config('marketplace.max_delivery_km')` etc. | 5 |

---

## 6. Handoff to Marketing (copy slots — not final copy here)
1. Hero slide CTAs (`Shop now`, `Earn Suki`)
2. Deal bar headline ("Flash Deals today")
3. Free-delivery threshold offer
4. Trust-strip phrasing
5. Footer blurb (rebranded, no "Box")

## 7. Open notes for implementation
- This is the **layout spec**; implementation lives in `homepage-layout-jsx.md` (`HomepageV2`).
- Keep offline-first: cached products + banners, offline banner, queued add-to-cart (audit Issue 5).
- Rebrand sweep: `marketing/LandingPage.jsx` and `Shell.jsx` logo still reference `beboolbox`/`BayanBox` (audit Issue 13).
