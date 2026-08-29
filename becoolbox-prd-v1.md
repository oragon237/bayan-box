# BeCoolBox — PRD v2 (As-Built, reconciled with code)

> **Product**: BeCoolBox (formerly BayanBox) — Provincial Last-Mile Logistics & Local E-Commerce Platform  
> **Status**: Implemented and reconciled against source as of 2026-08-29  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite + PWA) + PostgreSQL 16  
> **Docs note**: This revision updates PRD v1 to match the code actually in the repository (backend + frontend + migrations + seeders). Anything previously planned but not implemented has been removed or clearly marked; anything implemented but previously undocumented has been added.

---

## 1. Product Overview

BeCoolBox is a **"phygital" (physical + digital) provincial logistics orchestration platform** connecting local micro-merchants (MSMEs), community hubs (sari-sari stores), riders, customers, affiliates, and skilled workers in Philippine provinces.

### Core Value Propositions (all implemented)

1. **B2C Local E-Commerce Marketplace** — Merchants list products; customers browse, search, add to cart, and checkout with GCash/Maya/COD or affiliate earnings.
2. **B2B Packaging Marketplace** — Merchants buy packing supplies using Suki Points or cash.
3. **BeCoolBox Mall** — Admin-owned flagship store (official provincial goods, packaging); 100% of sales route to `admin_earnings` (0% platform rake).
4. **Product Advertising** — Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impressions, clicks, and conversion tracking; admin oversight with credit grants and rate control.
5. **Last-Mile Delivery** — Dynamic per-km fee calculator (Mapbox/ORS failover), surge pricing, round-robin rider assignment, manual/auto dispatch, rider refuse/reassign, delivery PIN + photo proof-of-delivery.
6. **Suki Points Loyalty** — Points earned on purchases and reviews; a dedicated **Points Shop** of points-only products.
7. **Affiliate Program** — Referral codes/QR/PDF poster for Customer, Merchant, Rider, Provider; commission earnings, cash-outs, and ID verification (staff excluded).
8. **Skilled Worker Marketplace** — Verified providers with profile picture/official badge, booking with two-party completion (confirm/rework), reviews, and Suki points.
9. **Merchant Operations** — Order fulfillment workflow (state machine), sales dashboard, reports, wallet withdrawals, and payout account management (GCash/Maya/Bank).
10. **Multi-Party Ledger** — Double-entry wallets with automated splits (merchant, platform, affiliate, rider, hub, provider, admin) via a `sales_escrow` that links both sides of every movement.
11. **Staff Operations Console** — Dispatch queue, live status board, incident management, support tickets (with refund reversal), delivery history/audit trail, and hazard zones.
12. **Admin Platform Console** — Merchant verification, rider/affiliate/mall/ads/banners management, settings (fees/ads/toggles/locations), and category management.
13. **Offline-First PWA** — IndexedDB offline queue with flush-on-reconnect, connectivity badge, fullscreen display.

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
| Maps | Backend: Mapbox Directions + OpenRouteService failover; Frontend: MapLibre GL + Leaflet (`@turf/turf` for geometry) |
| QR | Frontend `html5-qrcode` (hub scanner); referral poster rendered server-side via `barryvdh/laravel-dompdf` |
| SMS | Semaphore API (optional, graceful fallback) |
| Images | GD optimization via `POST /api/upload` |
| HTTP client | Guzzle (backend), Axios (frontend) |

### 2.2 PWA Features

- Fullscreen display (`display: fullscreen` + `display_override`)
- Service worker via `vite-plugin-pwa` (precaching)
- Offline queue: `frontend/src/services/offlineQueue.js` (IndexedDB, 1,000-entry cap) flushed to `POST /api/sync/offline-queue` on reconnect
- 50m GPS telemetry service (`services/telemetry.js`); 1.3× ETA buffer (`services/eta.js`)
- Public marketplace homepage (no login required); login/signup via header button; add-to-cart triggers login

---

## 3. Role Definitions

