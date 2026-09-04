# HABI — Habing ng Bayan
## Product Requirements Document v1.1

> *"HABI" — to weave. Habing ng Bayan: weaving the nation's local merchants, riders, and workers into one community marketplace.*

> **Status**: Updated as of 2026-09-04 (based on working code)  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite PWA) + PostgreSQL 16 + Redis queue  
> **Branding note**: the product brand is **HABI** (UI, manifest, og tags); legacy identifiers remain `bayanbox` (package names, `config/bayanbox.php`, localStorage keys `bayanbox_*`, Tailwind `bayan-*` palette, offline DB `bayanbox_offline`).

---

## 1. Product Overview

**HABI — Habing ng Bayan** is a provincial "phygital" (physical + digital) platform that weaves together local micro-merchants (MSMEs), community hubs (sari-sari stores), delivery riders, skilled workers, customers, and affiliates into one connected ecosystem.

### 1.1 Core Value Propositions

| # | Pillar | Description |
|---|---|---|
| 1 | **Local E-Commerce Marketplace** | Merchants list products; customers browse a category-driven storefront, search, and checkout with GCash/Maya/COD or affiliate earnings. |
| 2 | **B2B Packaging Marketplace** | Merchants buy packing supplies at bulk rates using Suki Points or cash (`packaging_items`/`packaging_redemptions`). |
| 3 | **HABI Mall** | Admin-owned flagship store (official provincial goods); 100% of sales route to `admin_earnings`. |
| 4 | **Product Advertising** | Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impression & click tracking. |
| 5 | **Last-Mile Delivery** | Dynamic per-km fees (OSRM road distance), round-robin rider assignment, rider refusal with auto-reassignment, GPS telemetry + live tracking + ETA. |
| 6 | **Suki Points Loyalty** | Points earned on purchases/reviews; a dedicated Points Shop of points-only items. |
| 7 | **Affiliate Program** | Referral codes + QR for Customer/Merchant/Rider/Provider; commissions, ID verification, cash-outs (staff excluded). |
| 8 | **Skilled Worker Marketplace** | Verified providers, bookings with two-party completion (confirm/rework), reviews, official badges. |
| 9 | **Order Lifecycle State Machine** | 10-state delivery lifecycle with role-based transitions, auto-cancel timers, rider reassignment, and proof-of-delivery. |
| 10 | **Merchant Operations** | Dashboard, order management, sales reports, payout methods, and wallet withdrawals. |
| 11 | **Multi-Party Escrow Ledger** | Double-entry wallets: every payment flows in through a sales-escrow wallet and out via linked transfers. |
| 12 | **Pabili (Buy-For-Me)** | Customers request up to 15 off-catalog items; staff quotes each line; an approved request becomes a real COD order. |
| 13 | **Hub Network & Resilience** | Sari-sari hub parcel intake with OTP release, offline request queue (worker-fielded), and maintenance-mode gate. |

### 1.2 Success Criteria
- Order gross reconciles 100% to ledger disbursements (merchant + platform + affiliate = item sales).
- Zero negative wallet balances; every wallet balance traceable via ledger.
- COD payouts deferred until cash is collected at delivery; staff track rider COD cash via remittances.
- Refunds reverse all payouts through the escrow pool.

---

## 2. Architecture

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2), Sanctum token auth (24h) |
| Database | PostgreSQL 16 (mandatory — `ilike` usage), Redis queues |
| Queue Workers | `queue:work redis` via templated systemd `habi-queue@.service` |
| Frontend | React 18 (Vite + PWA), Tailwind CSS (purple/charcoal theme, DM Sans) |
| Maps & Routing | MapLibre GL JS + OSM raster tiles (Mapbox tiles cached at runtime too); OSRM (road distance); Nominatim (address geocoding); Turf.js (Haversine) |
| Images | GD optimization (≤1200px, JPEG 82%) via `POST /api/upload` |
| SMS | Semaphore API for **hub parcel OTP release only**; password-reset OTP is logged, not sent (no gateway wired). No sms/OTP web routes — OTP verifies inside flows. |
| Scheduled Jobs | `orders:process-lifecycle` every minute (auto-cancel stale pending + reassign stalled riders); dev-only `orders:simulate-gps` (never scheduled in prod) |
| Error Reporting | PWA `ErrorBoundary` + POST `/api/errors/report` server log |

