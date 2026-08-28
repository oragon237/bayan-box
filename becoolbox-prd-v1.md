# BeCoolBox — PRD v1 (Updated)

> **Product**: BeCoolBox (formerly BayanBox) — Provincial Last-Mile Logistics & Local E-Commerce Platform  
> **Status**: Implemented as of 2026-08-28  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite + PWA) + PostgreSQL 16

---

## 1. Product Overview

BeCoolBox is a **"phygital" (physical + digital) provincial logistics orchestration platform** connecting local micro-merchants (MSMEs), community hubs (sari-sari stores), riders, customers, affiliates, and skilled workers in Philippine provinces.

### Core Value Propositions

1. **B2C Local E-Commerce Marketplace** — Merchants list products; customers browse, search, add to cart, and checkout with GCash/Maya/COD or affiliate earnings.
2. **B2B Packaging Marketplace** — Merchants buy packing supplies using Suki Points or cash.
3. **BeCoolBox Mall** — Admin-owned flagship store (official provincial goods, packaging); 100% of sales route to `admin_earnings`.
4. **Product Advertising** — Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impressions, clicks, and conversion tracking.
5. **Last-Mile Delivery** — Dynamic per-km fee calculator; round-robin rider assignment; rider refuse/reassign.
6. **Suki Points Loyalty** — Points earned on purchases and reviews; a dedicated **Points Shop** of points-only products.
7. **Affiliate Program** — Referral codes/QR for Customer, Merchant, Rider, Provider; commission earnings, cash-outs, and ID verification (staff excluded).
8. **Skilled Worker Marketplace** — Verified providers with booking, two-party completion (confirm/rework), reviews, and official badges.
9. **Merchant Operations** — Order fulfillment workflow (accepted → packaging → courier), sales dashboard, reports, and wallet withdrawals.
10. **Multi-Party Ledger** — Double-entry wallets with automated splits (merchant, platform, affiliate, rider, hub, provider, admin).

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.2) |
| API | RESTful JSON, Sanctum token auth |
| Database | PostgreSQL 16 |
| Frontend | React 18 (Vite + PWA) |
| Styling | Tailwind CSS (Hostinger-inspired purple/charcoal theme) |
| Font | DM Sans |
| Maps | Mapbox GL (with OpenRouteService failover) |
| SMS | Semaphore API (optional, graceful fallback) |
| Images | GD optimization (resize ≤1200px, JPEG 82%) via `POST /api/upload` |

### 2.2 PWA Features

- Fullscreen display (`display: fullscreen` + `display_override`)
- Service worker with Workbox (precaching)
- Public marketplace homepage (no login required); login/signup accessible via header button; add-to-cart triggers login

---

## 3. Role Definitions

| Role | Description | Bottom Nav (first 5) |
|---|---|---|
| **Admin** | Platform owner; dashboard, merchant/rider/affiliate management, mall, ads, banners, dispatch | Dashboard, Merchants, Riders, Affiliates, Ads |
| **Staff** | Hub agent; dashboard "Things to Do", intake/release, dispatch, mall inventory | Dashboard, Scan, Inventory, Dispatch, Mall |
| **Rider** | Batch routes, GPS, doorstep deliveries (accept/refuse), wallet, affiliate | Shop, Route, Deliveries, Wallet, Affiliate |
| **Merchant** | Products, order fulfillment, ads, reports, dashboard, affiliate | Dashboard, Affiliate, Cart, Ads, Orders |
| **Customer** | Marketplace, search, cart, orders, points shop, bookings, affiliate | Shop, Cart, Affiliate, Orders, Points |
| **Provider** | Skills/picture/reviews/badge, jobs (accept → done → confirm/rework), affiliate | Shop, Profile, Jobs, Affiliate, Delivery |

---

## 4. Modules