Six RBAC roles (`App\Enums\Role` + `EnsureRole` middleware, enforced per route group). Default password for all demo users: **`Password123!`** (MasterSeeder).

| Role | Description | Landing Page (role → `/`) |
|---|---|---|
| **Admin** | Platform owner; dashboard, merchant verification, rider/affiliate management, mall, ads, banners, settings, categories | Admin Dashboard |
| **Staff** | Hub agent; ops console (dispatch, incidents, tickets, status board), mall inventory, hub inventory | Staff Dashboard |
| **Rider** | Batch routes, GPS telemetry, doorstep deliveries (accept/refuse), wallet, earnings, emergency report, affiliate | Rider Dashboard |
| **Merchant** | Products, order fulfillment, ads, reports, payouts, profile/verification docs, affiliate | Merchant Dashboard |
| **Customer** | Marketplace, search, cart, orders/tracking, points shop, bookings, affiliate | Marketplace Home |
| **Provider** | Skills/picture/reviews/badge, jobs (accept → complete → confirm/rework), profile, affiliate | Marketplace Home |

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

### 4.3 Marketplace Home (`/`)
- Category icon grid → `/search?category=...`; admin banner carousel; "🔥 On Sale Deals" carousel; Points Shop + Skilled Workers quick links; tappable search bar; public without login.

### 4.4 Search Page (`/search`)
- Faceted filters (category, city, price range, on-sale-only, in-stock), sorting (relevance, reviews, sales, price), infinite scroll / Load More, top "Sponsored Items" carousel. `GET /api/products`, `/products/categories`, `/products/{id}`, `/products/{id}/related`, `/products/{id}/reviews`.

### 4.5 Products (Merchant CRUD)
- Fields (per `products` table + `Product` model): name, **unit**, description, **category** (string, admin-managed catalog), price, **sale_price + On Sale**, stock, **low_stock_threshold**, suki award, affiliate %, availability, status (active/draft/archived), images (upload + `product_images` gallery), **points_price / points_only**, **is_official_mall** (admin only).
- Storefront visibility scope `active`: `status=active AND stock>0 AND availability=available`; `effectivePrice()` returns `sale_price` when set.
- Endpoints: `/api/merchant/products` GET/POST/PUT/DELETE (role merchant, admin).

### 4.6 BeCoolBox Mall (Admin-owned, Module 2)
- `is_official_mall` products (AdminMallController CRUD `/api/admin/mall/products`); 100% minus affiliate → `admin_earnings`, **0% commission**; "BeCoolBox Official" badge; pinned to top of storefront; staff inventory view (`/api/staff/mall/inventory`).

### 4.7 Cart & Checkout
- `/api/cart` GET, `/api/cart/sync` POST, `/api/cart/items/{productId}` DELETE.
- `POST /api/checkout` validates: `fulfillment_type` (pickup|delivery, required), `payment_method` (gcash|maya|cod), `hub_id` (required_if pickup), `delivery_address` + `latitude`/`longitude` (required_if delivery, PH bounds lat -14..21, lng 116..127), `municipality`, `referral_code`, `use_affiliate_balance`.
- Checkout (MarketplaceService) inside a DB transaction: locks product rows, validates stock, creates the master order + order items, **burns Suki Points** for points-only items, **debits affiliate earnings** when `use_affiliate_balance` is set, decrements stock atomically, splits the ledger via a `sales_escrow`, notifies merchants, clears the cart.
- Order payment methods: `gcash`, `maya`, `cod`, `points`, `affiliate`. **COD** orders start `pending_payment` and their payouts are deferred until the rider marks the order delivered.
- Referral resolution: explicit `referral_code` at checkout, else the account's registered referrer (`referred_by_id`).

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
- Merchant order endpoints: `GET /api/merchant/orders`, `POST /merchant/orders/{id}/status`.
- Customer tracking: `GET /api/orders` (customer), `GET /orders/{id}/state`, `POST /orders/{id}/state/{action}`, `POST /orders/{id}/generate-pin`.
- Staff dispatch: `/api/staff/deliveries/unassigned`, `/staff/deliveries/{id}/assign`, `/staff/sales/today`.

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
- Referral micro-commission and B2B Return Shield config exist in `config/bayanbox.php` (`affiliate.*`).