### 2.1 PWA
- `registerType: autoUpdate`; Workbox precache of built assets.
- Manifest icons: `bayan-tile-32/192/512.png` (+ 512 maskable); theme_color `#673de6`, background `#12111d`, `display: fullscreen`. Browser-tab favicon: `bayan-tile-32.png`.
- **Known gap**: `index.html` meta `theme-color` is still `#0f766e` (teal) — conflicts with the manifest violet.
- Demo login gate: public homepage; add-to-cart triggers login.
- **Subfolder deploys**: build with `VITE_BASE=/habi/` (start_url/scope derive from it).

### 2.2 Deployment Topologies (`deploy/`)
- **VPS** (`becoolbox.app`): nginx, `/var/www/habi`, same-origin `/api`, health check `/up`, systemd queue workers, cron scheduler.
- **Shared panel host** (DirectAdmin/cPanel): `https://host/habi/` subfolder with `.htaccess` (Laravel front controller for `/habi/api`, SPA fallback), backend outside `htdocs`, `storage` symlink.
- App updates: rebuild with `VITE_BASE`, upload `dist/*`; autoUpdate SW picks up next visit.

---

## 3. Role Definitions

| Role | Capabilities | Bottom Nav (actual, ≤7 tabs) |
|---|---|---|
| **Admin** | Dashboard, merchant/rider/affiliate management, settings, mall, ads, banners, dispatch oversight, finance | Dashboard, Merchants, Riders, Banners, Settings, Ads, Finance |
| **Staff** | Ops dashboard ("Things to Do"), dispatch center, hub/parcel scan + inventory, delivery history, mall inventory, finance/COD remittance, hazard toggles | Dashboard, Scan, Inventory, Dispatch, Mall, Mall Orders, Finance |
| **Rider** | Dashboard (active orders + earnings), batch routes, deliveries (accept/refuse/history), wallet, profile | Dashboard, Route, Deliveries, Wallet, Affiliate, Profile |
| **Merchant** | Dashboard, orders (state machine), products, ads, reports, payouts, affiliate, profile | Dashboard, Affiliate, Cart, Ads, Orders, Profile |
| **Customer** | Marketplace home, search, **Pabili**, cart, orders/tracking, points shop, bookings, profile | Shop, Pabili, Cart, Orders, Points, Bookings, Profile |
| **Provider** | Directory profile, jobs (accept → done → confirm/rework), skills/picture/badge, affiliate | Shop, Profile, Jobs, Affiliate, Delivery |

**Access rules**: Staff cannot participate in the personal affiliate program (403). Admin/Staff retain oversight of cash-outs, merchant approvals, and Pabili quoting. Header chrome includes a demo-mode role switcher ("Demo" badge) and an online/offline pill with queued-request count.

---

## 4. Modules

### 4.1 Authentication & Registration
- `POST /auth/register` — merchants default `pending_verification`; capture DTI/SEC, gov ID, business permit, photo, message.
- `POST /auth/login` — phone + password → Sanctum token (24h expiration).
- Forgot/reset password: OTP stored in `password_otps` and **logged only** (no SMS gateway on this build).
- **Rate limiting**: login 5/min per phone, 20/min per IP, 30/hr per IP; register 3/hour; Pabili create 10/min.

