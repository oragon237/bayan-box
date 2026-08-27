# BeCoolBox — PRD v1

> **Product**: BeCoolBox (formerly BayanBox) — Provincial Last-Mile Logistics & Local E-Commerce Platform  
> **Status**: Implemented as of 2026-08-27  
> **Stack**: Laravel 11 (PHP 8.2) + React 18 (Vite) + PostgreSQL 16

---

## 1. Product Overview

BeCoolBox is a **"phygital" (physical + digital) provincial logistics orchestration platform** that connects local micro-merchants (MSMEs), community hubs (sari-sari stores), riders, customers, and skilled workers in Philippine provinces.

### Core Value Propositions

1. **B2B Packaging Marketplace** — Merchants buy packing supplies (bubble wrap, thermal labels, mailers) at bulk rates using Suki Points or cash.
2. **B2C Local E-Commerce Marketplace** — Merchants list products; customers browse, add to cart, and checkout with flexible payment (GCash/Maya/COD).
3. **BeCoolBox Mall** — Admin-owned flagship store selling official provincial goods and wholesale packaging; 100% of sales route to platform earnings.
4. **Last-Mile Delivery** — Dynamic per-km delivery fee calculator; round-robin rider assignment; live GPS tracking.
5. **Suki Points Loyalty** — Points earned on purchases and parcel pickups, redeemable for packaging supplies.
6. **Affiliate Referral** — Trackable referral codes with per-product commission percentages.
7. **Skilled Worker Marketplace** — Verified local workers (aircon cleaning, plumbing, electrical) with booking, reviews, and official badges.
8. **Multi-Party Ledger** — Double-entry wallet system with automated financial splits (merchant, platform, affiliate, rider, hub, provider).

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

### 2.2 PWA Features

- Fullscreen display (`display: fullscreen` + `display_override`)
- Service worker with Workbox (precaching + runtime caching for Mapbox tiles)
- Offline sync queue (`POST /api/sync/offline-queue`)
- Auto-update registration

---

## 3. Role Definitions

| Role | Description | Frontend Tab Bar |
|---|---|---|
| **Admin** | Platform owner; manages verification, riders, merchants, mall, dispatch | Home, Verify, Merchants, Riders, Mall |
| **Staff** | Hub agent; manages parcel intake/release, mall inventory, dispatch, sales | Home, Scan, Inventory, Dispatch, Mall |
| **Rider** | Delivery rider; batch routes, GPS telemetry, doorstep deliveries | Home, Route, Deliveries, Wallet, Track |
| **Merchant** | Local seller; lists products, manages verification documents, shops | Home, Products, Profile, Cart, Suki |
| **Customer** | End-user; browses marketplace, tracks parcels, earns Suki points | Home, Cart, Track, Suki |
| **Provider** | Skilled worker; manages skills, profile picture, reviews, official badge | Home, Profile, Track, Delivery |

---

## 4. Modules

### 4.1 Authentication & Registration

**Registration** (`POST /api/auth/register`):
- Default status: `pending_verification` for merchants, `active` for all other roles
- Merchants submit: `dti_sec_number`, `government_id_url`, `business_permit_url`, `picture_url`, `verification_message`
- Referral code linking (affiliate)

**Login** (`POST /api/auth/login`): phone + password → Sanctum token.

### 4.2 Merchant Verification Workflow

**States**: `pending_verification` → `active` / `rejected`

**Admin endpoints**:
- `GET /api/admin/merchants/pending` — queue
- `POST /api/admin/merchants/{id}/approve` — sets `active`, `verified_at`, provisions `merchant_earnings` wallet, sends SMS
- `POST /api/admin/merchants/{id}/reject` — sets `rejected`, stores reason

**Business rule**: Pending merchants cannot create products (403).

### 4.3 Merchant Profile & Documents

**Merchant-side** (`/merchant/profile`):
- Upload/edit: merchant photo, DTI/SEC number, government ID image, business permit image, verification message, address (barangay + municipality)
- `GET /api/merchant/profile`, `PUT /api/merchant/profile`

**Admin-side** (`/admin/merchant-list` → "View details"):
- Displays all submitted documents as images + DTI number + message
- Approve / Activate / Deactivate actions

### 4.4 Local E-Commerce Marketplace

#### 4.4.1 Products (Merchant CRUD)