### 4.1 Authentication & Registration
- Register (merchant defaults `pending_verification`; captures DTI/SEC, gov ID, permit, photo, message) and login via phone + password.
- Sanctum token auth; auto-redirect by role on `/`: Admin → Admin Dashboard, Staff → Staff Dashboard, Merchant → Merchant Dashboard, others → Marketplace Home.

### 4.2 Merchant Verification Workflow
- `GET /api/admin/merchants/pending`, `POST /admin/merchants/{id}/approve` (activates + wallet + SMS/notification), `POST /{id}/reject` (with reason).
- Pending merchants cannot create products (403). Merchant can edit documents/address via `/merchant/profile`.

### 4.3 Marketplace Home (`/`)
- Category icon grid → `/search?category=...`; admin banner carousel; "🔥 On Sale Deals" carousel (discount badges, snap scroll, nav arrows); Points Shop + Skilled Workers quick links; tappable search bar.

### 4.4 Search Page (`/search`)
- Sticky auto-focus search; recent/trending suggestions; faceted filters (category, city, price range, on-sale-only, in-stock); sorting (relevance, reviews, sales, price); infinite scroll + Load More; top "Sponsored Items" carousel (pure organic grid).

### 4.5 Products (Merchant CRUD)
- Fields: name, **unit**, description, category (fixed select), price, **sale_price + On Sale toggle**, stock, **low_stock_threshold**, suki award, affiliate %, availability, status (active/draft/archived), images (upload + gallery), points_price/points_only.
- Endpoints: `/api/merchant/products` GET/POST/PUT/DELETE.

### 4.6 BeCoolBox Mall (Admin-owned)
- `is_official_mall` products; 100% → `admin_earnings`, 0% commission; "BeCoolBox Official" badge; pinned to top of storefront; staff inventory view.