### 4.2 Merchant Verification Workflow
- Admin approves (activates + wallet + SMS + notification) or rejects (with reason).
- Pending merchants cannot create products (403).
- Merchant self-service document management via `/merchant/profile`.
- Merchant dashboard renders Verified and "● Open" badges from `store.status === 'active'` (mobile-safe: truncating name, non-shrinking pills).

### 4.3 Merchant Payout Methods (`/merchant/settings/payouts`)
- CRUD `/api/merchant/payouts`; receiving accounts: **💙 GCash**, **💚 Maya** (mobile), **🏦 Bank Transfer** (10 PH banks, account number, branch).
- Primary/default account; masked numbers (`•••• 5678`); copy button.
- Cash-out requests **require** a saved payout account (`payout_account_id`).

### 4.4 Marketplace Home (`/`)
- Category icon grid (Fresh Produce, Local Crafts, Packaging, Home Cooks, Points Shop, Provincial Goods) → category-filtered search (`/marketplace/category/:slug`).
- Admin banner carousel (clickable, internal/external links) + "🔥 On Sale Deals" carousel (discount badges, snap scrolling, nav arrows).
- Points Shop + Skilled Workers quick links; tappable search bar → `/search`.

### 4.5 Search Page (`/search`)
- Sticky auto-focus search; recent + trending suggestions.
- Faceted filters: category, city, price range, on-sale-only, in-stock.
- Sorting: relevance, most reviewed, top sales, price asc/desc.
- Infinite scroll + Load More; top "⭐ Sponsored Items" carousel; empty state with category suggestions.

### 4.6 Merchant Storefront (`/store/:id`)
- Header: banner, logo, verified badge, rating, product count; Follow Store + Contact buttons; stats (rating, units sold, response time, fulfillment rate).
- In-store search with suggestions; category tabs (All / Best Sellers / New Arrivals / On Sale); sidebar filters (price range, min rating, in-stock).
- Product grid (4-col desktop / 2-col mobile) with infinite scroll and empty-state reset.
- Tabs: About & Policies (shipping, returns, location, background) + Store Reviews (aggregated product reviews).

### 4.7 Products (Merchant CRUD)
- Fields: name, unit, description, category (fixed select), price, sale price + On Sale toggle, stock, low-stock threshold, Suki award, affiliate %, availability, status (active/draft/archived), main image + gallery upload.
- Endpoints: `/api/merchant/products` (GET/POST/PUT/DELETE).

### 4.8 HABI Mall (Admin-Owned)
- `is_official_mall` products with "Official" badge, pinned to storefront top; public `/mall` page; staff inventory + mall-orders views.
- Financials: 100% of retail → `admin_earnings`, 0% commission.
- Admin CRUD with image upload + gallery.

### 4.9 Cart & Checkout (`/cart`)
- Auto-synced server cart (authoritative sync removes absent rows).
- Delivery address auto-geocoding (Nominatim) → auto-fills lat/lng → OSRM road distance → **dynamic fee: ₱40 base (first 2 km) + ₱10/km**; route preview map (`/delivery-cost`).
- Payment methods: GCash / Maya / **COD** / affiliate earnings.
- Points-only items paid exclusively with Suki Points.
- Click-and-collect: `ready_for_pickup → delivered` direct transition (`confirm_collection`); 4-digit **order PIN** (`generate-pin`) for doorstep handoff alongside POD photo.

### 4.10 Order Lifecycle State Machine
**States** (note: the `raider_*` token spelling is intentional in code; UI renders "Rider"): `pending_merchant, preparing, ready_for_pickup, raider_assigned, raider_en_route_to_merchant, at_merchant, in_transit, arrived, delivered, cancelled`. Legacy `status`/`fulfillment_status` fields mirrored for UI compatibility.

