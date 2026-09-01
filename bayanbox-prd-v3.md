# Bayan — PRD v3 (As-Built)

> **Product**: Bayan — Provincial Last-Mile Logistics & Local E-Commerce Platform  
> **Status**: Implemented and reconciled against source as of 2026-08-30  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite + PWA + MapLibre/Leaflet) + PostgreSQL 16  
> **Docs note**: PRD v3 supersedes `becoolbox-prd-v1.md` (v2 as-built) and records the features added since v2: per-role earnings traceability, admin/staff financial settlement, affiliate commission hold (72h vesting), merchant/customer/rider/provider profiles with fixed coordinates, merchant-origin delivery distance calculation, a 100 km service-area cap, and the rider merchant→customer delivery map.  
> **Docs note (v3.1)**: this revision reconciles the doc with the working system after the brand rename and homepage redesign — new dense deal-driven homepage (`HomepageV2`), the **Habi Knot** logo/brand system, the `/api/products/category-images` endpoint, and the AI agent tooling + design deliverables in `marketing/`, `sales/`, `uiux/`, `logo/` (see §11).

---

## 1. Product Overview

Bayan is a **"phygital" (physical + digital) provincial logistics orchestration platform** connecting local micro-merchants (MSMEs), community hubs (sari-sari stores), riders, customers, affiliates, and skilled workers in Philippine provinces.

### Core Value Propositions (all implemented)

1. **B2C Local E-Commerce Marketplace** — Merchants list products; customers browse, search, add to cart, and checkout with GCash/Maya/COD or affiliate earnings.
2. **B2B Packaging Marketplace** — Merchants buy packing supplies using Suki Points or cash.
3. **Bayan Mall** — Admin-owned flagship store (official provincial goods, packaging); 100% of sales route to `admin_earnings` (0% platform rake).
4. **Product Advertising** — Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impressions, clicks, and conversion tracking; admin oversight with credit grants and rate control.
5. **Last-Mile Delivery** — Dynamic per-km fee calculator (Mapbox/ORS failover), surge pricing, round-robin rider assignment, manual/auto dispatch, rider refuse/reassign, delivery PIN + photo proof-of-delivery. **Distance is now calculated from the merchant's store location to the customer's delivery address** (not the hub), with a 100 km service-area cap.
6. **Suki Points Loyalty** — Points earned on purchases and reviews; a dedicated **Points Shop** of points-only products.
7. **Affiliate Program** — Referral codes/QR/PDF poster for Customer, Merchant, Rider, Provider; commission earnings, cash-outs, and ID verification (staff excluded). Commissions are **held in escrow for a 72-hour grace period** and vest on a schedule; cancelled orders void the pending hold.
8. **Skilled Worker Marketplace** — Verified providers with profile picture/official badge, booking with two-party completion (confirm/rework), reviews, and Suki points.
9. **Merchant Operations** — Order fulfillment workflow (state machine), sales dashboard, reports, wallet withdrawals, payout account management (GCash/Maya/Bank), and an editable merchant profile with store coordinates.
10. **Multi-Party Ledger** — Double-entry wallets with automated splits (merchant, platform, affiliate, rider, hub, provider, admin) via a `sales_escrow` that links both sides of every movement.
11. **Staff Operations Console** — Dispatch queue, live status board, incident management, support tickets (with refund reversal), delivery history/audit trail, hazard zones, and **financial settlement (remittance) for collected COD funds**.
12. **Admin Platform Console** — Merchant verification, rider/affiliate/mall/ads/banners management, settings (fees/ads/toggles/locations), category management, and a **financial settlement overview** (collected amounts, wallets, riders, merchants, pending cash-outs).
13. **Offline-First PWA** — IndexedDB offline queue with flush-on-reconnect, connectivity badge, fullscreen display.
14. **Role-Based Profile Management** — Customer, Rider, Provider, and Merchant profiles with editable info **and fixed latitude/longitude** (GPS button + manual entry), used for delivery routing.

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2), RESTful JSON |
| API Auth | Laravel Sanctum token auth |
| Database | PostgreSQL 16 |
| Frontend | React 18 (Vite + PWA via `vite-plugin-pwa`) |
| Styling | Tailwind CSS (purple/charcoal theme, DM Sans) |
| Maps | Frontend: MapLibre GL (`DeliveryMap.jsx`, OSM raster tiles, no API key) + Leaflet + `@turf/turf`; Backend distance: Mapbox Directions + OpenRouteService failover |
| Routing distance (frontend estimate) | OSRM public API (`router.project-osrm.org`) with straight-line fallback |
| Geocoding | Nominatim (OpenStreetMap) with progressive component-stripping fallback + map click-to-pick |
| QR | Frontend `html5-qrcode` (hub scanner); referral poster rendered server-side via `barryvdh/laravel-dompdf` |
| SMS | Semaphore API (optional, graceful fallback) |
| Images | GD optimization via `POST /api/upload` |
| HTTP client | Guzzle (backend), Axios (frontend) |

### 2.2 PWA Features

- Fullscreen display (`display: fullscreen` + `display_override`); `theme_color #673de6`, `background_color #12111d` (dark ink splash).
- Service worker via `vite-plugin-pwa` (precaching); install icons are real PNGs: `bayan-tile-192.png` (192×192), `bayan-tile-512.png` (512×512, also used as `maskable`), plus `favicon.svg`; all Habi Knot brand assets are precached (`includeAssets`).
- Offline queue: `frontend/src/services/offlineQueue.js` (IndexedDB, 1,000-entry cap) flushed to `POST /api/sync/offline-queue` on reconnect
- 50m GPS telemetry service (`services/telemetry.js`); 1.3× ETA buffer (`services/eta.js`)
- Public marketplace homepage (no login required); login/signup via header button; add-to-cart triggers login
- **Vite config**: `optimizeDeps.exclude: ['maplibre-gl']` + `worker.format: 'es'` so the MapLibre web worker loads from `node_modules` instead of the (broken) optimized `.vite/deps` directory.

