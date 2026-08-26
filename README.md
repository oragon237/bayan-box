# BayanBox (BodegaBarangay) — Provincial Last-Mile Logistics OS

**Version 3.0.0** — React PWA + Laravel REST API + PostgreSQL

## Architecture

```
bayan-box/
├── backend/          # Laravel 11 API + PostgreSQL migrations
│   ├── app/
│   │   ├── Enums/              # Role, ParcelStatus
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # 10 API controllers
│   │   │   └── Middleware/       # EnsureRole (RBAC)
│   │   ├── Models/              # 19 Eloquent models
│   │   └── Services/            # 8 service classes
│   ├── config/
│   │   ├── bayanbox.php         # Domain config (splits, surge, ETA, loyalty)
│   │   └── database.php         # PostgreSQL connection
│   ├── database/
│   │   ├── migrations/          # 20 migration files
│   │   ├── seeders/             # Demo data seeder
│   │   └── schema/              # Standalone DDL (bayanbox-schema.sql)
│   ├── routes/
│   │   └── api.php              # RBAC-protected route groups
│   └── resources/views/pdf/     # Referral poster Blade template
├── database/
│   └── schema/                  # Full PostgreSQL DDL with enum & indexes
├── frontend/          # React PWA (Vite + Tailwind + Leaflet)
│   ├── src/
│   │   ├── components/          # MapView, DeliveryCostPreview
│   │   ├── pages/
│   │   │   ├── hub/             # Scanner, Inventory (OTP release)
│   │   │   ├── rider/           # Batches, Wallet (GPS telemetry)
│   │   │   ├── customer/        # Tracking, Suki Points
│   │   │   └── affiliate/       # Referral QR poster
│   │   └── services/            # offlineQueue, telemetry, eta
│   └── public/sw.js             # Service worker background sync
├── bayanbox-prd-v3.md           # Product Requirements Document
└── README.md
```

## Setup

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
# Edit .env: set DB_DATABASE, DB_USERNAME, DB_PASSWORD, MAPBOX_ACCESS_TOKEN, SEMAPHORE_API_KEY
php artisan key:generate
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\DatabaseSeeder
php artisan serve
```

### Frontend (React PWA)

```bash
cd frontend
npm install
npm run dev          # Vite dev server on :3000, proxies /api to :8000
npm run build        # Production build to dist/
```

## Key Features Implemented

| Feature | Files |
|---|---|
| **RBAC** (6 roles) | `Enums/Role.php`, `Middleware/EnsureRole.php`, `routes/api.php` |
| **Dynamic per-km pricing** | `Services/DeliveryPricingService.php`, `Services/DistanceMatrixService.php` |
| **Mapbox/ORS failover + Redis cache** | `Services/DistanceMatrixService.php`, `Support/Geohash.php` |
| **Semaphore SMS (OTP)** | `Services/SmsService.php` |
| **Double-entry wallet ledger** | `Services/WalletService.php` (pessimistic locking, unique tx hash) |
| **Parcel lifecycle + OTP release** | `Services/ParcelService.php`, `Controllers/Api/HubController.php` |
| **Geo-targeted promos** | `Services/PromoService.php`, `Controllers/Api/PromoController.php` |
| **Suki Points loyalty ledger** | `Services/LoyaltyService.php`, `Controllers/Api/LoyaltyController.php` |
| **Affiliate referral QR poster (PDF)** | `Services/AffiliateService.php`, `Controllers/Api/AffiliateController.php`, `resources/views/pdf/referral-poster.blade.php` |
| **Offline IndexedDB queue** | `frontend/src/services/offlineQueue.js` (1,000-entry cap, NFR 6.2) |
| **50m GPS telemetry** | `frontend/src/services/telemetry.js` |
| **1.3x ETA buffer** | `frontend/src/services/eta.js` |
| **Hub barcode scanner** | `frontend/src/pages/hub/HubScanner.jsx` (html5-qrcode, offline queue) |
| **Rider batch routes** | `frontend/src/pages/rider/RiderBatches.jsx` |
| **Customer 3-marker tracking map** | `frontend/src/pages/customer/CustomerTracking.jsx` |
| **Delivery cost calculator (Leaflet pin)** | `frontend/src/components/DeliveryCostPreview.jsx` |

## API Routes

| Method | Path | Roles |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/track/{tracking}` | public |
| POST | `/api/delivery/calculate` | any auth |
| GET | `/api/hub/inventory` | staff, admin |
| POST | `/api/hub/intake` | staff, admin |
| POST | `/api/hub/parcels/{tracking}/release` | staff, admin |
| POST | `/api/rider/telemetry` | rider, admin |
| GET | `/api/rider/batches` | rider, admin |
| POST | `/api/promos/apply` | any auth |
| POST | `/api/sync/offline-queue` | any auth |
| GET | `/api/admin/dashboard` | admin |
| GET | `/api/wallets` | any auth |

Full route listing in `backend/routes/api.php`.

## Financial Model

- **Delivery fee**: `baseFare + max(0, excessKm × perKmRate) × surge`
- **Split**: 85% rider / 15% platform (configurable per municipality)
- **COD**: Rider locks prepaid wallet; on delivery, cash collected replenishes it
- **Double-entry**: Every transaction creates a `ledger_transaction` row with `counterparty_wallet_id` and unique `transaction_hash` for idempotency