| Transition | Actor | Notes |
|---|---|---|
| accept | Merchant | `pending_merchant → preparing` |
| reject | Merchant | `→ cancelled` (reason) |
| mark_ready | Merchant | `preparing → ready_for_pickup` |
| assign_raider | Staff/Admin | `ready_for_pickup → raider_assigned` (auto/manual, records dispatch_method) |
| accept_job | Rider | `ready_for_pickup → raider_assigned` |
| depart_to_merchant / arrive_merchant / pickup_order (arrive_customer) | Rider | Route progression |
| complete_delivery | Rider | `→ delivered`; **requires POD photo** (PIN available as handoff credential) |
| confirm_collection | Staff/Admin | `ready_for_pickup → delivered` (click-and-collect) |
| cancel | Customer | **only at `pending_merchant`**, with reason |
| force_cancel / override / force-status | Staff/Admin | Any state |

**Cancellation policy (three tiers)**
1. **Customer**: cancel own order only while `pending_merchant` (`CancelOrderButton.jsx`).
2. **Merchant**: **no cancel path** — UI routes to support ("Order cancellation is handled by support"); legacy status endpoint only advances forward.
3. **Staff/Admin**: force-cancel/override + support-ticket resolution (`refunded` / `redelivery` / `dismissed`).

On cancel: affiliate commissions voided; `WalletService::refundOrder` reverses payouts into escrow. `orders:process-lifecycle` auto-cancels stale pending orders and returns refused/stalled (5 min) rider jobs to the pool. Ownership validation: merchants only their orders, riders only assigned, customers only their own.

### 4.11 Escrow Cash Flow
1. **Inflow**: customer payment credited to a `sales_escrow` wallet (`sales_receipt`).
2. **Outflow**: every split is a **linked transfer** from escrow (merchant, platform, affiliate, admin, rider, hub).
3. **COD deferral**: payouts release only when the rider marks delivery (cash collected).
4. **Refunds**: `WalletService::refundOrder` reverses recipient payouts back into escrow (ticket `refunded` action, cancellation, reject).
5. **COD cash custody**: staff record **rider COD remittances** (`rider_cod_remittances`) via `/staff/finance/remit`.

### 4.12 Delivery Assignment, Dispatch & Tracking
- Round-robin assignment (fewest active deliveries) or manual staff assignment (records `dispatch_method` + `assigned_by_id`).
- Rider refusal returns order to pool; stalled riders (5 min) auto-reassigned by scheduler; `raider_assigned` can revert to `ready_for_pickup`.
- Staff dispatch center: ready orders, rider workload, MapLibre map, auto/manual assign; status board + audit modal.
- **Live tracking**: `POST /rider/telemetry` → `rider_locations`; track endpoints (public `/track/{tracking}`, `/orders/:id/track`) with 15-min staleness cutoff; GPS exposed only during active states; `heading_to` + buffered ETA (25 km/h × `eta.buffer_multiplier` 1.30, ±7 min spread).
- **Rider batch routes** + delivery history; **rider emergency** button files `incident_reports` and alerts staff.
- **Delivery History tab**: searchable table (order/customer/merchant/rider), date-range + status filters, per-page control, CSV export, full **audit modal** (lifecycle timestamps, proof of delivery, dispatch method, customer feedback).

### 4.13 Product Reviews & Related Products
- Verified-buyer reviews (1 per user+product); behavioral related products (purchase co-occurrence ×3, view co-occurrence, category fallback); view tracking on product detail.

### 4.14 Points Shop
- `points_only` products with `points_price`; redeemed exclusively by burning Suki Points; balance + insufficient-points guards; public `/points-shop`.

### 4.15 Product Advertising
- Campaign types with daily rates: Sponsored ₱50, Homepage Featured ₱100, Flash Deal ₱30 (configurable).
- Wallet or Suki Points payment; analytics (impressions/clicks/orders); pause/resume.
- Marketplace injection: sponsored badges, featured carousel, impression on render + click on tap.
- Admin oversight: tabs (Product Ads / Home Slide Ads), counters, edit modal (image + size guidance), pause/stop, grant credits.