### 4.12 Notifications & Support
- `notifications` table; bell with unread badge + dropdown; endpoints `/notifications`, `/unread-count`, `/read-all`, `/{id}/read`.
- Triggers: merchant new order/approved/rejected, admin new applicant/document, rider emergency, fulfillment updates (state machine broadcasts to customer + staff role feed), affiliate status.
- **Incident reports** (`incident_reports`): rider SOS `/api/rider/emergency`; staff view/resolve (`/staff/ops/incidents`, `/incidents/{id}/resolve`).
- **Support tickets** (`support_tickets`): staff view/resolve with action `refunded` (reverses original order payouts), `redelivery`, or `dismissed`.

### 4.13 Skilled Workers & Bookings
- Public provider directory + hire page; provider profile fields: `picture_url`, `is_official` badge, `availability`, `hourly_rate`, `completed_jobs`, `profile_views`.
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

---

## 5. Financial Split Rules (as enforced by `MarketplaceService` + `config/bayanbox.php`)

| Scenario | Party | Share |
|---|---|---|
| Regular sale | Merchant / Platform / Affiliate / Customer | 90% / 10% / product affiliate % / Suki points |
| BeCoolBox Mall sale | Admin / Affiliate / Customer | 100% minus affiliate / affiliate % / Suki points (0% rake) |
| Delivery fee | Rider / Platform | 85% / 15% |
| Pickup fee (₱10) | Hub staff / Platform | ₱5 / ₱5 (hub staff wallet = `merchant_earnings`) |
| Points-only item | Customer pays points; no cash split | — |
| Affiliate purchase | Customer's affiliate wallet debited | — |
| Booking payout | Provider / Platform | `provider_payout` / commission (on customer confirm) |
| COD | Released on delivery | Deferred from checkout until rider marks delivered |

- Delivery pricing formula: `baseFare + max(0, excessKm × perKmRate) × surge` (per-municipality `delivery_rate_settings`; night surge 1.5× 21:00–06:00 configurable; Mapbox/ORS with 7-day geohash cache).
- Platform fees: marketplace 10% rake; COD platform fee 1% (config); pickup handling fee ₱10 (config).
- Affiliate: max affiliate percentage 50%; min cash-out ₱200.
- Delivery splits configurable per municipality; defaults 85/15.

---

## 6. Database Schema

**Core**: `users`, `provider_profiles`, `service_categories`, `hubs`, `delivery_rate_settings`, `parcels`, `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels`, `rider_locations`, `addresses`, `bookings`, `wallets`, `ledger_transactions`, `notifications`.

**Marketplace**: `products`, `product_images`, `product_views`, `product_reviews`, `cart_items`, `orders`, `order_items`, `packaging_items`, `packaging_redemptions`, `banners`, `ad_campaigns`, **`categories`** (admin-managed catalog; `products.category` remains a string, not an FK).

**Loyalty/Affiliate**: `loyalty_points`, `promo_codes`, `promo_redemptions`, `affiliate_cash_outs` (with `wallet_type`, `payout_account_id`, `payout_reference`), `provider_reviews`.

**Additional tables not in PRD v1** (all implemented):
- `return_shield_grants` — B2B Return Shield credits for referring merchants.
- `system_settings` — key-value JSON platform config (fees/ads/toggles/locations/hazards).
- `merchant_payout_accounts` — merchant payout destinations (GCash/Maya/Bank).
- `incident_reports` — rider SOS/incident reports.
- `support_tickets` — customer/merchant support tickets.
- `categories` — admin-managed product categories (name/slug/icon/sort_order/is_active).

