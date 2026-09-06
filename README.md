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
| 💰 **Escrow Ledger** | Double-entry wallets — every payment flows through a sales-escrow wallet and out via linked transfers; COD deferred until cash collected (with rider COD remittance tracking). |
| 🧺 **Pabili (Buy-For-Me)** | Customer submits off-catalog item list (≤15 lines) → staff quotes each line + shipping → approval converts to a real COD order via a hidden mall product. |
| 🏪 **Hub & Offline Mode** | Sari-sari hub parcel scan-in with **OTP release** (Semaphore SMS); PWA queues mutations in IndexedDB (1,000 cap) and replays to `/api/sync/offline-queue` when back online. |
| 📊 **Admin Analytics** | Revenue/GMV/AOV, user stats, affiliate commissions, order status board, mall inventory, system settings, maintenance mode. |

---

## Architecture

```
bayan-box/
├── backend/                  # Laravel 11 API + PostgreSQL
│   ├── app/
│   │   ├── Console/Commands/     # orders:process-lifecycle (auto-cancel/reassign)
│   │   ├── Enums/                # Role, ParcelStatus
│   │   ├── Http/Controllers/Api/ # 47 API controllers
│   │   ├── Http/Middleware/      # EnsureRole (RBAC), EnsureNotUnderMaintenance
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
│   │   ├── components/           # Shell, DeliveryMap (MapLibre), ImageUploader, NotificationsBell, CancelOrderButton…
│   │   ├── hooks/                # useFullscreen
│   │   ├── lib/                  # distance.js (Turf/OSRM/fee), geocode.js (Nominatim), sound.js (alert chime)
│   │   ├── services/             # offlineQueue.js (IndexedDB), telemetry.js (rider GPS)
│   │   └── pages/
│   │       ├── marketplace/      # Home/V2, Search, ProductDetail, Providers, Storefront, Hire, Mall
│   │       ├── cart/             # Dedicated cart + checkout (MapLibre route preview)
│   │       ├── customer/         # My Orders, Points Shop, Bookings, Tracking, Suki, Pabili, Profile
│   │       ├── merchant/         # Dashboard, Orders, Products, Ads, Reports, Payouts, Profile
│   │       ├── rider/            # Dashboard, Deliveries (+History), Route, Wallet, Profile
│   │       ├── staff/            # StaffDashboard, StaffDispatch, StaffMall(+Orders), StaffFinance
│   │       ├── hub/              # HubScanner, HubInventory (parcel intake + OTP release)
│   │       ├── admin/            # Dashboard, Merchants, Riders, Affiliates, Ads, Banners, Mall, Finance, Settings
│   │       ├── provider/         # Profile (skills/photo/badge), Jobs
│   │       └── affiliate/        # Dashboard (earnings/QR/cash-out), ReferralQR
│   └── public/                   # bayan-tile-32/64/192/512.png icons (PWA manifest), habi-logo-concept.png
├── deploy/                   # VPS nginx.conf + systemd habi-queue@ service; shared-host /habi/ subfolder kit
├── HABI-prd-v1.md            # Product Requirements Document v1.1 (as-built)
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
php artisan db:seed            # default demo users (password: "password"); MasterSeeder for full fixture set
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend (React PWA — port 3000)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000 (proxies /api + /storage to :8000)
npm run build        # production build to dist/
# For /habi/ subfolder hosting:  $env:VITE_BASE = "/habi/";  npm run build
```

### Requirements

- PHP 8.2+ (GD extension enabled), Composer 2.2+
- PostgreSQL 16 running locally (database `bayanbox`)
- Node 18+

---

## Demo Accounts

Default seed (`php artisan db:seed` / `bayanbox:demo`): ~10 demo users on phones 09170000001–010, shared password **`password`** — change before production. `MasterSeeder` (extensive fixture data) uses **`Password123!`**.

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
| **Notifications (bell + triggers + sound chime)** | `NotificationService.php`, `NotificationController.php`, `NotificationsBell.jsx`, `lib/sound.js` |
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
| **Pabili buy-for-me (quote → COD order via hidden product)** | `PabiliController.php`, `PabiliStaffController.php`, `Pabili.jsx` |
| **Hub parcels: scan intake + OTP release (Semaphore SMS)** | `ParcelService.php`, `SmsService.php`, `HubScanner.jsx`, `HubInventory.jsx` |
| **Offline queue server replay (/api/sync/offline-queue)** | `OfflineSyncController.php`, `offlineQueue.js` |
| **Rider COD remittance + finance views** | `RiderCodRemittance.php`, `StaffOpsController::remit`, `StaffFinance.jsx` |
| **Maintenance mode (503 gate, admin/staff bypass)** | `EnsureNotUnderMaintenance.php`, `MaintenancePage.jsx` |
| **PWA error reporting** | `routes/api.php` (`/errors/report`), `ErrorBoundary` in `App.jsx` |
| **In-store pickup (₱10 split ₱5/₱5)** | `MarketplaceService`, pickup fee logic |
| **Click-and-collect + order PIN** | `OrderStateMachine` (`confirm_collection`, `generate-pin`) |
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
| POST | `/api/checkout`, `/api/cart/sync`, `/api/orders/{id}/state/{action}`, `/api/upload`, `/api/ads/{id}/impression|click`, `/api/sync/offline-queue` | any auth |
| GET/POST | `/api/pabili` (create/list/approve/decline/cancel) | any auth |
| GET | `/api/merchant/dashboard`, `/merchant/reports`, `/merchant/orders`, `/merchant/ads`, `/merchant/payouts`, `/merchant/profile` | merchant |
| GET | `/api/rider/dashboard`, `/rider/deliveries(+history)`, `/rider/earnings`, `/rider/wallet` · POST `/rider/telemetry`, `/rider/emergency` | rider |
| POST | `/api/hub/parcels/{tracking}/release|reconcile` (OTP) · `/api/hub/affiliate/referral-qr` | staff/hub |
| GET | `/api/staff/ops/*` (overview, dispatch, history, status-board, incidents, tickets, hazards, pabili), `/api/staff/dashboard`, `/api/staff/sales/today`, `/staff/finance/*` | staff/admin |
| GET | `/api/admin/overview`, `/admin/settings`, `/admin/affiliates`, `/admin/finance`, `/admin/banners`, `/admin/ads` | admin |

Full RBAC list: `backend/routes/api.php`

---

## Documentation

- [`HABI-prd-v1.md`](HABI-prd-v1.md) — Product Requirements Document v1.1 (as-built)
- [`deploy/README.md`](deploy/README.md) — VPS deploy (nginx + systemd queue workers); [`deploy/subfolder/README.md`](deploy/subfolder/README.md) — shared-host `/habi/` deploy
- [`RULES-PER-ACCOUNT.md`](RULES-PER-ACCOUNT.md) — role-based rules & access matrix
- [`DEMO-ACCOUNTS.txt`](DEMO-ACCOUNTS.txt) — seeded demo credentials