### 2.3 Location & Delivery Distance Model

- Every user can store a **fixed location** (`users.latitude` decimal(10,7), `users.longitude` decimal(10,7)) editable in their profile (customer, rider, provider, merchant).
- **Delivery origin = merchant store coordinates** (from the cart/order items' product owner), not the hub. Falls back to the hub only when the merchant has no coordinates.
- **Delivery destination = customer's checkout coordinates** (typed address geocoded, device GPS, or map click-to-pick).
- **Service-area cap**: deliveries beyond `marketplace.max_delivery_km` (default 100, env `MAX_DELIVERY_KM`) are rejected with a clear out-of-range message instead of quoting a runaway fee. Enforced both in the frontend estimate and the backend `DeliveryPricingService`.
- Geocoding failure handling: if Nominatim cannot resolve the typed address (e.g., rural purok-level addresses), it progressively strips address components, then falls back to map click-to-pick and manual coordinates with a warning when the hub defaults are still in use.

---

## 3. Role Definitions

Six RBAC roles (`App\Enums\Role` + `EnsureRole` middleware, enforced per route group). Default password for all demo users: **`Password123!`** (MasterSeeder). **Staff are strictly blocked (403) from the personal affiliate program.**

| Role | Description | Landing Page (role → `/`) |
|---|---|---|
| **Admin** | Platform owner; dashboard, merchant verification, rider/affiliate/mall/ads/banners management, settings (fees/ads/toggles/locations), categories, **financial settlement overview** | Admin Dashboard |
| **Staff** | Hub agent; ops console (dispatch, incidents, tickets, status board), mall inventory, hub inventory, **COD remittance / financial settlement**; hub referral QR (hub feature — usable by staff, not personal affiliate) | Staff Dashboard |
| **Rider** | Batch routes, GPS telemetry, doorstep deliveries (accept/refuse), **merchant→customer route map**, wallet, earnings, emergency report, affiliate, profile | Rider Dashboard |
| **Merchant** | Products, order fulfillment, ads, reports, payouts, **editable profile (info + store lat/lng)**, verification docs, affiliate | Merchant Dashboard |
| **Customer** | Marketplace, search, cart, orders/tracking, points shop, bookings, affiliate, **profile (info + fixed lat/lng)** | Marketplace Home |
| **Provider** | Skills/picture/reviews/badge, jobs (accept → complete → confirm/rework), profile (info + fixed lat/lng), affiliate | Marketplace Home |

### 3.1 Per-Role Rules (summary — see `RULES-PER-ACCOUNT.md` for full matrix)

| Capability | Admin | Staff | Rider | Merchant | Customer | Provider |
|---|---|---|---|---|---|---|
| Browse marketplace / search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage products | ✅ | — | — | ✅ | — | — |
| Fulfill merchant orders | ✅ | — | — | ✅ | — | — |
| Dispatch/assign riders | ✅ | ✅ | — | — | — | — |
| Accept/refuse delivery jobs | — | — | ✅ | — | — | — |
| Mark delivery out-for-delivery/delivered | — | — | ✅ | — | — | — |
| Personal affiliate program | ✅* | ❌ 403 | ✅ | ✅ | ✅ | ✅ |
| Hub referral QR / poster | ✅ | ✅ | — | — | — | — |
| Financial settlement (remit COD) | ✅ view | ✅ remit | — | — | — | — |
| Edit own profile + fixed lat/lng | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verify merchants | ✅ | — | — | — | — | — |
| Manage ads/banners/settings/categories | ✅ | — | — | — | — | — |
| Book providers / confirm-rework | — | — | — | — | ✅ | — |
| Manage own bookings (accept/complete) | — | — | — | — | — | ✅ |

*Admin has an admin-level affiliate management console (list, cash-outs, activation); admin is not enrolled in the personal consumer affiliate program by role definition.

---

## 4. Modules

### 4.1 Authentication & Registration
- Register and login by **phone + password**; `POST /api/auth/register` throttled `3,60`; login throttled via `throttle:login`.
- Sanctum token auth; `GET /api/auth/me` restores the session; auto-redirect by role on `/`.
- Registration captures phone, name, role; merchants default to `pending_verification` status.

### 4.2 Merchant Verification Workflow (Module 1)
- `GET /api/admin/merchants/pending`, `POST /admin/merchants/{id}/approve` (activates + wallet), `POST /{id}/reject` (with reason).
- Merchant lifecycle statuses: `pending_verification` → `active` / `rejected`.
- Admin can later activate/deactivate merchants (`POST /merchants/{id}/activate|deactivate`).
- Verified timestamp and notes stored on the user (`verified_at`, `verification_notes`).

### 4.3 Marketplace Home (`/`) — HomepageV2 (v3.1)

The customer landing at `/` is **`HomepageV2`** (`frontend/src/pages/marketplace/HomepageV2.jsx`) — a dense, deal-driven storefront inspired by the *mechanic* of modern deal storefronts (density, urgency, price anchoring) but with Bayan's own purple/charcoal/amber identity and local Filipino content (not a copy of any existing brand). Public without login. Sections, top to bottom (the Shell sticky header + bottom nav are shared components):

1. **Search bar + location pill** — navigates to `/search?q=...`; shows the user's barangay/municipality when logged in.
2. **Hero carousel** — admin banners (`GET /api/banners`), auto-advance, 44px prev/next + dot controls.
3. **Flash Deals bar** — amber urgency strip with a live **countdown to midnight** (`useCountdown` hook); "See all" → `/search?on_sale=1`.
4. **Category rail** — 6 static category tiles (Fresh Produce, Home Cooks, Local Crafts, Packaging, Provincial Goods, Points Shop) + More. Tiles render a **real product photo per category** (from `GET /api/products/category-images`, fallback: first product image via `/api/products?per_page=100`, then the emoji icon; a broken URL drops to the emoji tile, never a blank box).
5. **Flash Sale grid** (2-col) — `GET /api/products?per_page=6&on_sale=1&sort=reviews` with `-X%` badges, star rating, **price anchoring** (strikethrough original + sale price), and "🪙 Earn +N Suki" chips.
6. **Promo banners** — stacked cross-sell cards (Points Shop → `/points-shop`, Skilled Workers → `/providers`, free-delivery promo → `/search`).
7. **"Shop local barangays" grid** (3-col mobile, up to 6-col desktop) — `GET /api/products?per_page=12` with the same price-anchored `ProductCard` (strikethrough + "from ₱X" when a `unit` exists); "Load more" → `/search`.
8. **Trust strip** — GCash · Maya · COD, PIN + photo proof, up to 100 km, works offline.
9. **Footer** — Bayan wordmark + Habi Knot icon (`bayan-icon.svg`), tagline, © line.

Data endpoints: `GET /api/banners`, `GET /api/products` (filters), `GET /api/products/category-images` (v3.1), `GET /api/products/categories`.

### 4.4 Search Page (`/search`)
- Faceted filters (category, city, price range, on-sale-only, in-stock), sorting (relevance, reviews, sales, price), infinite scroll / Load More, top "Sponsored Items" carousel. `GET /api/products`, `/products/categories`, `/products/category-images` (v3.1 — one hero image per category for the homepage rail), `/products/{id}`, `/products/{id}/related`, `/products/{id}/reviews`.

### 4.5 Products (Merchant CRUD)
- Fields (per `products` table + `Product` model): name, **unit**, description, **category** (string, admin-managed catalog), price, **sale_price + On Sale**, stock, **low_stock_threshold**, suki award, affiliate %, availability, status (active/draft/archived), images (upload + `product_images` gallery), **points_price / points_only**, **is_official_mall** (admin only).
- Storefront visibility scope `active`: `status=active AND stock>0 AND availability=available`; `effectivePrice()` returns `sale_price` when set.
- Endpoints: `/api/merchant/products` GET/POST/PUT/DELETE (role merchant, admin).

### 4.6 Bayan Mall (Admin-owned, Module 2)
- `is_official_mall` products (AdminMallController CRUD `/api/admin/mall/products`); 100% minus affiliate → `admin_earnings`, **0% commission**; "Bayan Official" badge; pinned to top of storefront; staff inventory view (`/api/staff/mall/inventory`).

### 4.7 Cart & Checkout
- `/api/cart` GET (includes `merchant` with lat/lng per item for delivery-origin), `/api/cart/sync` POST, `/api/cart/items/{productId}` DELETE.
- `POST /api/checkout` validates: `fulfillment_type` (pickup|delivery, required), `payment_method` (gcash|maya|cod), `hub_id` (required_if pickup), `delivery_address` + `latitude`/`longitude` (required_if delivery, PH bounds lat -14..21, lng 116..127), `municipality`, `referral_code`, `use_affiliate_balance`.
- Checkout (MarketplaceService) inside a DB transaction: locks product rows, validates stock, creates the master order + order items, **burns Suki Points** for points-only items, **debits affiliate earnings** when `use_affiliate_balance` is set, decrements stock atomically, splits the ledger via a `sales_escrow`, notifies merchants, clears the cart.
- **Delivery fee is calculated from the merchant's store coordinates to the customer's delivery coordinates** via `resolveDoorstepShipping` → `merchantOriginFor()` (first cart item's product merchant with coordinates; hub fallback).
- **Service-area guard**: if the driving distance exceeds `marketplace.max_delivery_km` (default 100), checkout is rejected with `422` and a clear message; the frontend shows the same out-of-range warning and blocks the Place Order button.
- Order payment methods: `gcash`, `maya`, `cod`, `points`, `affiliate`. **COD** orders start `pending_payment` and their payouts are deferred until the rider marks the order delivered.
- Referral resolution: explicit `referral_code` at checkout, else the account's registered referrer (`referred_by_id`).
- **Cart-page delivery estimate**: merchant-origin → customer destination via OSRM (driving distance, duration, route geometry for the map); falls back to straight-line Haversine; out-of-range (> 100 km) shows a red warning instead of a fee.

### 4.8 Orders, Fulfillment & Delivery (state machine)
Two representations are kept in sync by `OrderStateMachine`:
- **`delivery_state`** (authoritative lifecycle): `pending_merchant → preparing → ready_for_pickup → raider_assigned → raider_en_route_to_merchant → at_merchant → in_transit → arrived → delivered` (or `cancelled` from the first three states).
- **Legacy `status` + `fulfillment_status`** mirrored for existing UIs (status: paid/assigned/out_for_delivery/delivered/cancelled/disputed; fulfillment: pending/accepted/sending_to_courier/accepted_by_courier).

Role-scoped transitions (who may perform each action, ownership enforced):
| Action | Roles | Target state |
|---|---|---|
| accept / reject | merchant, admin | preparing / cancelled |
| mark_ready | merchant, admin | ready_for_pickup |
| assign_raider | staff, admin | raider_assigned |
| accept_job | rider | raider_assigned |
| depart_to_merchant | rider | raider_en_route_to_merchant |
| arrive_merchant | rider | at_merchant |
| pickup_order | rider | in_transit |
| arrive_customer | rider | arrived |
| complete_delivery | rider | delivered (requires PIN + photo) |
| cancel | customer (own orders only), staff, admin | cancelled |
| force_cancel / override | staff, admin | cancelled / any |

Delivery features: 4-digit one-time **delivery PIN** (`generatePin`), **proof-of-delivery photo**, auto-cancel + wallet refund for orders stuck pending merchant, **COD payout release on delivered**, round-robin rider assignment (fewest-active-rider), rider refuse → pool, staff manual/auto dispatch with `dispatch_method` + `assigned_by_id` audit.
- **Cancellation voids pending affiliate commissions** (see 4.11) and refunds the order.
- Merchant order endpoints: `GET /api/merchant/orders`, `POST /merchant/orders/{id}/status`.
- Customer tracking: `GET /api/orders` (customer), `GET /orders/{id}/state`, `POST /orders/{id}/state/{action}`, `POST /orders/{id}/generate-pin`.
- Staff dispatch: `/api/staff/deliveries/unassigned`, `/staff/deliveries/{id}/assign`, `/staff/sales/today`.
- **Rider delivery map**: `GET /api/rider/deliveries` and `GET /api/rider/deliveries/history` return a `merchant` object (name, lat/lng, barangay, municipality) per order; the frontend renders the **merchant (🏪) → customer (🏠)** route on the delivery detail map and the rider dashboard active-order map. The "Navigate" button opens Google Maps directions from the merchant to the customer.

### 4.9 Product Reviews & Related
- Verified-buyer-only reviews, unique per (user, product): `product_reviews` with `order_item_id` link.
- Suki points awarded for provider reviews (config `rewards.review_points`, default 5).
- Related products via behavioral co-occurrence (`RelatedProductsService`): purchase co-occurrence + view co-occurrence + category fallback.
- Review Suki points: products carry `suki_points_award` granted on purchase.

### 4.10 Points Shop
- Products with `points_only=true` + `points_price`; redeemable exclusively with Suki Points; points burned at checkout (`payment_method=points`).
- Packaging marketplace (B2B): `packaging_items` + `packaging_redemptions` via `/api/loyalty/packaging`, `/loyalty/packaging/redeem`; doorstep upgrade `/loyalty/doorstep-upgrade` (50 pts, 3km radius, config).

### 4.11 Affiliate Program (Customer/Merchant/Rider/Provider; **Staff blocked 403**)
- Referral code + QR + **PDF poster** (`/api/hub/affiliate/referral-qr`, `/poster`, and admin poster route; Blade template rendered via dompdf).
- Endpoints: `POST /affiliate/register-referral`, `GET /affiliate/earnings`, `GET /affiliate/qr`, `POST /affiliate/cash-out`, `GET /affiliate/cash-outs`, `POST /affiliate/upload-document`.
- **Document upload (ID) for admin activation** (`affiliate_status`, `affiliate_documents`, `affiliate_activated_at`); cash-outs (min ₱200, config) gated until activated; admin approve/decline with reasons.
- Cash-outs carry `wallet_type` + optional `payout_account_id`/`payout_reference`.
- **Commission hold / vesting (grace period)** — new in v3:
  - Marketplace affiliate commissions are **not transferred instantly**. `AffiliateService::holdCommission()` writes a `pending_affiliate_commissions` row (order_id, affiliate_id, amount, `held_until` = now + `affiliate.commission_hold_hours` (default 72), status `held`).
  - A scheduled command **`affiliate:release-commissions`** (registered `everyMinute()` in `routes/console.php`) releases vested holds (`held_until` passed) into the affiliate wallet via a `ledger_transactions` `affiliate_commission` credit.
  - **Cancelled orders void** the pending hold (`voidPendingForOrder()`) — the money never reaches the affiliate wallet.
  - `GET /api/affiliate/earnings` returns `balance` (available), `income_sources`, `ledger`, and **`pending`** (sum of still-held amounts) so the dashboard shows "Available earnings" and "⏳ Pending (grace period)" cards.
- **Per-role earnings traceability** — new in v3:
  - The affiliate earnings screen breaks income down into `income_sources` (marketplace orders, parcels/micro-commissions) with a full double-entry `ledger` history showing description, amount, direction, and timestamp — so a customer, rider, or merchant can see **exactly which commission came from which source**.
  - Demo ledger income is seeded for the main accounts (customer c1, rider r1, merchant m1) via `MasterSeeder::seedAffiliateIncome()` (5 ledger transactions each: 3 marketplace order commissions + 2 parcel micro-commissions, total ₱129.25 each).

### 4.12 Notifications & Support
- `notifications` table; bell with unread badge + dropdown; endpoints `/notifications`, `/unread-count`, `/read-all`, `/{id}/read`.
- Triggers: merchant new order/approved/rejected, admin new applicant/document, rider emergency, fulfillment updates (state machine broadcasts to customer + staff role feed), affiliate status.
- **Incident reports** (`incident_reports`): rider SOS `/api/rider/emergency`; staff view/resolve (`/staff/ops/incidents`, `/incidents/{id}/resolve`).
- **Support tickets** (`support_tickets`): staff view/resolve with action `refunded` (reverses original order payouts), `redelivery`, or `dismissed`.

### 4.13 Skilled Workers & Bookings
- Public provider directory + hire page; provider profile fields: `picture_url`, `is_official` badge, `availability`, `hourly_rate`, `completed_jobs`, `profile_views`, plus fixed `latitude`/`longitude`.
- Booking lifecycle: pending → accepted → provider_completed → customer **confirm** (escrow payout) or **rework** (with `rework_reason`); provider jobs page with accept/complete/resubmit.
- Endpoints: `GET /providers`, `/providers/{id}`, `/providers/{id}/reviews`, `GET /services`, `POST /providers/{id}/review`, `GET|PUT /provider/profile`, `POST /bookings`, `/bookings/{id}/accept|complete` (provider, admin), `/bookings/{id}/confirm|rework` (customer).
- Payout split on confirm uses `bookings.quoted_amount / platform_commission / provider_payout`; provider reviews award Suki points.

### 4.14 Product Advertising
- Merchant `/api/merchant/ads`: create campaigns (Sponsored ₱50/day, Homepage Featured ₱100/day, Flash Deal ₱30/day — config `ads.rates`), max 30 days, wallet/points payment, pause/resume; analytics (impressions/clicks/conversions) via `AdService` + public impression/click tracking (`POST /ads/{id}/impression|click`).
- Campaign fields include `title`, `display_order`, `keywords` (admin-editable); injection into search/homepage.
- Admin `/api/admin/ads`: index/edit/delete, status toggle, **ad rate override** (`PUT /admin/ad-rates`), **grant credits** (`POST /admin/merchants/{id}/grant-credits`).
- Ad type labels: `sponsored`, `homepage_featured`, `flash_deal`; payment methods wallet/points.

### 4.15 Merchant Analytics & Payouts
- `/api/merchant/dashboard` + `/reports`: store status, KPIs (month/lifetime revenue, pending orders, units sold, wallet balance), pending-orders queue, low-stock alerts, daily revenue trend, best-sellers, wallet + withdrawal history.
- `POST /merchant/cash-out` requests a cash-out from `merchant_earnings`.
- **Payout accounts** (`merchant_payout_accounts`): GCash/Maya/Bank CRUD + set-default (`GET|POST|PUT|DELETE /merchant/payouts`).

### 4.16 Wallets & Ledger
- Wallet types: `rider_prepaid`, `merchant_earnings`, `platform_earnings`, **`admin_earnings`**, `affiliate_payout`, `provider_earnings`, plus **`sales_escrow`** (intermediate holding wallet for payouts).
- Double-entry ledger (`ledger_transactions`) with `counterparty_wallet_id`, unique `transaction_hash`, polymorphic reference, and `balance_after`; `WalletService` provides credit/debit/transfer/ensureWallet/refundOrder.
- Endpoints: `GET /api/wallets`, `POST /wallets/{type}/topup`, `GET /wallets/{type}/ledger`, `POST /wallets/{type}/withdraw`.
- `WalletService::refundOrder` reverses an order's payouts (used by auto-cancel and refunded tickets).

### 4.17 Staff Operations Console (Module 5)
- `StaffOpsController`: KPI overview (`/staff/ops/overview`), dispatch queue + rider workload + live GPS (`/staff/ops/dispatch`), manual/auto assignment (`/staff/ops/dispatch/{orderId}/assign`), status board grouped by state (`/staff/ops/status-board`), force status override with COD payout release (`/staff/ops/orders/{id}/status`), incidents, tickets, filterable delivery history (`/staff/ops/history`), full lifecycle audit + POD + reviews (`/staff/ops/orders/{id}/audit`), hazard zones from settings (`/staff/ops/hazards`, `POST /staff/ops/hazards`).

### 4.18 Admin Settings, Categories & Banners
- `AdminSettingsController`: `GET/PUT /api/admin/settings` with groups `fees`, `ads`, `toggles`, `locations` (stored as JSON in `system_settings`); categories CRUD (`POST/PUT/DELETE /admin/categories`) with slug/icon/sort_order/is_active and delete-safety (cannot delete a category with active products).
- `BannerController`: public `GET /api/banners`; admin CRUD `/api/admin/banners`.

### 4.19 Admin Oversight: Merchants, Riders, Affiliates, Mall
- Merchants: list/search/show/update/delete, activate/deactivate, pending verification queue, approve/reject.
- Riders: list/show/update/delete; status board and dispatch reuse rider workload.
- Affiliates: list with filters + earnings sort, cash-out approval/decline, activate; poster route.
- Mall: full product CRUD (see 4.6).

### 4.20 Logistics (legacy parcel domain, retained)
- Hubs with capacity; parcel intake/reconcile/release/return (`HubController`); OTP pickup codes; delivery batches + batch parcels; rider telemetry (`rider_locations`); geo-targeted promos (`promo_codes`/`promo_redemptions` — flat/percent/free_delivery); dynamic per-km delivery pricing with surge; tracking `GET /api/track/{tracking}`; return shield grants for referring merchants (`return_shield_grants`).

### 4.21 Financial Settlement — Admin & Staff (new in v3)
- **Admin finance** (`GET /api/admin/finance`, `AdminFinanceController`) — money-flow overview: total collected (orders by payment method), wallet balances (platform, admin, merchant, rider, affiliate, provider, escrow), rider COD collections, merchant payable totals, and pending cash-outs.
- **Staff finance** (`GET /api/staff/finance`, `POST /api/staff/finance/remit`, `StaffFinanceController`):
  - `summary()` — collected cash, rider COD collections outstanding, merchant payout totals, and recent remittances.
  - `remit()` — records a **rider COD remittance** into `rider_cod_remittances` (rider_id, amount, notes, recorded_by), auditing cash handed by a rider back to the hub.
- This gives admin/staff a full picture of **money collected, amounts owed to riders/merchants, and settlement actions** ("flow of money").

### 4.22 Role Profiles with Fixed Coordinates (new in v3)
- **Customer** (`/customer/profile`, `CustomerProfile.jsx` + `GET|PUT /api/profile`) — edit name, email, barangay, municipality, and fixed lat/lng (GPS button + manual).
- **Rider** (`/rider/profile`, `RiderProfile.jsx` + `GET|PUT /api/profile`) — same personal + location fields.
- **Provider** (`/provider/profile`, `ProviderProfile.jsx` + `GET|PUT /provider/profile`) — personal info, skills card, fixed lat/lng.
- **Merchant** (`/merchant/profile`, `MerchantProfile.jsx` + `GET|PUT /api/merchant/profile`) — store name, email, barangay, municipality, verification docs, and a **"📍 Store location"** card (GPS button + latitude/longitude inputs with pair-must-be-together validation).
- Shared endpoint `GET|PUT /api/profile` (`ProfileController`) for customer/rider/provider.
- The **cart page** also offers "Use my current location" (device GPS), geocoding of the typed address, and **map click-to-pick** with a default-coordinates warning.

---

## 5. Financial Split Rules (as enforced by `MarketplaceService` + `config/bayanbox.php`)

| Scenario | Party | Share |
|---|---|---|
| Regular sale | Merchant / Platform / Affiliate / Customer | 90% / 10% / product affiliate % / Suki points |
| Bayan Mall sale | Admin / Affiliate / Customer | 100% minus affiliate / affiliate % / Suki points (0% rake) |
| Delivery fee | Rider / Platform | 85% / 15% |
| Pickup fee (₱10) | Hub staff / Platform | ₱5 / ₱5 (hub staff wallet = `merchant_earnings`) |
| Points-only item | Customer pays points; no cash split | — |
| Affiliate purchase | Customer's affiliate wallet debited | — |
| Booking payout | Provider / Platform | `provider_payout` / commission (on customer confirm) |
| COD | Released on delivery | Deferred from checkout until rider marks delivered |
| Affiliate commission | **Held 72h** in `pending_affiliate_commissions` → released to affiliate wallet | Vested via scheduled command; voided on cancellation |

- Delivery pricing formula: `baseFare + max(0, excessKm × perKmRate) × surge` (per-municipality `delivery_rate_settings`; night surge 1.5× 21:00–06:00 configurable; Mapbox/ORS with 7-day geohash cache).
- **Delivery distance**: origin = merchant store lat/lng (from the cart/order items' product owner); destination = customer delivery lat/lng. Hub is only a fallback when the merchant has no coordinates.
- **Service-area cap**: `marketplace.max_delivery_km` (default 100, env `MAX_DELIVERY_KM`); distances beyond the cap are rejected (422) rather than charged a runaway fee.
- Platform fees: marketplace 10% rake; COD platform fee 1% (config); pickup handling fee ₱10 (config).
- Affiliate: max affiliate percentage 50%; min cash-out ₱200; **commission hold 72h** (`affiliate.commission_hold_hours`, env `AFFILIATE_COMMISSION_HOLD_HOURS`).
- Delivery splits configurable per municipality; defaults 85/15.

---

## 6. Database Schema

**Core**: `users` (incl. `latitude`, `longitude` decimal(10,7)), `provider_profiles`, `service_categories`, `hubs`, `delivery_rate_settings`, `parcels`, `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels`, `rider_locations`, `addresses`, `bookings`, `wallets`, `ledger_transactions`, `notifications`.

**Marketplace**: `products`, `product_images`, `product_views`, `product_reviews`, `cart_items`, `orders`, `order_items`, `packaging_items`, `packaging_redemptions`, `banners`, `ad_campaigns`, **`categories`** (admin-managed catalog; `products.category` remains a string, not an FK).

**Loyalty/Affiliate**: `loyalty_points`, `promo_codes`, `promo_redemptions`, `affiliate_cash_outs` (with `wallet_type`, `payout_account_id`, `payout_reference`), `provider_reviews`.

**Financial settlement (new in v3)**:
- `pending_affiliate_commissions` — (order_id, affiliate_id, amount, `held_until`, status held/released/cancelled, `released_at`, `cancelled_at`).
- `rider_cod_remittances` — (rider_id, amount, notes, `recorded_by`) audit of cash handed to the hub.

**Additional tables not in PRD v1** (all implemented):
- `return_shield_grants` — B2B Return Shield credits for referring merchants.
- `system_settings` — key-value JSON platform config (fees/ads/toggles/locations/hazards).
- `merchant_payout_accounts` — merchant payout destinations (GCash/Maya/Bank).
- `incident_reports` — rider SOS/incident reports.
- `support_tickets` — customer/merchant support tickets.
- `categories` — admin-managed product categories (name/slug/icon/sort_order/is_active).

**Key columns added after base migrations** (not in PRD v1):
- `users`: `is_official_mall`, `verification_notes`, `verified_at`, `affiliate_status`, `affiliate_documents`, `affiliate_activated_at`, **`latitude`, `longitude`**.
- `products`: `is_official_mall`, `sale_price`, `availability`, `points_price`, `points_only`, `unit`, `low_stock_threshold`.
- `orders`: `payment_method`, `fulfillment_status`, `dispatch_method`, `assigned_by_id`, `delivery_state`, `delivery_pin`, `delivery_photo_url`, `accepted_at`, `ready_at`, `rider_pickup_at`, `cancel_reason`.
- `provider_profiles`: `picture_url`, `is_official`, `availability`, `hourly_rate`, `completed_jobs`, `profile_views`.
- `bookings`: `rework_reason`.
- `ad_campaigns`: `title`, `display_order`, `keywords`.
- `users` stores the password in `password_hash` (non-standard Laravel column, kept intentionally).

**Known schema caveat**: migration `2026_08_27_031500_add_indexes_to_order_items_table` re-creates indexes already present in the base `order_items` migration — this can fail on a fresh PostgreSQL migration; the base migration's indexes suffice.

---

## 7. Demo Users & Seed Data (MasterSeeder)

Default password for all MasterSeeder users: **`Password123!`**

| Role | Name | Phone | Coordinates |
|---|---|---|---|
| Admin | Admin | 09170000001 | — |
| Staff | Nena Hub Staff | 09170000002 | — |
| Rider | Rico the Rider | 09170000003 | — |
| Rider (extra) | Berto Rider | 09175550000 | — |
| Merchant (verified) | Mang Juan Store | 09170000004 | Tara, Sipocot (`13.7689, 122.9764`) |
| Merchant (pending) | Nena Sari-Sari | 09170000007 | — |
| Customer (cart + points) | Juan Dela Cruz | 09170000005 | Tara, Sipocot (`13.7695, 122.9771`) |
| Customer | Maria Clara | 09170000006 | — |
| Customer (reviewers ×3) | Ramon / Liza / Tomas | 09170000010/11/12 | — |
| Affiliate (pending cash-out) | Rosie | 09170000008 | — |
| Affiliate (extra) | Karding | 09170000009 | — |

Seed inventory (MasterSeeder):
- **28 products**: 17 merchant-owned (Mang Juan), 7 **admin-owned Bayan Mall** (`is_official_mall=true`, incl. 3 points-only Points Shop items), 4 merchant2 (pending) — across categories Fresh Produce, Home Cooks, Local Crafts, Packaging, Provincial Goods, Points Shop.
- **6 orders** across all statuses (paid, assigned, out_for_delivery, delivered, disputed, pending_payment), payment methods gcash/maya/cod, fulfillment pickup/delivery. **Delivery orders carry the customer's coordinates** so the rider map shows the real store→home route.
- **Affiliate income seeded** (`seedAffiliateIncome()`) for c1, r1, m1 — 5 ledger transactions each (3 marketplace order commissions + 2 parcel micro-commissions, total ₱129.25 each) so the affiliate dashboard shows income sources + transaction history.
- **4 ad campaigns** (2 sponsored, 1 homepage_featured, 1 flash_deal; 3 active + 1 completed), **3 banners** (2 active), **3 cash-outs** (pending/paid/declined).
- 7 wallets (admin_earnings, platform_earnings, merchant_earnings, rider_prepaid, affiliate_payout ×3), 2 loyalty point entries, 2 cart items, ~84 product reviews.

The alternate `DatabaseSeeder` (default Laravel seeder) instead creates 10 users incl. **4 providers**, 1 hub, 4 delivery rate settings, 4 service categories, 4 packaging items, 2 promos, and 8 products (4 merchant + 4 mall) — with password `password` (not `Password123!`).

---

## 8. Running the System

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class='Database\Seeders\MasterSeeder'
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000

# Affiliate commission release scheduler (every minute, self-registered in routes/console.php)
php artisan schedule:work   # or rely on the scheduler via cron

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

**Environment notes**: `APP_URL=http://localhost:8000`; `SEMAPHORE_API_KEY` optional; GD extension enabled; PostgreSQL 16 local (`bayanbox` db, `trust` auth); Mapbox/ORS tokens optional (graceful failover); `MAX_DELIVERY_KM` optional (default 100); `AFFILIATE_COMMISSION_HOLD_HOURS` optional (default 72). Vite dev server proxies `/api` to `:8000`. Vite config excludes `maplibre-gl` from the dep optimizer (MapLibre worker fix).

---

## 9. Design System

Colors: Purple brand (`bayan-*`, core `#673de6`) + deep charcoal (`ink-*`) + amber accent. Typography: DM Sans. Patterns: dark sticky nav with user profile + bell, gradient text, dark sections with glow orbs, rounded-2xl cards, chip badges, purple "Sponsored" ad badges, discount `-X% OFF` badges, "Bayan Official" badge. Full token/component spec: `uiux/design-system.md`.

### 9.1 Brand Logo — "Habi Knot" (v3.1)

The official mark is the **Habi Knot** (*Habing Bayan* — the weave of the town): three interwoven community strands (merchant → rider → customer) forming a hexagonal town node with an amber **suki eye** at the center — deliberately **not a box** (no packaging connotation). Assets in `logo/`:

| Asset | Purpose |
|---|---|
| `logo/bayan-icon.svg` | Mark only, full-color (purple `#673de6` diagonals, ink `#12111d` vertical, amber eye `#f59e0b`) — favicon/app-icon core |
| `logo/bayan-icon-white.svg` | White mark (dark surfaces) |
| `logo/bayan-logo.svg` / `bayan-logo-white.svg` | Full-color / white marks (replace legacy `beboolbox-logo.png`) |
| `logo/bayan-lockup.svg` | Horizontal icon + wordmark |
| `logo/bayan-tile.svg` (+ `bayan-tile-512.png`/`192.png`) | App-icon tile (purple gradient squircle + white mark), PWA install icons |
| `logo/bayan-mark-64x64.png` | dompdf-safe PNG used in the referral poster |
| `logo/logo-concept.md`, `brand-guidelines.md`, `logo-integration.md`, `conversion-guide.md` | Concept, usage rules, integration checklist, SVG→PNG conversion guide |
| `frontend/scripts/render_logo_png.py` | Supersampled Pillow renderer used to generate the PNGs (no native cairo needed) |

**Placement**: Shell header = `bayan-icon-white.svg` at `h-8` on the dark `ink-900` bar; Auth login = `bayan-logo-white.svg` at `h-14` on the purple gradient; HomepageV2 footer = `bayan-icon.svg`; `favicon.svg` = Habi Knot primary mark; PWA manifest icons = `bayan-tile-192/512.png` (purple tile, `background_color #12111d` splash); referral poster PDF = `bayan-mark-64x64.png` base64 (dompdf-safe). Legacy `beboolbox-logo.png` / `beboolbox-logo-1.png` are **deleted** from `frontend/public/`.

---

## 10. Key Routes Overview

**Public** (no login): `/`, `/search`, `/product/:id`, `/store/:id`, `/providers`, `/hire/:id`, `/login`.

**Auth** (any logged-in user): `/cart`, `/orders`, `/bookings`, `/affiliate`, `/referral`, `/track/:tracking`, `/delivery-cost`, `/suki`, `/points-shop`, `/hub`, `/hub/inventory`, `/rider`, `/rider/wallet`, `/rider/deliveries`, `/rider/dashboard`, `/customer/profile`, `/rider/profile`, `/staff/mall`, `/staff/dispatch`, `/staff/dashboard`, `/merchant/*` (products, orders, ads, dashboard, reports, settings/payouts, **profile**), `/provider/*` (profile, jobs), `/admin/*` (dashboard, merchants, merchant-list, mall, riders, affiliates, banners, ads, settings).

**Backend** (new in v3): `GET /api/profile` + `PUT /api/profile` (customer/rider/provider), `GET|PUT /api/merchant/profile` (with lat/lng), `GET /api/affiliate/earnings` (adds `pending`), `GET /api/admin/finance`, `GET /api/staff/finance`, `POST /api/staff/finance/remit`.  
**Backend** (new in v3.1): `GET /api/products/category-images` (one hero image per category for the homepage rail).

---

## 11. AI Agent Tooling & Design Deliverables (v3.1)

The repo ships a lightweight **agent tooling** layer — declarative role prompts in `frontend/agent.yaml` that drive AI sub-agents (deepseek-chat) for content/design. Each agent reads the PRD + `RULES-PER-ACCOUNT.md` and writes its deliverables to a dedicated folder. **This is documentation/tooling only — no runtime impact on the app.**

### 11.1 Agents (`frontend/agent.yaml`)

| Agent | Role | Reads | Writes to |
|---|---|---|---|
| `marketing_agent` | Marketing Lead | PRD, rules | `marketing/` |
| `sales_agent` | Sales Executive | PRD, rules, marketing | `sales/` |
| `uiux_agent` | UI/UX Designer | PRD, rules, Shell.jsx, Marketplace.jsx | `uiux/` |
| `logo_agent` | Logo & Graphic Designer | PRD §9, design-system, ui-audit | `logo/` |

### 11.2 Deliverables (living docs — latest state)

**`marketing/`**
- `homepage-content-strategy.md` — the 12-block homepage copy/offer strategy that drove `HomepageV2` (Barangay Flash Sale, Fiesta Countdown, Suki Surprise, Kapit-Bahay Rewards, price-anchoring in real pesos, "Sariwa, hindi naka-box" line, copyright-distinctness guardrails).
- `branding-positioning-ideas.md` — rename rationale (drop "Box"), positioning reframe, pillars. Status: ✅ adopted.
- `blog-announcement.md`, `LandingPage.jsx` (standalone concept page).

**`sales/`**
- `pitch-deck-outline.md`, `cold-email-sequence.md`.

**`uiux/`**
- `design-system.md` — full tokens + component inventory + a11y/PWA rules.
- `wireframes.md` — 5 labeled ASCII wireframes (storefront, checkout, merchant dashboard, rider map, admin finance).
- `ui-audit.md` — 15 prioritized issues (8 P0/P1) with file-level fixes.
- `homepage-layout-wireframe.md`, `homepage-layout-jsx.md` — the HomepageV2 layout spec + React skeleton (integrated).
- `category-images-recommendation.md` — the 3-phase plan that guided the `/products/category-images` backend endpoint + frontend resolver.
- `logo-review-brief.md` — UI/UX acceptance criteria + placement specs for the Habi Knot logo.

**`logo/`**
- `logo-concept.md` — Habi Knot concept (weave/knot, palette, 4 inline SVGs).
- `brand-guidelines.md`, `logo-integration.md` (swap checklist), `conversion-guide.md` (SVG→PNG).
- SVG/PNG assets: `bayan-icon.svg`, `bayan-icon-white.svg`, `bayan-logo*.svg`, `bayan-lockup.svg`, `bayan-tile.svg`, `bayan-tile-512.png`, `bayan-tile-192.png`, `bayan-mark-64x64.png`, `bayan-icon-32.png`.

**Root**
- `DEMO-ACCOUNTS.txt` — quick reference for all 22 seeded demo accounts (password `Password123!`).
- `frontend/scripts/render_logo_png.py` — supersampled Pillow renderer for the Habi Knot PNGs.

---

## 12. Change Log (v2 → v3 → v3.1)

### v3.1 (this revision — reconciled with working system)

- **Homepage redesign**: `/` now serves `HomepageV2` (dense deal-driven storefront — hero carousel, midnight flash-deal countdown, category rail with real product photos, flash-sale grid, price-anchored product grid, trust strip). `MarketplaceHome.jsx` retained but no longer the `/` route for customers.
- **Category images**: new `GET /api/products/category-images` endpoint (one hero image per category, official-mall first → newest) + `HomepageV2` resolver (endpoint → client scan fallback → curated/emoji), broken-URL images fall back to emoji, `loading="lazy"` below the fold.
- **Habi Knot brand system**: new logo + full asset set in `logo/`; applied to `favicon.svg`, Shell header (white mark), Auth login (white lockup + new tagline), HomepageV2 footer, PWA manifest icons/tiles (`bayan-tile-192/512.png`, `#673de6` theme, `#12111d` background), referral poster PDF (purple brand, PNG logo, no "Box"), and Open Graph tags in `index.html`. Legacy `beboolbox-logo*.png` deleted.
- **AI agent tooling + deliverables**: `frontend/agent.yaml` now defines 4 agents; `marketing/`, `sales/`, `uiux/`, `logo/` hold the generated deliverables (see §11).
- **Docs**: `RULES-PER-ACCOUNT.md` and README updated for the Bayan rename.

### v2 → v3

- **Earnings traceability**: affiliate earnings endpoint now returns income sources + ledger + pending; seeded ledger income for demo customer/rider/merchant.
- **Commission hold/vesting**: `pending_affiliate_commissions` + `affiliate:release-commissions` scheduled command (default 72h); cancellations void pending holds.
- **Financial settlement**: `AdminFinanceController` (overview), `StaffFinanceController` (summary + remit), `rider_cod_remittances` table.
- **Fixed coordinates**: `users.latitude/longitude`; shared `/api/profile` + merchant profile lat/lng; customer/rider/provider/merchant profile pages with GPS + manual entry.
- **Merchant-origin delivery**: distance & fee now computed merchant store → customer (frontend OSRM estimate + backend `resolveDoorstepShipping` via `merchantOriginFor`), cart response includes merchant lat/lng.
- **Service-area cap**: `marketplace.max_delivery_km` (100) rejects out-of-range deliveries instead of runaway fees; enforced frontend + backend.
- **Rider delivery map**: `/rider/deliveries` + `/rider/dashboard` render merchant→customer route with `merchant` lat/lng attached by the controllers.
- **Geocoding**: Nominatim progressive fallback + map click-to-pick + default-coords warning.
- **MapLibre Vite fix**: `optimizeDeps.exclude: ['maplibre-gl']` + `worker.format: 'es'`.
- **Bug fixes**: reset demo passwords to `Password123!`; removed non-existent `users.address` from eager loads (SQLSTATE 42703); rider deliveries data now returned correctly.
