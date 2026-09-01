# Bayan — Key Screen Wireframes

> ASCII wireframes for the five highest-traffic screens. Every region is labeled. Match tokens from `uiux/design-system.md` (bayan purple / ink charcoal / amber accent, DM Sans, rounded-2xl).
> Layout assumes a 360–414 px mobile viewport (PWA). `[CTA]` = primary action; `(badge)` = chip/badge.

---

## 1. Customer — Storefront Home (`/`)

```
┌────────────────────────────────────────────┐
│ HEADER  (sticky, bg-ink-900)               │
│ [logo] Bayan        [name] [role] [bell]    │
│                         (Online) [logout]   │
├────────────────────────────────────────────┤
│ HERO  (rounded-3xl gradient bayan-700→500)  │
│  Local Marketplace                          │
│  Support neighborhood merchants with        │
│  direct same-day delivery.                  │
│  [🪙 Points Shop]  [🧑‍🔧 Skilled Workers]      │
├────────────────────────────────────────────┤
│ BANNER CAROUSEL (rounded-2xl, h-36/48)      │
│  [ banner image — admin campaign ]          │
│  •  •  o        ← dots (decorative)         │
├────────────────────────────────────────────┤
│ FEATURED ROW  "Featured Products" (scroll)  │
│ [card][card][card] → horizontal swipe       │
├────────────────────────────────────────────┤
│ SEARCH + FILTERS                            │
│ [ Search products, stores… ]                │
│ [ City / municipality… ] [Sort ▾] [x]On Sale│
│ CHIP ROW (category)  All  Vegetables  Rice  │
│   Meats  Snacks  …  ← horizontal swipe      │
├────────────────────────────────────────────┤
│ CARD GRID (2-col; md:3, lg:4)               │
│ ┌──────────┐ ┌──────────┐                   │
│ │[img h-28]│ │[img h-28]│                   │
│ │(Vegetab.)│ │(Official)│ (Sponsored)       │
│ │Kangkong  │ │Bayan Rice│                   │
│ │★★★★☆(12)│ │ ★★★★☆(40)│                   │
│ │fresh…    │ │ premium…  │                   │
│ │₱35  ₱30  │ │₱1,250    │                   │
│ │SALE(9px) │ │🪙+5 Suki  │                   │
│ │[Add to   │ │[Add to    │                   │
│ │ Cart]    │ │ Cart]     │                   │
│ └──────────┘ └──────────┘                   │
│ [Load More Products]  / spinner tail        │
│                                              │
├────────────────────────────────────────────┤
│ BOTTOM NAV (fixed, white, 6–7 cols)         │
│  (Shop)  Cart   Affil.  Orders  Points  Prof.│
│   🏠(on)  🛒(4)   🔗      📦      ⭐      👤  │
└────────────────────────────────────────────┘
```

**Regions**: `HEADER` (identity + connectivity) · `HERO` (brand value + entry CTAs) · `BANNER CAROUSEL` (admin promo) · `FEATURED ROW` (paid ads) · `SEARCH + FILTERS` (facet discovery) · `CARD GRID` (product browse) · `BOTTOM NAV` (role navigation).

---

## 2. Customer — Product Detail + Checkout (`/product/:id` → `/cart` → checkout)

```
┌────────────────────────────────────────────┐
│ HEADER  [← back]      (Offline)   [🛒(4)]  │
├────────────────────────────────────────────┤
│ PRODUCT MEDIA (rounded-2xl, h-56)           │
│  [product image]  (Sponsored)(Bayan Official)│
├────────────────────────────────────────────┤
│ PRODUCT INFO                               │
│  Kangkong Bundle  (Vegetables)   ★★★★☆ (12)│
│  ₱30  ~~₱35~~  [SALE]   Stock: 48           │
│  🪙 Earn +10 Suki  🔗 Share & earn 5%       │
│  Description (2-4 lines)                    │
│  [ Qty − 1 + ]    [Add to Cart]   [Buy Now] │
├────────────────────────────────────────────┤
│ DELIVERY ESTIMATE  (merchant → customer)    │
│  🏪 Mang Juan Store (Tara, Sipocot)         │
│  📍 Your address (3.2 km, ~18 min)          │
│  Delivery fee: ₱35   [Use my location]      │
│  [Change address / pin on map]              │
│  ⚠ out-of-range >100km → red warning,       │
│    Place Order DISABLED                     │
├────────────────────────────────────────────┤
│ CHECKOUT FLOW (steps)                       │
│  1. Fulfillment: (•) Delivery  ( ) Pickup   │
│     hub picker if pickup                    │
│  2. Address + coords (geocode / GPS / map)  │
│  3. Payment: (•) GCash ( ) Maya ( ) COD     │
│     [ ] use affiliate balance               │
│     referral code field                     │
│  4. Summary card: items / delivery / total  │
│     [Place Order — primary CTA]             │
├────────────────────────────────────────────┤
│ BOTTOM NAV   Shop  Cart(4)  Affil.  …       │
└────────────────────────────────────────────┘
```