### 4.16 Loyalty (Suki Points)
- Earn: purchase rewards (per-product), review rewards (+5), pickup rewards, provider-job reviews (+5 incentive).
- Spend: packaging redemption (incl. doorstep upgrade), Points Shop purchases.
- Ledger: `loyalty_points` with `balance_after`; customer `/suki` earn/spend view; promo codes (`promo_codes`, `promo_redemptions`).

### 4.17 Affiliate Program (Customer/Merchant/Rider/Provider; **Staff 403**)
- Referral code + QR: hub poster endpoint `GET /hub/affiliate/referral-qr[/poster]` (QR rendered via `api.qrserver.com`, PDF download); code links `/r/CODE` redirect to `/login?ref=CODE`; registration pre-fills code; `referred_by_id` auto-credits referrers at checkout.
- Earnings ledger with **income sources** breakdown; document (ID) upload for admin **activation**; earning allowed pre-activation but **cash-out gated** until activated (min ₱200/₱500 configurable).
- Cancel/reject voids pending affiliate commissions.
- Admin: searchable list with role badges, documents, activation, cash-out approve/decline (`/affiliate` customer view, `/referral`).

### 4.18 Pabili — Buy-For-Me (Customer ↔ Staff Quote Flow)
- Customer submits up to **15 free-text items** (`POST /pabili`, throttle 10/min) for goods not in the catalog.
- Staff quote **every line + shipping** (`/staff/ops/pabili/{id}/quote`; all lines required) → customer **approves / declines / cancels** (cancel only pre-quote; decline clears quoted prices).
- On approval a **real COD order** is created in state `preparing` riding on a hidden admin-owned catalog product (`status: inactive`, `is_official_mall: true`, zero affiliate/Suki) so it never appears in browse/search.
- Statuses: `pending → quoted → approved/declined → converted` (+ `cancelled`); staff notified per event. Tables: `pabili_requests`, `pabili_items`. Routes: `/pabili` customer, `/staff/ops/pabili*`.

### 4.19 Hub Parcels & Offline Operation
- Staff **Scan/Inventory** hub workflow: parcel intake, status history, **OTP release** (`/hub/parcels/{tracking}/release|reconcile`) with Semaphore SMS.
- **Offline queue (PWA)**: mutations buffered in IndexedDB (`bayanbox_offline`, cap 1,000); auto-flush on `online` event to the single endpoint `POST /api/sync/offline-queue`, which replays `scan_intake | telemetry | status_update | delivery_confirmation` (max 200/batch). Header pill shows queue count.

### 4.20 Notifications
- Bell with unread badge (30s polling) + dropdown; triggers: merchant new order/approved/rejected, admin new applicant/document, rider emergency, fulfillment updates, affiliate activation, Pabili events.
- **Chime** (`habi-sounds.mp3` via `lib/sound.js`): plays only when unread count *increases*; mobile autoplay unlocked on first gesture; ON/OFF toggle persisted (`bayanbox_sound`).

### 4.21 Skilled Worker Bookings
- Public directory (`/providers`) with search/skill/availability filters, sorting (top rated/viewed/closest/rate), grid/list toggle; profile view tracking.
- Hire flow (`/hire/:id`): service/date/address → booking.
- Lifecycle: pending → accepted → `provider_completed` → customer **confirm** (escrow release) or **rework**; provider jobs page (`/provider/jobs`).
- Customer bookings monitor (`/bookings`) with status timeline; provider reviews; official badge.

### 4.22 Merchant Analytics
- Dashboard: store status badges (name truncation-safe on mobile), KPIs (month/lifetime revenue, pending orders, units sold, wallet), pending-orders queue (accept, cancel routed to support), low-stock alerts, quick links (Products/Profile/Reports/Payouts/Affiliate).
- Reports (`/merchant/reports`): date filter (today/7d/month/custom), daily revenue trend, best sellers (units/revenue sort), wallet + withdrawal history, cash-out.

