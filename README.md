# HABI — Habing ng Bayan

> *HABI — to weave. A provincial platform weaving local merchants, community hubs, riders, customers, and skilled workers into one connected ecosystem.*

**Provincial Last-Mile Logistics OS + Local E-Commerce Marketplace** — React PWA + Laravel 11 REST API + PostgreSQL 16

> Formerly BayanBox / BeCoolBox. Full product spec: [`HABI-prd-v1.md`](HABI-prd-v1.md)

---

## What HABI Does

| Pillar | Description |
|---|---|
| 🛍️ **Local Marketplace** | Merchants sell products; customers browse a category-driven storefront, search, add to cart, and checkout (GCash / Maya / COD / affiliate earnings / Suki Points). |
| 🏬 **HABI Mall** | Admin-owned flagship store — 100% of sales route to platform earnings, zero commission. |
| 📢 **Product Advertising** | Merchants run Sponsored / Homepage Featured / Flash Deal campaigns with impression, click & conversion tracking. |
| 🛵 **Last-Mile Delivery** | OSRM road-distance fees (₱40 base + ₱10/km), round-robin rider assignment, refusal auto-reassignment, live route maps. |
| 🪙 **Suki Points** | Loyalty points from purchases & reviews, redeemable in a dedicated Points Shop. |
| 🤝 **Affiliate Program** | Referral codes + QR, commission earnings, ID-verified cash-outs (Customer / Merchant / Rider / Provider). |
| 🧑‍🔧 **Skilled Workers** | Verified provider directory, bookings with two-party completion (confirm / rework), reviews & official badges. |
| ⚙️ **Order Lifecycle State Machine** | 10-state delivery lifecycle with role-based transitions, auto-cancel timers, reassignment, and proof-of-delivery (PIN / photo). |
| 💰 **Escrow Ledger** | Double-entry wallets — every payment flows through a sales-escrow wallet and out via linked transfers; COD deferred until cash collected. |
| 📊 **Admin Analytics** | Revenue/GMV/AOV, user stats, affiliate commissions, order status board, mall inventory, system settings. |

---

## Architecture

```
bayan-box/
├── backend/                  # Laravel 11 API + PostgreSQL
│   ├── app/
│   │   ├── Console/Commands/     # orders:process-lifecycle (auto-cancel/reassign)
│   │   ├── Enums/                # Role, ParcelStatus
│   │   ├── Http/Controllers/Api/ # 44 API controllers
│   │   ├── Http/Middleware/      # EnsureRole (RBAC)
│   │   ├── Models/               # Eloquent models (Order, Product, Wallet…)
│   │   └── Services/             # 16 services (escrow ledger, state machine, ads…)
│   ├── config/
│   │   ├── bayanbox.php          # Domain config (splits, surge, ads, rewards)
│   │   ├── app.php               # Auto-detects live (becoolbox.app) → debug off
│   │   ├── cors.php              # Environment-based allowed origins
│   │   ├── sanctum.php           # 24h token expiration
│   │   └── filesystems.php       # Public disk (uploads)
│   ├── database/seeders/         # MasterSeeder (full test data) + DatabaseSeeder
│   ├── routes/
│   │   ├── api.php               # RBAC-protected route groups
│   │   └── console.php           # Scheduler (order lifecycle)
│   └── resources/views/pdf/      # Referral poster Blade template
├── frontend/               # React 18 PWA (Vite + Tailwind + MapLibre GL)
│   ├── src/
│   │   ├── api/                  # Axios client (Bearer auth) + demo-mode mock
│   │   ├── components/           # Shell, DeliveryMap (MapLibre), ImageUploader, NotificationsBell…
│   │   ├── hooks/                # useFullscreen
│   │   ├── lib/                  # distance.js (Turf/OSRM/fee), geocode.js (Nominatim)
│   │   └── pages/
│   │       ├── marketplace/      # Home, Search, ProductDetail, Providers, Storefront, Hire
│   │       ├── cart/             # Dedicated cart + checkout (MapLibre route preview)
│   │       ├── customer/         # My Orders, Points Shop, Bookings, Tracking, Suki
│   │       ├── merchant/         # Dashboard, Orders, Products, Ads, Reports, Payouts, Profile
│   │       ├── rider/            # Dashboard, Deliveries (+History), Route, Wallet
│   │       ├── staff/            # Dashboard (ops), Dispatch, Mall
│   │       ├── admin/            # Dashboard, Merchants, Riders, Affiliates, Ads, Banners, Mall, Settings
│   │       ├── provider/         # Profile (skills/photo/badge), Jobs
│   │       └── affiliate/        # Dashboard (earnings/QR/cash-out), ReferralQR
│   └── public/                   # beboolbox-logo.png, manifest, favicon
├── HABI-prd-v1.md          # Product Requirements Document (as-built)
└── README.md
```