**Regions**: `PRODUCT MEDIA` (visual proof + badges) · `PRODUCT INFO` (price, ratings, rewards) · `DELIVERY ESTIMATE` (merchant-origin distance, fee, out-of-range guard) · `CHECKOUT FLOW` (fulfillment → address → payment → summary → CTA). Out-of-range rule: > 100 km blocks the CTA (PRD §4.7).

---

## 3. Merchant — Dashboard (`/merchant`)

```
┌────────────────────────────────────────────┐
│ HEADER  [Mang Juan Store]  (role)  [bell]  │
│          (Verified ✓)   (Online)           │
├────────────────────────────────────────────┤
│ STORE STATUS CARD                          │
│  ✅ Active  ·  📍 Tara, Sipocot            │
│  [Edit Store / Location]  [Verify docs]    │
├────────────────────────────────────────────┤
│ KPI CARDS (2×2 grid, tabular nums)         │
│  ┌───────────┐ ┌───────────┐               │
│  │₱12,450    │ │ 3          │               │
│  │Today sales│ │Pending ord.│               │
│  ├───────────┤ ├───────────┤               │
│  │ 128       │ │₱34,200     │               │
│  │Units sold │ │Wallet bal. │               │
│  └───────────┘ └───────────┘               │
├────────────────────────────────────────────┤
│ PENDING ORDERS QUEUE  "Needs action (3)"    │
│  [Order #1021 · ₱450 · Delivery]  [Accept]  │
│  [Order #1022 · ₱120 · Pickup ]  [Reject]   │
│  [Order #1023 · ₱680 · Delivery]  [Ready]   │
├────────────────────────────────────────────┤
│ LOW-STOCK ALERTS  (amber)                  │
│  ⚠ Kangkong — 4 left (threshold 10)        │
│  ⚠ Rice — 8 left                          │
│  [Go to Products]                          │
├────────────────────────────────────────────┤
│ REVENUE TREND (7-day bar chart)            │
│  M  T  W  T  F  S  S                       │
│  ▂ ▄ ▃ ▅ ▆ ▄ ▇                             │
├────────────────────────────────────────────┤
│ BEST SELLERS  (top 3)                      │
│  1. Kangkong — 45 sold  2. Rice — 30 …     │
├────────────────────────────────────────────┤
│ BOTTOM NAV  Dash  Affil.  Cart  Ads  Ord.  │
│             🏠(on) 🔗    🛒    🏷️   📦      │
└────────────────────────────────────────────┘
```

**Regions**: `STORE STATUS` (verification + location) · `KPI CARDS` (money movement) · `PENDING ORDERS` (fulfillment queue w/ state-machine CTAs) · `LOW-STOCK ALERTS` (amber attention) · `REVENUE TREND` (liquidity) · `BEST SELLERS` (insight). Pending-verification merchants see a blocked card instead of product/order tools (RULES §3).

---

## 4. Rider — Delivery Map (`/rider/deliveries/:id`)

```
┌────────────────────────────────────────────┐
│ HEADER  [Order #1021]   (Online)   [SOS 🚨]│
├────────────────────────────────────────────┤
│ ROUTE MAP (MapLibre, fills ~55vh)          │
│                                            │
│      🏪  ← merchant (store icon)           │
│        ╲                                   │
│         ╲  (route polyline, purple)        │
│          ╲    ETA 18 min · 3.2 km          │
│           ╲                                │
│      🏠  ← customer (home icon)            │
│   [Zoom in] [Zoom out] [Locate me]         │
├────────────────────────────────────────────┤
│ DELIVERY CARD (rounded-2xl, stacked)       │
│  PICKUP — 🏪 Mang Juan Store               │
│    Tara, Sipocot · [Call] [Navigate →]     │
│  DROPOFF — 🏠 Juan Dela Cruz               │
│    Brgy. Tara · [Call] [Navigate →]        │
│  Payment: COD ₱450 · PIN: ▢▢▢▢            │
│  📷 Proof-of-delivery photo (required)      │
├────────────────────────────────────────────┤
│ STATUS STEPPER (state machine)             │
│  ● ● ● ○ ○ ○                              │
│  To   At   Picked  En route  Arrived  Done │
│  merchant  up                             │
├────────────────────────────────────────────┤
│ PRIMARY ACTION (driven by current state)   │
│  [Pick Up Order] / [Mark Delivered (PIN+📷)]│
│  [Refuse Job]  (secondary, red outline)    │
├────────────────────────────────────────────┤
│ BOTTOM NAV  Dash  Route  Deliv.  Wallet …  │
└────────────────────────────────────────────┘
```

