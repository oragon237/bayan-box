# HABI — Habing ng Bayan
## Product Requirements Document v1.0

> *"HABI" — to weave. Habing ng Bayan: weaving the nation's local merchants, riders, and workers into one community marketplace.*

> **Status**: Implemented as of 2026-09-01 (based on working code)  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite PWA) + PostgreSQL 16

---

## 1. Product Overview

**HABI — Habing ng Bayan** is a provincial "phygital" (physical + digital) platform that weaves together local micro-merchants (MSMEs), community hubs (sari-sari stores), delivery riders, skilled workers, customers, and affiliates into one connected ecosystem.

### 1.1 Core Value Propositions

| # | Pillar | Description |
|---|---|---|
| 1 | **Local E-Commerce Marketplace** | Merchants list products; customers browse a category-driven storefront, search, and checkout with GCash/Maya/COD or affiliate earnings. |
| 2 | **B2B Packaging Marketplace** | Merchants buy packing supplies at bulk rates using Suki Points or cash. |
| 3 | **HABI Mall** | Admin-owned flagship store (official provincial goods); 100% of sales route to `admin_earnings`. |
| 4 | **Product Advertising** | Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impression & click tracking. |
| 5 | **Last-Mile Delivery** | Dynamic per-km fees (OSRM road distance), round-robin rider assignment, rider refusal with auto-reassignment. |
| 6 | **Suki Points Loyalty** | Points earned on purchases/reviews; a dedicated Points Shop of points-only items. |
| 7 | **Affiliate Program** | Referral codes + QR for Customer/Merchant/Rider/Provider; commissions, ID verification, cash-outs (staff excluded). |
| 8 | **Skilled Worker Marketplace** | Verified providers, bookings with two-party completion (confirm/rework), reviews, official badges. |
| 9 | **Order Lifecycle State Machine** | 10-state delivery lifecycle with role-based transitions, auto-cancel timers, rider reassignment, and proof-of-delivery. |
| 10 | **Merchant Operations** | Dashboard, order management, sales reports, payout methods, and wallet withdrawals. |
| 11 | **Multi-Party Escrow Ledger** | Double-entry wallets: every payment flows in through a sales-escrow wallet and out via linked transfers. |

### 1.2 Success Criteria
- Order gross reconciles 100% to ledger disbursements (merchant + platform + affiliate = item sales).
- Zero negative wallet balances; every wallet balance traceable via ledger.
- COD payouts deferred until cash is collected at delivery.
- Refunds reverse all payouts through the escrow pool.

---

## 2. Architecture

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2), Sanctum token auth |
| Database | PostgreSQL 16 |
| Frontend | React 18 (Vite + PWA), Tailwind CSS (purple/charcoal theme, DM Sans) |
| Maps & Routing | MapLibre GL JS + OSM raster tiles; OSRM (road distance); Nominatim (address geocoding); Turf.js (Haversine) |
| Images | GD optimization (≤1200px, JPEG 82%) via `POST /api/upload` |
| SMS | Semaphore API (optional, graceful fallback) |
| Scheduled Jobs | `orders:process-lifecycle` (auto-cancel + reassignment, every minute) |

### 2.1 PWA
- Fullscreen display; Workbox precache; public homepage (no login) with header login/signup; add-to-cart triggers login.

---

## 3. Role Definitions

| Role | Capabilities | Bottom Nav (first 5) |
|---|---|---|
| **Admin** | Dashboard, merchant/rider/affiliate management, settings, mall, ads, banners, dispatch oversight | Dashboard, Merchants, Riders, Affiliates, Ads |
| **Staff** | Ops dashboard ("Things to Do"), dispatch center, delivery history, mall inventory, hazard toggles | Dashboard, Scan, Inventory, Dispatch, Mall |
| **Rider** | Dashboard (active orders + earnings), batch routes, deliveries (accept/refuse/history), wallet | Dashboard, Route, Deliveries, Wallet, Affiliate |
| **Merchant** | Dashboard, orders (state machine), products, ads, reports, payouts, affiliate | Dashboard, Affiliate, Cart, Ads, Orders |
| **Customer** | Marketplace home, search, cart, orders, points shop, bookings, affiliate | Shop, Cart, Affiliate, Orders, Points |
| **Provider** | Directory profile, jobs (accept → done → confirm/rework), skills/picture/badge, affiliate | Shop, Profile, Jobs, Affiliate, Delivery |