### 4.7 Cart & Checkout
- Dedicated `/cart` page: thumbnails, qty +/-, unit prices, subtotal/points/delivery breakdown, fulfillment (pickup ₱10 / delivery), payment (GCash/Maya/**COD**), affiliate-balance toggle, referral code.
- Checkout validates stock with `lockForUpdate`, deducts inventory, burns Suki Points for points-only items, splits ledger, clears cart, notifies merchants.

### 4.8 Orders & Fulfillment
- **Merchant flow**: accepted → packaging → sending_to_courier → accepted_by_courier (forward-only), customer notified at each step.
- **Customer tracking**: `/orders` timeline (Order placed → Accepted → Packaging → Sent to courier → Accepted by courier).
- **Delivery**: `DeliveryAssignmentService` round-robin (fewest-active-rider); rider view/refuse → auto-reassign; staff/admin dispatch queue; today's sales.

### 4.9 Product Reviews & Related
- Verified-buyer-only reviews (1 per user+product); Suki points for provider reviews; behavioral related products (purchase co-occurrence + view co-occurrence + category fallback).

### 4.10 Points Shop
- Products with `points_only=true` + `points_price`; redeemable exclusively with Suki Points; balance displayed; points burned at checkout.

### 4.11 Affiliate Program (Customer/Merchant/Rider/Provider; **Staff blocked 403**)
- Referral code + QR + shareable link; earnings ledger with income sources; **document upload (ID) for admin activation**; cash-out requests (min ₱200) gated until activated; admin approve/decline; affiliate earnings usable at checkout.
- Admin page: paginated, searchable, role/city filters, earnings sort, cash-out approval, activate.

### 4.12 Notifications
- `notifications` table; bell with unread badge + dropdown; triggers: merchant new order/approved/rejected, admin new applicant/document, rider emergency, fulfillment updates, affiliate status.

### 4.13 Skilled Workers & Bookings
- Public provider directory + hire page (`/hire/:id`) with service/date/address; booking lifecycle: pending → accepted → `provider_completed` → customer **confirm** (escrow payout) or **rework**; provider jobs page with accept/complete/resubmit; customer bookings monitor.

### 4.14 Product Advertising
- Merchant `/merchant/ads`: create campaigns (Sponsored ₱50/day, Homepage Featured ₱100/day, Flash Deal ₱30/day), duration, wallet/points payment; analytics (impressions/clicks/orders); pause/resume.
- Search/homepage injection: sponsored badges, featured carousel, impression/click tracking.
- Admin `/admin/ads`: tabs (Product Ads / Home Slide Ads), counters, edit modal (image upload + size guidance, dates, status, order, keywords), quick toggle, delete confirm, grant credits.

### 4.15 Merchant Analytics
- `/merchant/dashboard`: store status, KPIs (month/lifetime revenue, pending orders, units sold, wallet balance), pending-orders queue, low-stock alerts.
- `/merchant/reports`: date filter (today/7d/month/custom), daily revenue trend, best-sellers table, wallet + withdrawal history, request cash-out (merchant_earnings).

### 4.16 Wallets & Ledger
- Wallet types: `rider_prepaid`, `merchant_earnings`, `platform_earnings`, `admin_earnings`, `affiliate_payout`, `provider_earnings`.
- Double-entry ledger with transaction hashes; credit/debit/transfer/ensureWallet.

---

## 5. Financial Split Rules

| Scenario | Party | Share |
|---|---|---|
| Regular sale | Merchant / Platform / Affiliate / Customer | 90% / 10% / product affiliate % / Suki points |
| BeCoolBox Mall sale | Admin / Affiliate / Customer | 100% minus affiliate / affiliate % / Suki points |
| Delivery fee | Rider / Platform | 85% / 15% |
| Pickup fee (₱10) | Hub staff / Platform | ₱5 / ₱5 |
| Points-only item | Customer pays points; no cash split | — |
| Affiliate purchase | Customer's affiliate wallet debited | — |
| Booking payout | Provider / Platform | `provider_payout` / commission |

---

## 6. Database Schema

Core: `users`, `provider_profiles`, `service_categories`, `hubs`, `delivery_rate_settings`, `parcels`, `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels`, `rider_locations`, `addresses`, `bookings`, `wallets`, `ledger_transactions`, `notifications`.

Marketplace: `products`, `product_images`, `product_views`, `product_reviews`, `cart_items`, `orders`, `order_items`, `packaging_items`, `packaging_redemptions`, `banners`, `ad_campaigns`.

Loyalty/Affiliate: `loyalty_points`, `promo_codes`, `promo_redemptions`, `affiliate_cash_outs` (with `wallet_type`), `provider_reviews`.

---

## 7. Demo Users (MasterSeeder)

Default password for all: **`Password123!`** — also seedable via `php artisan db:seed --class='Database\Seeders\MasterSeeder'`

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

MasterSeeder also seeds 28 products, 6 orders (all statuses), 4 ad campaigns, 3 banners, 3 cash-outs, low-stock items, and reviews.

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

**Environment notes**: `APP_URL=http://localhost:8000`; `SEMAPHORE_API_KEY` optional; GD extension enabled; PostgreSQL 16 local (`bayanbox` db, `trust` auth).

---

## 9. Design System

Colors: Purple brand (`bayan-*`, core `#673de6`) + deep charcoal (`ink-*`) + amber accent. Typography: DM Sans. Patterns: dark sticky nav with user profile + bell, gradient text, dark sections with glow orbs, rounded-2xl cards, chip badges, purple "Sponsored" ad badges, discount `-X% OFF` badges.

---

## 10. Key Routes Overview

**Public**: `/`, `/search`, `/product/:id`, `/providers`, `/hire/:id`, `/login`, `/points-shop`.

**Auth**: `/cart`, `/orders`, `/bookings`, `/affiliate`, `/merchant/*` (products, orders, ads, dashboard, reports, profile), `/provider/*` (profile, jobs), `/rider/*` (deliveries, wallet), `/staff/*` (dashboard, dispatch, mall), `/admin/*` (dashboard, merchants, riders, affiliates, mall, ads, banners).