| Field | Type | Notes |
|---|---|---|
| name | string | Max 150 |
| description | text | Optional |
| price | decimal(10,2) | Required |
| sale_price | decimal(10,2) | Nullable — ON SALE when set |
| stock | integer | |
| category | varchar(50) | Fresh Produce, Home Cooks, Local Crafts, Packaging, etc. |
| status | varchar(20) | active / archived |
| availability | varchar(20) | available / out_of_stock / unavailable |
| image_url | varchar(255) | Main product image |
| suki_points_award | integer | Per-product Suki Points |
| affiliate_percentage | decimal(5,2) | 0–50% commission for referrers |
| is_official_mall | boolean | BeCoolBox Mall flag |

**Image upload**: `POST /api/upload` → GD-optimized JPEG (max 1200px, 82% quality) → public storage URL.

**Gallery**: `product_images` table (ordered, multiple images per product).

**Merchant endpoints** (`/api/merchant/products`):
- `GET` — list my products (paginated)
- `POST` — create (requires verified merchant)
- `PUT /{id}` — update
- `DELETE /{id}` — archive

#### 4.4.2 Storefront

**Public/authenticated endpoints**:
- `GET /api/products` — paginated, active + in-stock + available, with `is_official_mall` pinned to top, `reviews_count` + `reviews_avg_rating`
- `GET /api/products/categories` — distinct categories
- `GET /api/products/{id}` — detail with reviews, images, ratings, `can_review` flag
- `GET /api/products/{id}/related` — behavioral: purchase co-occurrence (×3 weight) + view co-occurrence + same-category fallback

#### 4.4.3 Shopping Cart

**Endpoints**:
- `GET /api/cart` — current user's cart with products
- `POST /api/cart/sync` — authoritative sync (upserts + deletes absent rows)
- `DELETE /api/cart/items/{productId}` — remove an item

**Auto-sync**: Frontend debounces cart changes to the server (800ms) so cart persists across sessions.

#### 4.4.4 Checkout

**`POST /api/checkout`**:
- Accepts: `fulfillment_type` (pickup/delivery), `payment_method` (gcash/maya/cod), `hub_id`, `delivery_address`, `lat/lng`, `referral_code`
- Single `DB::transaction`: validates stock (with `lockForUpdate`), creates order + order_items, conditional decrement, clears cart

**Payment methods**:
- GCash / Maya → `status = 'paid'`
- COD → `status = 'pending_payment'`

#### 4.4.5 Product Reviews & Ratings

- `POST /api/products/{id}/review` — **only verified buyers** (customer with a paid/completed order for the product)
- One review per (user, product) — upsert
- `GET /api/products/{id}/reviews` — paginated

#### 4.4.6 Product View Tracking

- `GET /api/products/{id}` auto-logs a view in `product_views` (throttled to 1 per 6h per user)
- Used by the related-products engine

### 4.5 BeCoolBox Mall (Admin-Owned Flagship Store)

**Concept**: Special admin-owned product catalog (`is_official_mall = true`, merchant_id = admin user). Products carry a "BeCoolBox Official" badge and are pinned to the top of the storefront.

**Financial split** (override from regular marketplace):
- **100% of retail price** → `admin_earnings` wallet
- **0% merchant payout** (admin owns inventory)
- **0% platform commission** (already retained)
- Affiliate payout deducted from admin share
- Suki Points awarded normally

**Admin endpoints** (`/api/admin/mall/products`): full CRUD with image upload, gallery, sale price, availability.

**Staff endpoint** (`GET /api/staff/mall/inventory`): stock visibility.

### 4.6 Delivery Assignment & Round-Robin

**Engine**: `DeliveryAssignmentService`

**Rules**:
- Only doorstep-delivery orders (`fulfillment_type = 'delivery'`) with `paid` or `pending_payment` status, no rider assigned yet
- Round-robin: pick the **active rider with the fewest current active deliveries** (tie-break by ID)
- On **refuse**: clear rider, set `status = 'pending_assignment'`, then auto-reassign to the next rider

**Rider endpoints**:
- `GET /api/rider/deliveries` — my assigned deliveries
- `POST /api/rider/deliveries/{id}/refuse` — refuse → auto-reassign round-robin
- `POST /api/rider/deliveries/{id}/out-for-delivery`
- `POST /api/rider/deliveries/{id}/deliver`

**Staff endpoints**:
- `GET /api/staff/deliveries/unassigned` — dispatch queue
- `POST /api/staff/deliveries/{id}/assign` — round-robin assign
- `GET /api/staff/sales/today` — order count, gross sales, delivery fees, total revenue

**Status flow**: `paid` → `assigned` → `out_for_delivery` → `delivered`