**Access rules**: Staff cannot participate in the personal affiliate program (403). Admin/Staff retain oversight of cash-outs and merchant approvals.

---

## 4. Modules

### 4.1 Authentication & Registration
- `POST /auth/register` — merchants default `pending_verification`; capture DTI/SEC, gov ID, business permit, photo, message.
- `POST /auth/login` — phone + password → Sanctum token (24h expiration).
- **Rate limiting**: login 5/min per phone, 20/min per IP, 30/hr per IP; register 3/hour.

### 4.2 Merchant Verification Workflow
- Admin approves (activates + wallet + SMS + notification) or rejects (with reason).
- Pending merchants cannot create products (403).
- Merchant self-service document management via `/merchant/profile`.

### 4.3 Merchant Payout Methods (`/merchant/settings/payouts`)
- Saved receiving accounts: **💙 GCash**, **💚 Maya** (mobile), **🏦 Bank Transfer** (10 PH banks, account number, branch).
- Primary/default account; masked numbers (`•••• 5678`); copy button.
- Cash-out requests **require** a saved payout account (`payout_account_id`).

### 4.4 Marketplace Home (`/`)
- Category icon grid (Fresh Produce, Local Crafts, Packaging, Home Cooks, Points Shop, Provincial Goods) → category-filtered search.
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
- `is_official_mall` products with "Official" badge, pinned to storefront top.
- Financials: 100% of retail → `admin_earnings`, 0% commission.
- Admin CRUD with image upload + gallery; staff inventory view.

### 4.9 Cart & Checkout (`/cart`)
- Auto-synced server cart (authoritative sync removes absent rows).
- Delivery address auto-geocoding (Nominatim) → auto-fills lat/lng → OSRM road distance → **dynamic fee: ₱40 base (first 2 km) + ₱10/km**; route preview map.
- Payment methods: GCash / Maya / **COD** / affiliate earnings.
- Points-only items paid exclusively with Suki Points.

### 4.10 Order Lifecycle State Machine
**States**: `pending_merchant → preparing → ready_for_pickup → raider_assigned → raider_en_route_to_merchant → at_merchant → in_transit → arrived → delivered` (+ `cancelled`).

| Transition | Actor | Notes |
|---|---|---|
| accept | Merchant | `pending_merchant → preparing` |
| reject | Merchant | `→ cancelled` (reason) |
| mark_ready | Merchant | `preparing → ready_for_pickup` |
| assign_raider | Staff/Admin | `ready_for_pickup → raider_assigned` (auto/manual) |
| accept_job | Rider | `ready_for_pickup → raider_assigned` |
| depart_to_merchant / arrive_merchant / pickup_order / arrive_customer | Rider | Route progression |
| complete_delivery | Rider | `→ delivered`; **requires proof** (PIN or photo) |
| cancel | Customer (only at `pending_merchant`) | With reason |
| force_cancel / override | Staff/Admin | Any state |

- Ownership validation: merchants act only on their orders; riders only on assigned orders; customers only cancel their own.
- Legacy `status`/`fulfillment_status` fields mirrored for UI compatibility.

### 4.11 Escrow Cash Flow (Fixes 1–3)
1. **Inflow**: customer payment credited to a `sales_escrow` wallet (`sales_receipt`).
2. **Outflow**: every split is a **linked transfer** from escrow (merchant, platform, affiliate, admin, rider, hub).
3. **COD deferral**: payouts release only when the rider marks delivery (cash collected).
4. **Refunds**: `WalletService::refundOrder` reverses recipient payouts back into escrow (ticket `refunded` action).