---

## Quick Start

### Backend (Laravel API — port 8000)

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
# Edit .env → DB_HOST=127.0.0.1, DB_DATABASE=bayanbox, DB_USERNAME=postgres
php artisan migrate --force
php artisan db:seed --class='Database\Seeders\MasterSeeder'
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend (React PWA — port 3000)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000 (proxies /api + /storage to :8000)
npm run build        # production build to dist/
```

### Requirements

- PHP 8.2+ (GD extension enabled), Composer 2.2+
- PostgreSQL 16 running locally (database `bayanbox`)
- Node 18+

---

## Demo Accounts

All seeded users share the password **`password`**.

| Role | Phone | Name | Notes |
|---|---|---|---|
| Admin | 09170000001 | BayanBox Admin | Dashboard, merchants, riders, ads, settings |
| Staff | 09170000002 | Nena Hub Staff | Ops dashboard, dispatch, mall inventory |
| Rider | 09170000003 | Rico the Rider | Active deliveries, dashboard, wallet |
| Merchant | 09170000004 | Aling Maria Merch | Verified — orders, products, ads, reports, payouts |
| Customer | 09170000005 | Juan Dela Cruz | Cart + points + bookings + affiliate |
| Provider | 09170000006 | Mang Cardo Pro | Official badge — profile, jobs |

Rider #2 (Berto, 09175550000) demonstrates round-robin load balancing. Full list: `DEMO-ACCOUNTS.txt`.

---

## Key Features (all implemented)

| Feature | Key Files |
|---|---|
| **RBAC** (6 roles) | `Enums/Role.php`, `Middleware/EnsureRole.php`, `routes/api.php` |
| **Public marketplace + category home** | `MarketplaceHome.jsx`, `MarketplaceController.php` |
| **Search page (facets, sort, infinite scroll)** | `SearchPage.jsx`, `MarketplaceController@index` |
| **Merchant storefront (`/store/:id`)** | `MerchantStorefront.jsx`, `MerchantStoreController.php` |
| **Cart + checkout (escrow, COD, points, affiliate pay)** | `CartPage.jsx`, `CartController.php`, `CheckoutController.php`, `MarketplaceService.php` |
| **HABI Mall (admin-owned, 100% admin)** | `AdminMallController.php`, `AdminMall.jsx` |
| **Order lifecycle state machine (10 states)** | `Services/OrderStateMachine.php`, `OrderStateController.php` |
| **Auto-cancel + reassignment scheduler** | `Console/Commands/ProcessOrderLifecycle.php`, `routes/console.php` |
| **Proof of delivery (PIN / photo)** | `OrderStateMachine`, `orders.delivery_pin/photo_url` |
| **Round-robin rider assignment + refusal** | `Services/DeliveryAssignmentService.php`, `StaffOpsController.php` |
| **Merchant fulfillment (accept → ready)** | `MerchantOrders.jsx`, `MerchantOrderController.php` |
| **Product ads (sponsored/featured/flash + tracking)** | `Services/AdService.php`, `AdTrackingController.php`, `MerchantAdController.php`, `AdminAdController.php` |
| **Banners (admin-managed carousel)** | `BannerController.php`, `AdminBanners.jsx`, `MarketplaceHome.jsx` |
| **Affiliate program (QR, income sources, activation, cash-out gate)** | `AffiliateController.php`, `AffiliateDashboard.jsx`, `AdminAffiliates.jsx` |
| **Merchant payout methods + withdrawals** | `MerchantPayoutController.php`, `MerchantPayouts.jsx`, `MerchantReports.jsx` |
| **Escrow ledger (inflow → linked outflows)** | `Services/WalletService.php` (locking, balance check, refunds) |
| **Real refunds (reversal into escrow)** | `WalletService::refundOrder`, `StaffOpsController::resolveTicket` |
| **Notifications (bell + triggers)** | `NotificationService.php`, `NotificationController.php`, `NotificationsBell.jsx` |
| **Provider directory (search/filter/sort)** | `ProviderDirectory.jsx`, `ProviderController.php` |
| **Provider bookings (two-party completion + rework)** | `BookingController.php`, `HireProvider.jsx`, `ProviderJobs.jsx` |
| **Points Shop (points-only products)** | `PointsShop.jsx`, `MarketplaceService` (points burn) |
| **Reviews (verified-buyer) + related products** | `ProductReviewController.php`, `RelatedProductsService.php` |
| **Merchant analytics (trend, best sellers, cash-out)** | `MerchantDashboardController.php`, `MerchantReports.jsx` |
| **Admin settings (5 tabs) + category CRUD** | `SystemSettingService.php`, `AdminSettingsController.php`, `AdminSettings.jsx` |
| **Image upload + GD optimization** | `Services/ImageUploadService.php`, `UploadController.php`, `ImageUploader.jsx` |
| **OSRM road distance + Haversine + fee calc** | `lib/distance.js`, `Services/DeliveryPricingService.php` |
| **Nominatim address geocoding (auto lat/lng)** | `lib/geocode.js`, `CartPage.jsx` |
| **MapLibre route maps (markers + polyline)** | `components/DeliveryMap.jsx` |
| **Staff ops (KPIs, incidents, status board, tickets, hazards)** | `StaffOpsController.php`, `StaffDashboard.jsx` |
| **Notifications (bell + role triggers)** | `Services/NotificationService.php`, `NotificationsBell.jsx` |
| **In-store pickup (₱10 split ₱5/₱5)** | `MarketplaceService`, pickup fee logic |
| **Offline IndexedDB queue (1,000 cap)** | `frontend/src/services/offlineQueue.js` |
| **50m GPS rider telemetry** | `frontend/src/services/telemetry.js` |
| **Fullscreen PWA** | `hooks/useFullscreen.js`, `vite.config.js` (manifest + SW) |

---

## Financial Model (audited)

| Flow | Split |
|---|---|
| Marketplace sale | **90% merchant / 10% platform** + product affiliate % + Suki points |
| HABI Mall sale | **100% admin_earnings** − affiliate % (0% rake) |
| Delivery fee | **85% rider / 15% platform** |
| Pickup fee ₱10 | ₱5 hub staff / ₱5 platform |
| Booking | provider_payout + platform commission = quoted |
| COD | Payouts **deferred until delivery** (cash collected) |
| Refund | All payouts reversed **into escrow** via ticket resolution |
| Points-only item | Paid with Suki Points — no cash ledger |

Every movement is double-entry: customer payment → `sales_escrow` (inflow) → linked transfers (outflow). Wallets can never go negative (balance-checked debits with row locking).

---

## API (representative — see `backend/routes/api.php`)

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` (3/hr) · `/api/auth/login` (5/min per phone) | public |
| GET | `/api/products`, `/api/products/{id}`, `/products/{id}/related`, `/products/categories`, `/products/{id}/reviews` | public |
| GET | `/api/banners`, `/api/providers`, `/api/providers/{id}`, `/api/merchants/{id}/store`, `/api/services` | public |
| GET | `/api/track/{tracking}` | public |
| POST | `/api/checkout`, `/api/cart/sync`, `/api/orders/{id}/state/{action}`, `/api/upload`, `/api/ads/{id}/impression|click` | any auth |
| GET | `/api/merchant/dashboard`, `/merchant/reports`, `/merchant/orders`, `/merchant/ads`, `/merchant/payouts`, `/merchant/profile` | merchant |
| GET | `/api/rider/dashboard`, `/rider/deliveries(+history)`, `/rider/earnings`, `/rider/wallet` | rider |
| GET | `/api/staff/ops/*` (overview, dispatch, history, status-board, incidents, tickets, hazards), `/api/staff/dashboard`, `/api/staff/sales/today` | staff/admin |
| GET | `/api/admin/overview`, `/admin/settings`, `/admin/affiliates`, `/admin/finance`, `/admin/banners`, `/admin/ads` | admin |

Full RBAC list: `backend/routes/api.php`

---

## Documentation

- [`HABI-prd-v1.md`](HABI-prd-v1.md) — Product Requirements Document (as-built, all 24 modules)
- [`bayanbox-prd-v3.md`](bayanbox-prd-v3.md) — legacy PRD v3
- [`RULES-PER-ACCOUNT.md`](RULES-PER-ACCOUNT.md) — role-based rules & access matrix
- [`DEMO-ACCOUNTS.txt`](DEMO-ACCOUNTS.txt) — seeded demo credentials