**Key columns added after base migrations** (not in PRD v1):
- `users`: `is_official_mall`, `verification_notes`, `verified_at`, `affiliate_status`, `affiliate_documents`, `affiliate_activated_at`.
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

| Role | Name | Email | Phone |
|---|---|---|---|
| Admin | — | admin@becoolbox.com | 09170000001 |
| Staff | — | staff@becoolbox.com | 09170000002 |
| Rider | — | rider1@becoolbox.com | 09170000003 |
| Rider (extra) | Berto Rider | rider2@becoolbox.com | 09175550000 |
| Merchant (verified) | — | merchant1@becoolbox.com | 09170000004 |
| Merchant (pending) | — | merchant2@becoolbox.com | 09170000007 |
| Customer (cart + points) | — | customer1@becoolbox.com | 09170000005 |
| Customer | — | customer2@becoolbox.com | 09170000006 |
| Customer (reviewers ×3) | Ramon / Liza / Tomas | customer3/4/5@becoolbox.com | 09170000010/11/12 |
| Affiliate (pending cash-out) | Rosie | affiliate1@becoolbox.com | 09170000008 |
| Affiliate (extra) | Karding | affiliate2@becoolbox.com | 09170000009 |

Seed inventory (MasterSeeder):
- **28 products**: 17 merchant-owned (Mang Juan), 7 **admin-owned BeCoolBox Mall** (`is_official_mall=true`, incl. 3 points-only Points Shop items), 4 merchant2 (pending) — across categories Fresh Produce, Home Cooks, Local Crafts, Packaging, Provincial Goods, Points Shop.
- **6 orders** across all statuses (paid, assigned, out_for_delivery, delivered, disputed, pending_payment), payment methods gcash/maya/cod, fulfillment pickup/delivery.
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

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

**Environment notes**: `APP_URL=http://localhost:8000`; `SEMAPHORE_API_KEY` optional; GD extension enabled; PostgreSQL 16 local (`bayanbox` db, `trust` auth); Mapbox/ORS tokens optional (graceful failover). Vite dev server proxies `/api` to `:8000`.

---

## 9. Design System

Colors: Purple brand (`bayan-*`, core `#673de6`) + deep charcoal (`ink-*`) + amber accent. Typography: DM Sans. Patterns: dark sticky nav with user profile + bell, gradient text, dark sections with glow orbs, rounded-2xl cards, chip badges, purple "Sponsored" ad badges, discount `-X% OFF` badges, "BeCoolBox Official" badge.

---

## 10. Key Routes Overview

**Public** (no login): `/`, `/search`, `/product/:id`, `/store/:id`, `/providers`, `/hire/:id`, `/login`.

**Auth** (any logged-in user): `/cart`, `/orders`, `/bookings`, `/affiliate`, `/referral`, `/track/:tracking`, `/delivery-cost`, `/suki`, `/points-shop`, `/hub`, `/hub/inventory`, `/rider`, `/rider/wallet`, `/rider/deliveries`, `/rider/dashboard`, `/staff/mall`, `/staff/dispatch`, `/staff/dashboard`, `/merchant/*` (products, orders, ads, dashboard, reports, settings/payouts, profile), `/provider/*` (profile, jobs), `/admin/*` (dashboard, merchants, merchant-list, mall, riders, affiliates, banners, ads, settings).

---

## 11. Change Log (v1 → v2, as-built)

- Removed unimplemented/legacy PRD claims; renumbered modules to include implemented Staff Ops console, Admin settings/categories, merchant payout accounts, incidents/tickets, offline queue, and the delivery state machine.
- Documented the authoritative order `delivery_state` lifecycle + role-scoped transition table and COD deferred-payout behavior.
- Added `sales_escrow` wallet and refund flow; confirmed all financial split figures against `MarketplaceService` and `config/bayanbox.php`.
- Expanded database schema with 6 additional tables and post-base columns; added schema caveat about the duplicate index migration.
- Expanded demo-user list to include extra rider, reviewer customers, and affiliate2; documented the alternate `DatabaseSeeder` contents.