### 4.12 Delivery Assignment & Dispatch
- Round-robin assignment (fewest active deliveries) or manual staff assignment (records `dispatch_method` + `assigned_by_id`).
- Rider refusal returns the order to the pool; stalled riders (5 min) auto-reassigned by scheduler.
- Staff dispatch center: ready orders, rider workload, MapLibre map, auto/manual assign.
- **Delivery History tab**: searchable table (order/customer/merchant/rider), date-range + status filters, per-page control, CSV export, and a full **audit modal** (lifecycle timestamps, proof of delivery, dispatch method, customer feedback).

### 4.13 Product Reviews & Related Products
- Verified-buyer reviews (1 per user+product); behavioral related products (purchase co-occurrence ×3, view co-occurrence, category fallback); view tracking on product detail.

### 4.14 Points Shop
- `points_only` products with `points_price`; redeemed exclusively by burning Suki Points; balance + insufficient-points guards.

### 4.15 Product Advertising
- Campaign types with daily rates: Sponsored ₱50, Homepage Featured ₱100, Flash Deal ₱30 (configurable).
- Wallet or Suki Points payment; analytics (impressions/clicks/orders); pause/resume.
- Marketplace injection: sponsored badges, featured carousel, impression on render + click on tap.
- Admin oversight: tabs (Product Ads / Home Slide Ads), counters, edit modal (image + size guidance), pause/stop, grant credits.

### 4.16 Loyalty (Suki Points)
- Earn: purchase rewards (per-product), review rewards (+5), pickup rewards.
- Spend: packaging redemption, Points Shop purchases.
- Ledger: `loyalty_points` with `balance_after`.

### 4.17 Affiliate Program (Customer/Merchant/Rider/Provider; **Staff 403**)
- Referral code + QR (Nominatim-verified link `/login?ref=CODE`); registration pre-fills code; `referred_by_id` auto-credits referrers at checkout.
- Earnings ledger with **income sources** breakdown; document (ID) upload for admin **activation**; earning allowed pre-activation but **cash-out gated** until activated (min ₱200/₱500 configurable).
- Admin: searchable list with role badges, documents, activation, cash-out approve/decline.

### 4.18 Notifications
- Bell with unread badge (30s polling) + dropdown; triggers: merchant new order/approved/rejected, admin new applicant/document, rider emergency, fulfillment updates, affiliate activation.

### 4.19 Skilled Worker Bookings
- Public directory with search/skill/availability filters, sorting (top rated/viewed/closest/rate), grid/list toggle; profile view tracking.
- Hire flow (`/hire/:id`): service/date/address → booking.
- Lifecycle: pending → accepted → `provider_completed` → customer **confirm** (escrow release) or **rework**; provider jobs page.
- Customer bookings monitor with status timeline; provider reviews (+5 Suki incentive); official badge.

### 4.20 Merchant Analytics
- Dashboard: store status, KPIs (month/lifetime revenue, pending orders, units sold, wallet), pending-orders queue (accept/cancel), low-stock alerts.
- Reports: date filter (today/7d/month/custom), daily revenue trend, best sellers (units/revenue sort), wallet + withdrawal history, cash-out.

### 4.21 Admin Settings (`/admin/settings`)
- 5 tabs: Categories (CRUD + delete safety lock), Fees & Rates, Ad Pricing, Service Locations (default MapLibre center + zones), System Toggles (maintenance mode, merchant registration).
- Stored in `system_settings` key-value table; sticky save bar with toast.

### 4.22 Admin Dashboard (`/admin/dashboard`)
- Financial (revenue/GMV/orders/AOV), users (customers/merchants/riders/providers/affiliates/pending), affiliate summary, order status breakdown, mall/inventory analytics.

### 4.23 Provider & Merchant Wallet Cash-Outs
- Merchant withdrawals (`merchant_earnings`) and affiliate withdrawals (`affiliate_payout`) share the cash-out table (`wallet_type` column) — admin approves with transfer reference, marking `paid` (wallet debited).

---

## 5. Financial Split Rules (Audited)