### 4.23 Maintenance Mode
- `ensure.maintenance` middleware returns 503 page (`/maintenance`) for guests/customers; admin/staff bypass; toggle in Admin Settings. Message: "Habi is undergoing emergency maintenance."

### 4.24 Admin Settings (`/admin/settings`)
- 5 tabs: Categories (CRUD + delete safety lock), Fees & Rates, Ad Pricing, Service Locations (default MapLibre center + zones), System Toggles (maintenance mode, merchant registration).
- Stored in `system_settings` key-value table; sticky save bar with toast.

### 4.25 Admin Dashboard (`/admin/dashboard`) & Finance
- Financial (revenue/GMV/orders/AOV), users (customers/merchants/riders/providers/affiliates/pending), affiliate summary, order status breakdown, mall/inventory analytics.
- `/admin/finance`, `/staff/finance`: payout/cash-out oversight incl. rider COD remittance ledger; `/staff/ops/*` incidents, tickets, hazards, force-status.

### 4.26 Provider & Merchant Wallet Cash-Outs
- Merchant withdrawals (`merchant_earnings`), provider earnings and affiliate withdrawals (`affiliate_payout`) share the cash-out table (`wallet_type` column) — admin approves with transfer reference + payout account, marking `paid` (wallet debited).

---

## 5. Financial Split Rules (Audited)

| Scenario | Split | Status |
|---|---|---|
| Regular sale | Merchant 90% − affiliate / Platform 10% / Affiliate % | ✅ reconciles 100% |
| Mall sale | Admin 100% − affiliate | ✅ |
| Pabili sale | Rides hidden Mall product (admin 100%, 0 affiliate/Suki) | ✅ |
| Delivery fee | Rider 85% / Platform 15% | ✅ (₱209.95/₱247 = 85%) |
| Pickup fee ₱10 | Hub ₱5 / Platform ₱5 | ✅ |
| Booking | Provider payout + Platform commission = quoted | ✅ (₱3,240 + ₱460 = ₱3,700) |
| COD | Payouts deferred to delivery; rider cash tracked via remittances | ✅ |
| Refund | Reversal into escrow (ticket/cancel/reject) | ✅ |
| Escrow | Inflow (sales_receipt) → outflow (linked transfers) | ✅ |

**Wallet types** (`Wallet` constants): `sales_escrow`, `merchant_earnings`, `platform_earnings`, `admin_earnings`, `affiliate_payout`, `provider_earnings`, `rider_prepaid`.

---

## 6. Database Schema

**Core**: `users` (roles, affiliate status/docs, merchant verification), `provider_profiles`, `service_categories`, `hubs`, `delivery_rate_settings`, `parcels`, `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels`, `rider_locations`, `addresses`, `bookings`, `wallets`, `ledger_transactions`, `notifications`, `system_settings`, `categories`, `password_otps`.

**Marketplace**: `products` (unit, low-stock threshold, sale price, points-only), `product_images`, `product_views`, `product_reviews`, `cart_items`, `orders` (delivery_state, PIN, POD photo, timestamps, dispatch audit), `order_items`, `merchant_payout_accounts`, `affiliate_cash_outs` (wallet_type, payout account, reference), `ad_campaigns`, `banners`, `rider_cod_remittances`, `incident_reports`, `support_tickets`, `packaging_items`, `packaging_redemptions`, `loyalty_points`, `promo_codes`, `promo_redemptions`.

**Pabili**: `pabili_requests`, `pabili_items` (per-line quotes, status machine, hidden-product conversion).

---

## 7. Demo Users

**Default `php artisan db:seed` (DatabaseSeeder / `bayanbox:demo`)**: ~10 users roles 001–010, admin **`09170000001`**, shared password **`password`**. ⚠️ Must be changed/deleted before going live (deploy README §9).

**MasterSeeder** (dev-only, `php artisan db:seed --class='Database\Seeders\MasterSeeder'`): password **`Password123!`**