**Regions**: `ROUTE MAP` (merchant→customer polyline, markers, ETA) · `DELIVERY CARD` (pickup/dropoff addresses + call/navigate) · `STATUS STEPPER` (delivery_state progress) · `PRIMARY ACTION` (contextual CTA: pickup / delivered w/ PIN+photo). Empty state: "No active deliveries — pull to refresh" when queue is clear. Refuse → round-robin reassignment (PRD §4.8).

---

## 5. Admin — Finance Overview (`/admin/finance`)

```
┌────────────────────────────────────────────┐
│ HEADER  [Admin]  (role)  [bell]  [logout]  │
├────────────────────────────────────────────┤
│ TITLE + PERIOD                             │
│  Financial Settlement        [This month ▾]│
│  "Money collected, owed, and settled."     │
├────────────────────────────────────────────┤
│ COLLECTED (by payment method)  2×2 KPI     │
│  ┌───────────┐ ┌───────────┐               │
│  │₱86,400    │ │₱21,050    │               │
│  │GCash      │ │Maya       │               │
│  ├───────────┤ ├───────────┤               │
│  │₱33,700    │ │₱141,150   │               │
│  │COD (cash) │ │Total       │               │
│  └───────────┘ └───────────┘               │
├────────────────────────────────────────────┤
│ WALLET BALANCES (table, tabular nums)      │
│  Wallet              Balance   Status      │
│  Platform earnings   ₱19,210   available   │
│  Admin earnings      ₱8,450    available   │
│  Merchant earnings   ₱64,800   payable     │
│  Rider (prepaid)     ₱12,300   outstanding │
│  Affiliate payouts   ₱4,110    pending     │
│  Provider earnings   ₱3,200    payable     │
│  Sales escrow        ₱28,900   held ⏳      │
├────────────────────────────────────────────┤
│ RIDER COD COLLECTIONS (list)               │
│  Rico the Rider — ₱12,300 outstanding      │
│    [Record Remittance →]  (staff action)   │
│  Berto Rider — ₱1,050 outstanding          │
├────────────────────────────────────────────┤
│ MERCHANT PAYABLES + PENDING CASH-OUTS      │
│  Payables: ₱64,800   Cash-outs: 3 (₱2,400) │
│  [Review Cash-Outs]  (primary CTA)         │
├────────────────────────────────────────────┤
│ RECENT REMITTANCES (audit log)             │
│  today 09:12 · Rico → ₱5,000 · Nena (staff)│
│  today 08:41 · Berto → ₱2,100 · Nena       │
├────────────────────────────────────────────┤
│ BOTTOM NAV  Dash  Merch.  Riders  Set.  Ads│
│             🏠    📦      🗺️     ⚙️    🏷️   │
│                      Finance (wallet icon) │
└────────────────────────────────────────────┘
```

**Regions**: `COLLECTED KPIs` (money-in by method) · `WALLET BALANCES` (double-entry ledger summary incl. escrow "held") · `RIDER COD` (outstanding cash vs. remittances) · `MERCHANT PAYABLES / CASH-OUTS` (owed money + action) · `REMITTANCES LOG` (audit trail). Staff variant (`/staff/finance`) adds the `Record Remittance` action per rider (PRD §4.21, RULES §5).

---

## Wireframe Conventions

| Symbol | Meaning |
|---|---|
| `[ ... ]` | Button / CTA / input |
| `( ... )` | Badge, chip, status pill |
| `• o` | Carousel dots (active = filled) |
| `▂▃▄▅` | Bar-chart magnitude |
| `🏪 → 🏠` | Merchant → customer route (delivery origin = store, PRD §2.3) |
| `[CTA]` bold | Primary action for the screen |

All five screens sit inside the shared Shell (sticky `ink-900` header + fixed white bottom nav + `max-w-5xl` content with `pb-28`), per `frontend/src/components/Shell.jsx`.