### 4.7 Admin Management

**Rider management** (`/api/admin/riders`):
- List with active delivery count
- View, edit (name, email, municipality, status), deactivate

**Merchant management** (`/api/admin/merchants`):
- List with status filter (All / Pending / Active / Deactivated / Rejected)
- View documents (DTI, gov ID, permit, photo, message)
- Approve, activate, deactivate, reject

**Admin also has access to**: staff dispatch, rider routes, mall management, delivery rate settings, hub CRUD, promo CRUD, user list.

### 4.8 Loyalty (Suki Points)

**Earning**:
- Purchase reward: per-product `suki_points_award` (set by merchant)
- Fast pickup reward: on parcel pickup
- Doorstep upgrade: points deducted for door-step delivery

**Redeeming**:
- `POST /api/loyalty/packaging/redeem` — points for packaging supplies
- Points balance tracked in `loyalty_points` ledger

### 4.9 Affiliate Referral

- Each user has a unique `affiliate_code`
- QR poster generation for hubs
- Per-product `affiliate_percentage` (0–50%) — referrer earns that % of the purchased item total
- Prevented: self-referral

### 4.10 Provider (Skilled Worker)

**Profile** (`/api/provider/profile`):
- Skills (toggle chips: Aircon Cleaning, Plumbing, Electrical Repair, General Handyman, etc.)
- Profile picture upload
- Custom rate toggle

**Reviews**:
- `POST /api/providers/{id}/review` — **only customers with a completed booking**
- One review per (customer, provider)
- `GET /api/providers/{id}/reviews` — paginated

**Badges**:
- `is_verified` — verified provider badge
- `is_official` — "Official BeCoolBox Worker" badge (set by admin)

### 4.11 Wallet & Multi-Party Ledger

**Double-entry wallet system** (`WalletService`):
- `rider_prepaid` — locks COD; receives delivery fee rider share
- `merchant_earnings` — marketplace sale payouts (90% of retail)
- `platform_earnings` — platform commission (10%), delivery fee platform share, pickup fee platform share
- `admin_earnings` — BeCoolBox Mall sales (100%), unassigned rider/hub fees
- `affiliate_payout` — referral commission payouts
- `provider_earnings` — skilled worker booking payouts

**Wallet operations**: credit, debit, transfer, `ensureWallet` (auto-provision).

### 4.12 Logistics (Parcel Tracking)

**Rider batch routes**:
- `GET /api/rider/batches` — assigned delivery batches
- `POST /api/rider/batches/{batch}/parcels/{parcelId}/deliver` — mark delivered with proof photo

**Hub operations**:
- `POST /api/hub/intake` — scan inbound parcel
- `POST /api/hub/parcels/{tracking}/reconcile` — confirm receipt
- `POST /api/hub/parcels/{tracking}/release` — release to rider (OTP)
- `POST /api/hub/parcels/{tracking}/return` — mark returned

**Public tracking**: `GET /api/track/{tracking}` — live 3-marker map (origin, destination, rider GPS).

**Dynamic delivery pricing**: `POST /api/delivery/calculate` — per-km rate with municipality/barangay multipliers.

### 4.13 Skilled Worker Bookings

- `POST /api/bookings` — customer creates a booking (service, date, address)
- `POST /api/bookings/{id}/accept` — provider accepts
- `POST /api/bookings/{id}/complete` — provider marks done; escrow release to provider earnings wallet

### 4.14 Promos

- Admin CRUD: `GET /api/admin/promos`, `POST /api/admin/promos`, `POST /api/admin/promos/{id}/toggle`
- Apply: `POST /api/promos/apply` — flat discount on transaction

---

## 5. Financial Split Rules

### 5.1 Regular Marketplace Sale

| Party | Share | Type |
|---|---|---|
| Merchant | 90% of item price minus affiliate | `merchant_earnings` wallet |
| Platform | 10% of item price | `platform_earnings` wallet |
| Affiliate | Per-product affiliate_percentage of item price | `affiliate_payout` wallet |
| Customer | Per-product suki_points_award | Suki Points |

### 5.2 BeCoolBox Mall Sale

| Party | Share | Type |
|---|---|---|
| Admin (Platform) | 100% of item price minus affiliate | `admin_earnings` wallet |
| Affiliate | Per-product affiliate_percentage | `affiliate_payout` wallet |
| Customer | Per-product suki_points_award | Suki Points |
| Merchant | 0% (admin owns inventory) | — |
| Platform commission | 0% (already retained) | — |