| Role | Email | Phone |
|---|---|---|
| Admin | admin@becoolbox.com | 09170000001 |
| Staff | staff@becoolbox.com | 09170000002 |
| Rider | rider1@becoolbox.com | 09170000003 |
| Merchant (verified) | merchant1@becoolbox.com | 09170000004 |
| Customer (cart + points) | customer1@becoolbox.com | 09170000005 |
| Customer | customer2@becoolbox.com | 09170000006 |
| Merchant (pending) | merchant2@becoolbox.com | 09170000007 |
| Affiliate (pending cash-out) | affiliate1@becoolbox.com | 09170000008 |

Plus 28 products, 6 orders (all statuses), 4 ad campaigns, 3 banners, 3 cash-outs, low-stock items, and 1–5 reviews per product. Idempotent (clears prior test data on re-run). Frontend also ships a demo-mode role switcher in the header.

---

## 8. Execution

```bash
# Backend (local dev)
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed            # demo users w/ password "password"
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000

# Frontend (local dev)
cd frontend
npm install
npm run dev                    # http://localhost:3000 (proxies /api, /storage → :8000)

# Production build (subfolder target)
$env:VITE_BASE = "/habi/"      # or leave default "/" for VPS root
npm run build
```

**Environment**: `APP_URL` auto-detects live (`becoolbox.app` → debug off, CORS restricted) vs local (debug on, CORS open to Vite origins). `SEMAPHORE_API_KEY` optional. GD enabled. PostgreSQL `trust` auth locally; Postgres mandatory on shared hosts (no MySQL: `ilike`).

---

## 9. Design System

Colors: purple brand (`bayan-*`, core `#673de6`) + charcoal (`ink-*`) + amber accent. Font: DM Sans. App icon: purple gradient squircle tile (`bayan-tile-*.png`, white knot mark + amber eye). Patterns: dark sticky nav (logo, offline pill, user, bell), gradient text, dark-section headers with glow orbs and status pills (truncation-safe on mobile), rounded-2xl cards, chip badges, purple "Sponsored" / red "-X% OFF" badges, skeleton loaders, bottom nav (up to 7 tabs per role).

---

## 10. Key Routes

**Public**: `/`, `/search`, `/mall`, `/product/:id`, `/marketplace/category/:slug`, `/providers`, `/hire/:id`, `/store/:id`, `/login`, `/track/:tracking`, `/r/:code`, `/points-shop` (login-gated checkout), `/maintenance`.

**Auth**: `/cart`, `/orders`, `/orders/:id/track`, `/bookings`, `/suki`, `/pabili`, `/affiliate`, `/referral`, `/delivery-cost`, `/merchant/*` (dashboard, orders, products, ads, reports, profile, settings/payouts), `/provider/*` (profile, jobs), `/rider/*` (dashboard, deliveries, route, wallet, profile), `/hub` + `/hub/inventory` (staff), `/staff/*` (dashboard, dispatch, mall, mall/orders, finance, ops), `/admin/*` (dashboard, merchant-list, merchants, riders, affiliates, ads, banners, mall, finance, settings).

**API surface** (`/api`): `auth/*`, public products/storefront/banners/ads/`track/{tracking}`/`r/{code}`, `errors/report`, `upload`, `sync/offline-queue`, affiliate module, notifications, bookings, order state machine, cart/checkout, `merchant/*` (products, orders, ads, dashboard, reports, payouts, returns, profile, wallet), `hub/*` (parcels, intakes, otp release, affiliate QR), `staff/*` (ops: dispatch, incidents, tickets, hazards, pabili, force-status, finance/remit; mall), `admin/*` (banners, settings, categories, ads, merchants, riders, mall, promos, affiliates, finance), `rider/*` (telemetry, batches, deliveries, dashboard, emergency), `provider/*` (profile, jobs, bookings).