| Scenario | Split | Status |
|---|---|---|
| Regular sale | Merchant 90% − affiliate / Platform 10% / Affiliate % | ✅ reconciles 100% |
| Mall sale | Admin 100% − affiliate | ✅ |
| Delivery fee | Rider 85% / Platform 15% | ✅ (₱209.95/₱247 = 85%) |
| Pickup fee ₱10 | Hub ₱5 / Platform ₱5 | ✅ |
| Booking | Provider payout + Platform commission = quoted | ✅ (₱3,240 + ₱460 = ₱3,700) |
| COD | Payouts deferred to delivery | ✅ implemented |
| Refund | Reversal into escrow | ✅ implemented |
| Escrow | Inflow (sales_receipt) → outflow (linked transfers) | ✅ implemented |

**Wallet types**: `sales_escrow`, `merchant_earnings`, `platform_earnings`, `admin_earnings`, `affiliate_payout`, `provider_earnings`, `rider_prepaid`.

---

## 6. Database Schema

**Core**: `users` (roles, affiliate status/docs, merchant verification), `provider_profiles`, `service_categories`, `hubs`, `delivery_rate_settings`, `parcels`, `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels`, `rider_locations`, `addresses`, `bookings`, `wallets`, `ledger_transactions`, `notifications`, `system_settings`, `categories`.

**Marketplace**: `products` (unit, low-stock threshold, sale price, points-only), `product_images`, `product_views`, `product_reviews`, `cart_items`, `orders` (delivery_state, PIN, photo, timestamps, dispatch audit), `order_items`, `merchant_payout_accounts`, `affiliate_cash_outs` (wallet_type, payout account, reference), `ad_campaigns`, `banners`, `incident_reports`, `support_tickets`, `packaging_items`, `packaging_redemptions`, `loyalty_points`, `promo_codes`, `promo_redemptions`.

---

## 7. Demo Users (MasterSeeder)

Default password: **`Password123!`** — `php artisan db:seed --class='Database\Seeders\MasterSeeder'`

| Role | Email | Phone |
|---|---|---|
| Admin | admin@becoolbox.com | 09170000001 |
| Staff | staff@becoolbox.com | 09170000002 |
| Merchant (verified) | merchant1@becoolbox.com | 09170000004 |
| Merchant (pending) | merchant2@becoolbox.com | 09170000007 |
| Rider | rider1@becoolbox.com | 09170000003 |
| Customer (cart + points) | customer1@becoolbox.com | 09170000005 |
| Customer | customer2@becoolbox.com | 09170000006 |
| Affiliate (pending cash-out) | affiliate1@becoolbox.com | 09170000008 |

Plus 28 products, 6 orders (all statuses), 4 ad campaigns, 3 banners, 3 cash-outs, low-stock items, and 1–5 reviews per product. Idempotent (clears prior test data on re-run).

---

## 8. Execution

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

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

**Environment**: `APP_URL` auto-detects live (`becoolbox.app` → debug off, CORS restricted) vs local (debug on, CORS open to Vite origins). `SEMAPHORE_API_KEY` optional. GD enabled. PostgreSQL `trust` auth locally.

---

## 9. Design System

Colors: purple brand (`bayan-*`, core `#673de6`) + charcoal (`ink-*`) + amber accent. Font: DM Sans. Patterns: dark sticky nav (logo, user, bell), gradient text, dark sections with glow orbs, rounded-2xl cards, chip badges, purple "Sponsored" / red "-X% OFF" badges, skeleton loaders, bottom nav (5 tabs max per role).

---

## 10. Key Routes

**Public**: `/`, `/search`, `/product/:id`, `/providers`, `/hire/:id`, `/store/:id`, `/login`, `/points-shop`.

**Auth**: `/cart`, `/orders`, `/bookings`, `/affiliate`, `/merchant/*` (dashboard, orders, products, ads, reports, profile, payouts), `/provider/*` (profile, jobs), `/rider/*` (dashboard, deliveries, history, wallet), `/staff/*` (dashboard, dispatch, mall, ops/*), `/admin/*` (dashboard, merchant-list, merchants, riders, affiliates, ads, banners, mall, settings, dispatch).