### 5.3 Delivery Fee Split

| Party | Share | Type |
|---|---|---|
| Rider | 85% of delivery fee | `rider_prepaid` wallet |
| Platform | 15% of delivery fee | `platform_earnings` wallet |

### 5.4 Pickup (Click-and-Collect) Fee

Flat ₱10 handling fee:
| Party | Share | Type |
|---|---|---|
| Hub staff | ₱5 | `merchant_earnings` wallet |
| Platform | ₱5 | `platform_earnings` wallet |

### 5.5 Skilled Worker Booking

| Party | Share | Type |
|---|---|---|
| Provider | `provider_payout` (quoted - commission) | `provider_earnings` wallet |
| Platform | `platform_commission` | `platform_earnings` wallet |

---

## 6. Database Schema

### 6.1 Core Tables

| Table | Purpose |
|---|---|
| `users` | All roles (admin, staff, rider, merchant, customer, provider) |
| `provider_profiles` | Provider skills, verification, picture, official badge |
| `service_categories` | Skilled worker services (rates, commission) |
| `hubs` | Community sari-sari store hubs |
| `delivery_rate_settings` | Per-km pricing matrix (municipality, barangay) |
| `parcels` | Inbound logistics parcels |
| `parcel_status_history` | Status audit trail |
| `delivery_batches` | Rider batch routes |
| `delivery_batch_parcels` | Batch-parcel pivot |
| `rider_locations` | GPS telemetry |
| `addresses` | Saved addresses |
| `bookings` | Skilled worker bookings |
| `wallets` | Double-entry wallets (per user + type) |
| `ledger_transactions` | Wallet audit trail |

### 6.2 Marketplace Tables

| Table | Purpose |
|---|---|
| `products` | Merchant + Mall products (price, sale_price, stock, availability, is_official_mall) |
| `product_images` | Gallery images (ordered) |
| `product_views` | View tracking for behavioral related products |
| `product_reviews` | Verified-buyer reviews (rating, review) |
| `cart_items` | Temp cart storage (per user + product) |
| `orders` | Purchase orders (fulfillment, payment, status, rider assignment) |
| `order_items` | Line items with price-at-purchase snapshot |
| `packaging_items` | Packaging supplies for Suki Points redemption |
| `packaging_redemptions` | Redemption records |

### 6.3 Loyalty & Promo Tables

| Table | Purpose |
|---|---|
| `loyalty_points` | Suki Points ledger |
| `promo_codes` | Promo CRUD (flat discount) |
| `promo_redemptions` | Promo usage records |

### 6.4 Provider Tables

| Table | Purpose |
|---|---|
| `provider_profiles` | Skills, picture, badges, verification |
| `provider_reviews` | Customer reviews with rating |

---

## 7. Demo Users

All passwords: `password`

| Role | Name | Phone |
|---|---|---|
| Admin | BayanBox Admin | 09170000001 |
| Staff | Nena Sari-Sari | 09170000002 |
| Rider | Rico the Rider | 09170000003 |
| Rider | Berto the Rider | 09175550000 |
| Merchant | Aling Maria Merch | 09170000004 |
| Customer | Juan Dela Cruz | 09170000005 |
| Provider | Mang Cardo Pro (official) | 09170000006 |
| Provider | Ate Belen Aircon | 09170000007 |
| Provider | Kuya Dom Plumber | 09170000008 |
| Provider | Manong Ely Electrician | 09170000009 |
| Provider | Nanay Imelda Handyman | 09170000010 |

---

## 8. Running the System

```bash
# Backend
cd backend
composer install
cp .env.example .env           # configure DB, APP_URL, etc.
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=Database\\Seeders\\DatabaseSeeder
php artisan serve --host=0.0.0.0 --port=8000

# Frontend
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

**Environment notes**:
- `APP_URL=http://localhost:8000` in `.env` (for image URLs)
- `SEMAPHORE_API_KEY` optional (SMS skipped + logged when unset)
- Storage: `php artisan storage:link` (for uploaded images)
- GD extension required for image optimization
- PostgreSQL 16 with `pg_hba.conf` set to `trust` for local dev

---

## 9. Design System

Colors: Purple brand (`bayan-*` scale, core `#673de6`) + deep charcoal (`ink-*`) + amber accent.
Typography: DM Sans (Google Fonts).
Component patterns: Dark sticky nav, gradient text, dark sections with soft glow orbs, rounded-2xl cards, small filled badge chips, lift shadows.