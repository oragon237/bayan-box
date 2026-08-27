# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Project "BayanBox" (BodegaBarangay) — Provincial Last-Mile Logistics OS

**Version:** 4.0.0  
**Author:** Lead Product Manager & Tech Lead  
**Target Architecture:** React PWA (Frontend), Laravel (Backend API), PostgreSQL (Relational DB), Mapbox/OSM (Maps), Semaphore (SMS API)

---

## 1. Executive Summary & Product Vision

### 1.1 Objective
**BayanBox** (also referred to as *BodegaBarangay*) is a "phygital" (physical + digital) logistics orchestration platform designed to coordinate the "last 5 kilometers" of commerce in Philippine provinces [71, 92]. The platform leverages existing local micro-merchants (primarily *sari-sari* stores, local bakeries, and pharmacies) as secure community parcel hubs [56, 72, 92]. By consolidating inbound volumes from national carriers (e.g., J&T, Flash, Ninja Van) at a single municipal node and distributing them to neighborhood hubs, BayanBox dramatically lowers last-mile delivery fees, eliminates failed delivery attempts, and streamlines reverse logistics (returns) [56, 72, 91, 142].

### 1.2 Strategic Moat & Differentiation
Unlike national e-commerce giants (Shopee, Lazada, TikTok Shop) that operate transaction-first platforms, BayanBox is a hyper-local infrastructure layer built on community trust [14, 118]. The system establishes deep offline defensibility by partnering with trusted community figures (such as *sari-sari* store owners) and providing local online merchants with dedicated local B2B features (like micro-warehousing, bulk packaging supplies, and regional returns consolidation) [4, 19, 56, 120].

---

## 2. Comprehensive User Roles & Authorization

The system operates under a **Role-Based Access Control (RBAC)** architecture. A single PostgreSQL database holds all users, utilizing a unified authentication gateway while segregating operational views across five specific roles [67, 112].

```
                     ┌──────────────────────────┐
                     │ Unified Database (Users) │
                     └────────────┬─────────────┘
                                  │
         ┌────────────┬───────────┼───────────┬────────────┬────────────┐
         ▼            ▼           ▼           ▼            ▼            ▼
     [ Admin ]    [ Staff ]    [Rider]    [Merchant]   [Customer]  [Skilled Worker]
     Platform     Hub PWA      Logistics  Storefront & Tracking,   Job Claims,
     Dashboard    Inventory    Routings   Mktg Config  Cart & Buy   Standardized Rates
```

### 2.1 Admin (Platform Owner)
*   **Access Channel:** Desktop-optimized React Web Dashboard.
*   **Core Responsibilities:**
    *   System configuration (global handling fees, default delivery rates, commission rates, and per-kilometer calculators) [93].
    *   Accredit physical hubs (*sari-sari* stores, local pharmacies) and bind them to **Staff** accounts [92].
    *   Verify and approve **Riders** (including collecting background checks like Barangay/Police Clearances) [6, 96, 128].
    *   Disburse wallet withdrawals for Merchants, Riders, and Skilled Workers via GCash/Maya integrations [95, 113].
    *   Monitor the global financial ledger, transaction splits, disputes, and delivery success metrics [95, 112].

### 2.2 Staff (Local Hub Agent / Sari-Sari Store Owner)
*   **Access Channel:** Mobile-optimized Progressive Web App (PWA) with offline barcode scan caching [95, 112].
*   **Core Responsibilities:**
    *   **Inbound Intake:** Scan barcodes of incoming consolidated parcels from national carriers using the smartphone camera [95, 112].
    *   **Inventory Reconciliation:** Confirm receipt of parcels, triggering automated SMS notifications with secure OTPs via Semaphore [57, 95].
    *   **Secure Release:** Hand over parcels to consumers only after entering and validating the customer's secure OTP PIN [95, 112].
    *   **Reverse Hand-off:** Package and label returned parcels deposited by local sellers and dispatch them to returning riders [4, 57].

### 2.3 Rider ("Raider" / Local Courier)
*   **Access Channel:** Mobile-first PWA featuring Mapbox GPS navigation and background tracking telemetry [21, 95].
*   **Core Responsibilities:**
    *   **Rider Wallet Management:** Top up their personal prepaid wallet via GCash/Maya to accept and lock cash-on-delivery (COD) shipments [21, 95].
    *   **Batch Delivery Routes:** Receive structured batch lists of deliveries grouped by barangay clusters to maximize drop-off efficiency [21, 113].
    *   **Status Toggles:** Log physical status changes (e.g., *Out for Delivery*, *Delivered*, *Returned to Hub*) with mandatory photo proof [21].
    *   **COD Collection:** Reconcile cash collected at doorstep against their digital wallet balance [21, 95].

### 2.4 Merchant (Local Online Seller / MSME Affiliate)
*   **Access Channel:** Web portal and mobile PWA dashboard [112].
*   **Core Responsibilities:**
    *   **Product Upload & Inventory:** List local products with title, description, price, high-resolution photos, and physical stock limits [4].
    *   **Micro-Marketing Configurator:** Custom-set specific Suki Points rewards and custom Affiliate Referral Reward percentages (0%–50%) for individual products [4, 8].
    *   **Parcel Pre-Registration:** Upload outbound parcel details via CSV bulk import to generate regional tracking barcodes [4, 21].
    *   **Return Shield Dashboard:** Track consolidated regional returns, manage customer refunds, and coordinate return packaging [4, 120].
    *   **B2B Packaging Marketplace:** Buy packing materials at bulk wholesale rates using accumulated points or cash [4].

### 2.5 Customer (Local Shopper Affiliate)
*   **Access Channel:** High-performance, lightweight React PWA designed to bypass the Google Play Store [95, 112].
*   **Core Responsibilities:**
    *   **Hyper-Local Storefront Browsing:** Explore verified merchant products listed directly on the application homepage [4, 14, 53].
    *   **Add-to-Cart & Purchase:** Compile orders in a unified shopping cart, select shipping preferences, and pay via GCash/Maya escrow [21, 68].
    *   **Real-time Simple Tracking:** Follow active shipments and store-to-door deliveries with Mapbox navigation and ETAs [21, 95].
    *   **Suki Points & Referrals:** Track loyalty earnings from purchases and monitor affiliate commissions earned by sharing product links [8].

### 2.6 Skilled Worker (Verified Pro Provider)
*   **Access Channel:** Lightweight PWA integrated into the same core platform ecosystem.
*   **Core Responsibilities:**
    *   **Job Acceptance:** Receive and review real-time, SMS/PWA job notifications matching their verified skills [6].
    *   **Execution Logs:** Provide before/after photos upon completing service tasks to secure escrow payout approvals [6, 128].
    *   **Account Settlements:** Track completed earnings, active package rates, and custom commission structures configured by Admins [6, 97].

---

## 3. Detailed Functional Specifications & Modules

### 3.1 Promo Code System (Location-Targeted)
Unlike generic discount engines, the BayanBox Promo System is geo-targeted to drive localized behavioral shifts (e.g., prompting users to select specific underutilized neighborhood hubs) [121].

*   **FR-PROMO-001: Barangay Geofenced Codes.** The system must allow admins to issue promo codes linked specifically to specific barangays or hubs (e.g., code `#NenaSanJose` works only if the destination hub is \"San Jose Sari-Sari\").
*   **FR-PROMO-002: Consolidation Incentives.** The system must support volume-based promo codes (e.g., `3PARCELSGET20` triggers a flat ₱20 discount if a customer picks up 3 or more consolidated parcels during a single transaction).
*   **FR-PROMO-003: Expiry and Caps.** All promo codes must have strict relational controls: maximum uses, expiry date-time triggers, and transaction-minimum conditions.

### 3.2 Suki Points System (Loyalty Engine)
This module builds recurring usage habits by giving high-utility local value back to shoppers, hub staff, and merchants [4].

*   **FR-LOY-001: Point Accrual Ledger.** Every successful transaction logs a positive entry in the relational `loyalty_points` table. Users must not see a simple flat balance column, but a real-time ledger list.
*   **FR-LOY-002: Customer Earn Rates.** Customers earn 1 point for every parcel picked up at a designated hub within 24 hours of arrival (incentivizing fast turnover and high hub shelf space availability) [95].
*   **FR-LOY-003: Merchant Earn & Redeem.** Local merchants earn points for every parcel they drop off for return consolidation [4, 120]. They can redeem these points in the **Packaging Marketplace** to buy physical packaging supplies (e.g., 100 points = 1 roll of thermal paper) [4].
*   **FR-LOY-004: Point Burn Options.** Customers can burn points to redeem \"Doorstep Upgrade\" deliveries (e.g., 50 points = Free delivery upgrade from neighborhood hub to their doorstep within a 3km radius) [93].

### 3.3 Affiliate & Micro-Referral System (Viral Organic Growth)
A double-sided referral program optimized for high physical trust networks in provincial barangays [118].

*   **FR-AFF-001: Sari-Sari Store Referral QR.** Every accredited hub owner is automatically assigned a unique referral code. The system must render a downloadable and printable PDF poster containing their custom Referral QR Code.
*   **FR-AFF-002: Passive Residual Commission.** When a customer registers by scanning a Hub Owner's poster, the backend creates a foreign-key association (`referred_by_id`). The system automatically credits the Hub Owner’s wallet with a permanent micro-fee (e.g., ₱2.00) on *every future parcel* that customer processes through that hub.
*   **FR-AFF-003: Merchant-to-Merchant (B2B) Referrals.** Existing merchants can refer other local e-commerce sellers. Upon the referred merchant completing their first 10 consolidated shipments, the referring merchant is credited with a 30-day \"Return Shield Credit\" (saving them 50% on all returns) [120].

### 3.4 Simple Real-Time Map & Tracking with ETAs
A low-bandwidth mapping UI that provides transparency to users without overloading budget smartphones or billing excessive API calls [95].

*   **FR-MAP-001: Leaflet/OSM Vector Rendering.** The tracking map must render via Leaflet.js utilizing OpenStreetMap tiles to minimize frontend package sizes [67, 95].
*   **FR-MAP-002: Telemetry Updates.** The Rider PWA will push current coordinate strings `(latitude, longitude)` to the server only when the device detects a spatial movement exceeding 50 meters, reducing mobile data consumption.
*   **FR-MAP-003: Three-Marker Overlay.** The tracking view must overlay exactly three visual points: (1) Origin Hub, (2) Destination, and (3) Active Rider Location. If Rider telemetry goes quiet for more than 15 minutes, the map must badge the rider marker with a \"Last seen X mins ago\" notification.
*   **FR-MAP-004: Provincial ETA Buffer.** The system must calculate delivery windows utilizing a 1.30x multiplier on baseline OpenRouteService directions (e.g., a calculated 10-minute route shows as a friendly, realistic \"13 to 20 minutes\" arrival window to absorb provincial delays like farm traffic or tricycle bottlenecks).

### 3.5 Offline-Capable Scanning & Network Fallbacks
Ensuring uninterrupted workflows for riders and hub operators who navigate regions with unstable mobile signals [95].

*   **FR-OFF-001: IndexedDB Offline Queue.** When the Staff or Rider PWA performs a parcel scan or status update while the browser is offline (`navigator.onLine === false`), the action must be captured locally using browser IndexedDB storage [95].
*   **FR-OFF-002: Service Worker Background Sync.** The PWA must use a background Service Worker to continuously check network status. The instant connectivity is restored, the offline queue must push all cached scans and GPS coordinates to the Laravel API sequentially [95].
*   **FR-OFF-003: Semaphore SMS Gateway Failover.** If a customer does not have mobile data active, the Laravel backend must route transit status and secure pickup OTP PINs directly as SMS text messages using the Semaphore SMS API [57, 95].

### 3.7 Integrated Local E-Commerce Marketplace
This module adds a merchant-driven product marketplace to the BayanBox platform, transforming it from a pure shipping/logistics carrier into an all-in-one provincial commerce operating system [16, 35, 42, 50, 72].

*   **FR-MKT-001: Merchant Product Upload & Cataloging.** Merchants must have a secure panel in the React PWA to list physical products. Forms must validate name, description, category, unit price, stock count, and support image uploading to local storage or an offline-friendly AWS S3 bucket [21, 100].
*   **FR-MKT-002: Merchant Suki Points Configuration.** For every uploaded product, merchants can set custom Suki Points allocations (e.g., set to award 10 points upon successful customer purchase). These points are funded by the merchant as a customer retention discount and tracked in the global ledger [4].
*   **FR-MKT-003: Merchant Affiliate Reward Customization.** For every product, merchants can specify a custom affiliate payout percentage (e.g., 5% or 10% of the retail price). When another customer or local influencer shares the product link and generates a sale, the system calculates and routes this exact commission to the referrer's wallet [8].
*   **FR-MKT-004: Unified Homepage Storefront.** The main landing page of the customer React PWA must display a clean, searchable grid of all active, in-stock local products [2, 53]. Products should be filterable by category (e.g., Fresh Produce, Food/Eateries, Local Crafts) and proximity to the user's nearest Hub [53, 61, 106].
*   **FR-MKT-005: Shopping Cart & Checkout Engine.** Customers can add multiple items from different local merchants into a single unified cart [61, 108]. At checkout, the cart must execute an inventory check (`stock >= quantity`) to prevent over-ordering before routing to payment gateways [105, 108, 134].
*   **FR-MKT-006: Dual Fulfillment Gateway Selection.** During checkout, customers must select their preferred fulfillment mode:
    *   *Free Click-and-Collect:* The order is shipped to their designated BayanBox Hub (*sari-sari* store) for secure self-pickup at ₱0 shipping [56, 146].
    *   *Doorstep Delivery:* The order is routed to the nearest available Rider and delivered directly to their doorstep, with the shipping fee dynamically calculated in real-time by the Mapbox Per-Kilometer Rate Calculator [21, 94].
*   **FR-MKT-007: Automated Multi-Party Ledger Split.** Upon successful transaction completion, the backend must execute an automated ledger split in the `ledger_transactions` table to instantly route funds:
    *   **Merchant Share:** 90% of the product retail price (reflecting a 10% platform commission rake) [2, 61, 98].
    *   **Platform Commission:** 10% platform retention rake [2, 61, 98].
    *   **Affiliate Reward:** If a valid referral token was attached to the order item, the specified product-level affiliate percentage is calculated and deducted from the merchant's share, then credited to the referring customer's wallet [8].
    *   **Customer Suki Points:** The product-specified loyalty points are credited to the customer's point balance [4].
    *   **Rider and Hub Share:** Delivery surcharges are routed to the rider (85%) and platform (15%) [20, 94]. If click-and-collect is used, a ₱10 handling fee is split between the hub staff (₱5) and platform (₱5) [94].

### 3.6 Dynamic Per-Kilometer Rate Calculator
This module replaces static delivery rates with variable, distance-based pricing to prevent margin loss over extended rural delivery routes while ensuring fair payouts for local motorcycle/tricycle riders [2, 20, 61, 79, 93].

*   **FR-CALC-001: Geolocation Coordinates Query.** The system must capture precise latitude and longitude points for the dispatch source (e.g., Hub or Merchant location) and destination (Customer home address).
*   **FR-CALC-002: Distance API Retrieval.** The Laravel backend must securely query the **Mapbox Directions/Matrix API** or **OpenRouteService (ORS)** to extract the actual road distance in meters (rather than raw "crow-flies" straight-line distances) [21, 67, 122].
*   **FR-CALC-003: Variable Base Rates Config.** Admins must have an interface to define a "Base Distance" (e.g., first 2.0 kilometers) and a "Base Fare" (e.g., ₱35.00) tailored to specific municipalities [79, 93].
*   **FR-CALC-004: Incremental Kilometer Surcharge.** For every kilometer exceeded beyond the Base Distance, the calculator must apply an adjustable "Per-Km Rate" (e.g., ₱10.00/km). Partial excess kilometers must be calculated proportionally (e.g., 2.5km excess distance at ₱10/km = ₱25.00 surcharge).
*   **FR-CALC-005: Platform & Rider Revenue Splits.** The generated total delivery fee must be split programmatically in the wallet ledger using adjustable admin parameters (e.g., 85% directly to the Rider wallet to keep them incentivized, and 15% to the Platform) [20, 93].
*   **FR-CALC-006: Weather & Night Surge Multipliers.** Admins must have the power to manually or programmatically toggle a "Surge Multiplier" (e.g., 1.5x delivery fees during active typhoon signals or night hours) to secure rider availability.

---

## 4. Technical Architecture & Database Schemas

### 4.1 PostgreSQL Schema Design
The database uses strict relational foreign key constraints to maintain the absolute financial and logical integrity of the ledger [67, 86].

```sql
-- 1. Enum Definition
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'rider', 'merchant', 'customer', 'provider');

-- 2. Unified Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    affiliate_code VARCHAR(15) UNIQUE NOT NULL,
    referred_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hubs Table
CREATE TABLE hubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    capacity_limit INT NOT NULL DEFAULT 500,
    current_parcel_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Service Providers & Settings Table (Verified Pros)
CREATE TABLE provider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_badge_assigned_at TIMESTAMP,
    skills VARCHAR(255)[], -- Array of services provided
    custom_rate_enabled BOOLEAN DEFAULT FALSE, -- Override standard packyaw rates
    custom_commission_override DECIMAL(5,2) DEFAULT NULL, -- Null defaults to global category rates
    verification_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Service Rates & Global Categories Table
CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., 'Aircon Cleaning', 'Plumbing'
    base_pakyaw_rate DECIMAL(10,2) NOT NULL, -- Standard rate
    global_commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00, -- e.g., 15.00 = 15%
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Delivery Rate Settings Table (Per-Km Calculator Config)
CREATE TABLE delivery_rate_settings (
    id SERIAL PRIMARY KEY,
    municipality_name VARCHAR(100) UNIQUE NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    base_distance_km DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    platform_percentage DECIMAL(5, 2) NOT NULL DEFAULT 15.00, -- 15% platform, 85% rider
    surge_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Parcels Table
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    shipper_name VARCHAR(100),
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    hub_id INT REFERENCES hubs(id) ON DELETE RESTRICT,
    rider_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'received_at_hub', -- received_at_hub, out_for_delivery, delivered, returned
    otp_code VARCHAR(6) NOT NULL,
    cod_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Calculated delivery metrics
    delivery_distance_km DECIMAL(6, 2) DEFAULT 0.00,
    calculated_delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bookings Table (Skilled Services)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    provider_id INT REFERENCES users(id) ON DELETE SET NULL,
    service_id INT REFERENCES service_categories(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, completed, cancelled
    booking_date TIMESTAMP NOT NULL,
    address TEXT NOT NULL,
    
    -- Financial tracking
    quoted_amount DECIMAL(10, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) NOT NULL,
    provider_payout DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Products Table (Local Marketplace)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    suki_points_award INT DEFAULT 0, -- Custom loyalty points given to customer
    affiliate_percentage DECIMAL(5, 2) DEFAULT 0.00, -- Custom referral reward % given to affiliate sharing this link
    image_url VARCHAR(255),
    category VARCHAR(50) DEFAULT 'General', -- e.g., 'Fresh Produce', 'Home Cooks', 'Local Crafts'
    status VARCHAR(20) DEFAULT 'active', -- active, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Cart Items Table (Temp storage for shopper PWA)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_customer_product UNIQUE (customer_id, product_id)
);

-- 12. Orders Table (E-Commerce Purchase Orders)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Sum of product costs
    shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Calculated dynamically if doorstep delivery
    fulfillment_type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery'
    hub_id INT REFERENCES hubs(id) ON DELETE SET NULL, -- Dest hub if pickup selected
    rider_id INT REFERENCES users(id) ON DELETE SET NULL, -- Assigned delivery rider
    delivery_address TEXT, -- Raw destination string if delivery
    latitude DECIMAL(10, 8), -- Dest coordinate
    longitude DECIMAL(11, 8), -- Dest coordinate
    status VARCHAR(30) DEFAULT 'pending', -- pending, paid, out_for_delivery, completed, cancelled
    referring_affiliate_id INT REFERENCES users(id) ON DELETE SET NULL, -- Customer who referred this purchase order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Order Items Table (Detailed purchase receipt breakdown)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10, 2) NOT NULL, -- Lock-in price at timestamp
    suki_points_awarded INT DEFAULT 0, -- Product-specified points earned at purchase
    affiliate_payout_amount DECIMAL(10, 2) DEFAULT 0.00 -- Calculated affiliate commission
);

-- 9. Wallets & Reconciled Ledger Table (Double-Entry Protection)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    wallet_type VARCHAR(30) NOT NULL, -- rider_prepaid, merchant_earnings, affiliate_payout, provider_earnings
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INT REFERENCES wallets(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL, -- positive for credit, negative for debit
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Laravel Backend API Implementation

#### **Role Authentication Middleware:**
*(Unchanged: Authenticates roles across system)*

#### **Rider Telemetry API Endpoint:**
*(Unchanged: Syncs coordinate arrays)*

#### **Dynamic Delivery Fee Calculator Service:**
This service interacts with the Mapbox API to fetch the exact distance matrix and calculate fees on the fly.

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class DeliveryPricingService
{
    /**
     * Calculate dynamic provincial delivery fee using Mapbox Directions API
     */
    public function calculateFee($originLat, $originLng, $destLat, $destLng, $municipality = 'Naga City')
    {
        // 1. Fetch settings for target municipality
        $settings = DB::table('delivery_rate_settings')
            ->where('municipality_name', $municipality)
            ->first();

        if (!$settings) {
            // Fallback default settings
            $settings = (object) [
                'base_fare' => 35.00,
                'base_distance_km' => 2.00,
                'per_km_rate' => 10.00,
                'platform_percentage' => 15.00,
                'surge_multiplier' => 1.00
            ];
        }

        // 2. Fetch driving distance from Mapbox API
        $mapboxToken = env('MAPBOX_ACCESS_TOKEN');
        $url = "https://api.mapbox.com/directions/v5/mapbox/driving/{$originLng},{$originLat};{$destLng},{$destLat}";
        
        $response = Http::get($url, [
            'access_token' => $mapboxToken,
            'geometries' => 'geojson',
            'overview' => 'simplified'
        ]);

        if ($response->failed() || !isset($response['routes'][0]['distance'])) {
            throw new \Exception("Unable to calculate route distance via Mapbox.");
        }

        // Mapbox returns distance in meters, convert to kilometers
        $distanceKm = $response['routes'][0]['distance'] / 1000.00;

        // 3. Apply pricing algorithm
        $baseDistance = (float) $settings->base_distance_km;
        $baseFare = (float) $settings->base_fare;
        $perKmRate = (float) $settings->per_km_rate;
        $surge = (float) $settings->surge_multiplier;

        $totalFee = $baseFare;

        if ($distanceKm > $baseDistance) {
            $excessDistance = $distanceKm - $baseDistance;
            $totalFee += ($excessDistance * $perKmRate);
        }

        // Apply Surge Multiplier
        $totalFee = $totalFee * $surge;

        // Round to nearest ₱1 for provincial coin convenience
        $totalFee = round($totalFee, 0);

        // 4. Calculate payouts
        $platformShare = round($totalFee * ($settings->platform_percentage / 100), 2);
        $riderShare = $totalFee - $platformShare;

        return [
            'distance_km' => round($distanceKm, 2),
            'total_delivery_fee' => $totalFee,
            'platform_share' => $platformShare,
            'rider_share' => $riderShare,
            'applied_surge' => $surge
        ];
    }
}
```

#### **E-Commerce Checkout & Multi-Party Split Ledger API:**
This endpoint handles multi-merchant cart checkouts, inventory stock deduction, and programmatically splits funds among merchants, the platform, customer affiliates, and delivery riders inside a single database transaction.

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\DeliveryPricingService;

class CheckoutController extends Controller
{
    protected $pricingService;

    public function __construct(DeliveryPricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    public function processPurchase(Request $request)
    {
        $request->validate([
            'fulfillment_type' => 'required|in:pickup,delivery',
            'hub_id' => 'required_if:fulfillment_type,pickup|nullable|exists:hubs,id',
            'delivery_address' => 'required_if:fulfillment_type,delivery|nullable|string',
            'latitude' => 'required_if:fulfillment_type,delivery|nullable|numeric',
            'longitude' => 'required_if:fulfillment_type,delivery|nullable|numeric',
            'referral_code' => 'nullable|string'
        ]);

        $customer = $request->user();
        $cartItems = DB::table('cart_items')
            ->join('products', 'cart_items.product_id', '=', 'products.id')
            ->where('cart_items.customer_id', $customer->id)
            ->select('cart_items.*', 'products.price', 'products.stock', 'products.merchant_id', 'products.suki_points_award', 'products.affiliate_percentage')
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['error' => 'Cart is empty.'], 400);
        }

        // Validate stock availability
        foreach ($cartItems as $item) {
            if ($item->stock < $item->quantity) {
                return response()->json(['error' => "Insufficient stock for item: {$item->product_id}"], 400);
            }
        }

        // Verify referral code to reward affiliate customers
        $affiliate = null;
        if ($request->referral_code) {
            $affiliate = DB::table('users')
                ->where('affiliate_code', $request->referral_code)
                ->where('id', '!=', $customer->id) // Prevent self-referral
                ->first();
        }

        DB::beginTransaction();
        try {
            // 1. Calculate Product Total
            $productTotal = 0;
            foreach ($cartItems as $item) {
                $productTotal += $item->price * $item->quantity;
            }

            // 2. Calculate Delivery Shipping Amount
            $shippingAmount = 0.00;
            $shippingDetails = null;
            if ($request->fulfillment_type === 'delivery') {
                // Fetch coordinates of nearest hub where we aggregate products or closest merchant
                $firstHub = DB::table('hubs')->first(); // Local dispatch anchor
                $shippingDetails = $this->pricingService->calculateFee(
                    $firstHub->latitude, $firstHub->longitude,
                    $request->latitude, $request->longitude,
                    'Naga City'
                );
                $shippingAmount = $shippingDetails['total_delivery_fee'];
            }

            // 3. Create Master Order Record
            $orderId = DB::table('orders')->insertGetId([
                'customer_id' => $customer->id,
                'total_amount' => $productTotal,
                'shipping_amount' => $shippingAmount,
                'fulfillment_type' => $request->fulfillment_type,
                'hub_id' => $request->hub_id,
                'delivery_address' => $request->delivery_address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'referring_affiliate_id' => $affiliate ? $affiliate->id : null,
                'status' => 'paid', // Simulating successful digital GCash escrow hold
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 4. Record Items & Process Relational Financial splits
            foreach ($cartItems as $item) {
                $itemTotal = $item->price * $item->quantity;
                $pointsAwarded = ($item->suki_points_award) * $item->quantity;

                // Calculate product-level affiliate commission
                $affiliatePayout = 0.00;
                if ($affiliate && $item->affiliate_percentage > 0) {
                    $affiliatePayout = round($itemTotal * ($item->affiliate_percentage / 100), 2);
                }

                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price_at_purchase' => $item->price,
                    'suki_points_awarded' => $pointsAwarded,
                    'affiliate_payout_amount' => $affiliatePayout
                ]);

                // Deduct merchant inventory stock
                DB::table('products')->where('id', $item->product_id)->decrement('stock', $item->quantity);

                // Financial Ledger: Pay Merchant (90% of base value, minus the affiliate commission)
                $merchantBasePayout = $itemTotal * 0.90; // 10% global platform commission rake
                $merchantFinalPayout = $merchantBasePayout - $affiliatePayout;
                
                $merchantWallet = DB::table('wallets')
                    ->where('user_id', $item->merchant_id)
                    ->where('wallet_type', 'merchant_earnings')
                    ->first();

                DB::table('wallets')->where('id', $merchantWallet->id)->increment('balance', $merchantFinalPayout);
                DB::table('ledger_transactions')->insert([
                    'wallet_id' => $merchantWallet->id,
                    'amount' => $merchantFinalPayout,
                    'description' => "E-Comm Order #{$orderId} item payout (less platform fee & affiliate cut)",
                    'created_at' => now()
                ]);

                // Financial Ledger: Pay Platform Commission
                $platformCommission = $itemTotal * 0.10;
                $adminWallet = DB::table('wallets')->where('wallet_type', 'admin_earnings')->first();
                if ($adminWallet) {
                    DB::table('wallets')->where('id', $adminWallet->id)->increment('balance', $platformCommission);
                    DB::table('ledger_transactions')->insert([
                        'wallet_id' => $adminWallet->id,
                        'amount' => $platformCommission,
                        'description' => "Platform 10% commission on Order #{$orderId}",
                        'created_at' => now()
                    ]);
                }

                // Financial Ledger: Pay Affiliate (routes calculated commission to customer affiliate's wallet)
                if ($affiliate && $affiliatePayout > 0) {
                    $affiliateWallet = DB::table('wallets')
                        ->where('user_id', $affiliate->id)
                        ->where('wallet_type', 'affiliate_payout')
                        ->first();

                    DB::table('wallets')->where('id', $affiliateWallet->id)->increment('balance', $affiliatePayout);
                    DB::table('ledger_transactions')->insert([
                        'wallet_id' => $affiliateWallet->id,
                        'amount' => $affiliatePayout,
                        'description' => "Affiliate payout for product referral on Order #{$orderId}",
                        'created_at' => now()
                    ]);
                }

                // Financial Ledger: Award Suki loyalty points to customer
                if ($pointsAwarded > 0) {
                    DB::table('loyalty_points')->insert([
                        'user_id' => $customer->id,
                        'points_change' => $pointsAwarded,
                        'reason' => "Loyalty points earned on order purchase #{$orderId}",
                        'created_at' => now()
                    ]);
                }
            }

            // 5. Handle Delivery Shipping Ledger Splitting
            if ($request->fulfillment_type === 'delivery' && $shippingDetails) {
                // Route 85% to rider wallet, 15% to platform wallet
                $riderWallet = DB::table('wallets')->where('wallet_type', 'rider_prepaid')->first(); // Rider pool / specific rider
                DB::table('wallets')->where('id', $riderWallet->id)->increment('balance', $shippingDetails['rider_share']);
                DB::table('ledger_transactions')->insert([
                    'wallet_id' => $riderWallet->id,
                    'amount' => $shippingDetails['rider_share'],
                    'description' => "Rider delivery share for Order #{$orderId}",
                    'created_at' => now()
                ]);

                if ($adminWallet) {
                    DB::table('wallets')->where('id', $adminWallet->id)->increment('balance', $shippingDetails['platform_share']);
                    DB::table('ledger_transactions')->insert([
                        'wallet_id' => $adminWallet->id,
                        'amount' => $shippingDetails['platform_share'],
                        'description' => "Platform delivery share for Order #{$orderId}",
                        'created_at' => now()
                    ]);
                }
            }

            // Clear Customer shopping cart
            DB::table('cart_items')->where('customer_id', $customer->id)->delete();

            DB::commit();

            return response()->json([
                'status' => 'purchase_completed',
                'order_id' => $orderId,
                'total_amount' => $productTotal,
                'shipping_amount' => $shippingAmount,
                'loyalty_points_earned' => DB::table('loyalty_points')->where('user_id', $customer->id)->where('reason', 'like', "%#{$orderId}")->sum('points_change')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Purchase processing failed: ' . $e->getMessage()], 500);
        }
    }
}
```

---

## 5. PWA Frontend Implementations

### 5.1 React Geolocation Watcher (Rider App)
*(Unchanged: High-accuracy telemetry pushes)*

### 5.2 React Customer Delivery Cost Calculator Preview Component
This component renders an interactive preview map using Leaflet. It calculates and displays the exact shipping fee to the customer in real-time when they drop their delivery pin.

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const DeliveryCostPreview = ({ hubCoords, userToken }) => {
  const [customerPin, setCustomerPin] = useState({ lat: null, lng: null });
  const [calculation, setCalculation] = useState({ distance: 0, fee: 0, loading: false });

  // Get current device location as starting pin
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCustomerPin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Error getting destination coordinate: ", err)
    );
  }, []);

  const calculateDynamicFee = async () => {
    if (!customerPin.lat || !customerPin.lng) return;

    setCalculation(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.post('/api/delivery/calculate', {
        origin_lat: hubCoords.lat,
        origin_lng: hubCoords.lng,
        dest_lat: customerPin.lat,
        dest_lng: customerPin.lng,
        municipality: 'Naga City'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setCalculation({
        distance: response.data.distance_km,
        fee: response.data.total_delivery_fee,
        loading: false
      });
    } catch (err) {
      console.error("Calculation failure: ", err);
      setCalculation(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-sm mx-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-2">🚚 Delivery Upgrade Preview</h3>
      <p className="text-sm text-gray-500 mb-4">Select your delivery pin to calculate exact last-mile rates.</p>
      
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded mb-4">
        <div>
          <span className="block text-xs text-gray-400 font-semibold uppercase">Estimated Distance</span>
          <span className="text-lg font-bold text-gray-700">{calculation.distance} km</span>
        </div>
        <div className="text-right">
          <span className="block text-xs text-gray-400 font-semibold uppercase">Doorstep Surcharge</span>
          <span className="text-2xl font-black text-green-600">₱{calculation.fee}</span>
        </div>
      </div>

      <button
        onClick={calculateDynamicFee}
        disabled={calculation.loading}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
      >
        {calculation.loading ? 'Calculating Real Road Route...' : 'Calculate Exact Delivery Fee'}
      </button>
    </div>
  );
};
```

### 5.3 React PWA E-Commerce Storefront, Cart, and Checkout Component
This frontend component displays local merchant products on the home screen of the user's mobile browser, allows managing quantities, and coordinates custom cart purchases, delivery routing toggles, and affiliate referral checkouts.

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const LocalMarketplaceHomepage = ({ userToken }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [fulfillment, setFulfillment] = useState('pickup'); // 'pickup' or 'delivery'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ lat: 13.6218, lng: 123.1948 }); // Naga default
  const [checkoutResult, setCheckoutResult] = useState(null);

  // Load products on render
  useEffect(() => {
    axios.get('/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error loading marketplace items:", err));
    
    // Attempt to parse referral code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Cannot exceed available merchant stock.");
          return prevCart;
        }
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, amount, stock) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + amount;
        return (newQty > 0 && newQty <= stock) ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      // First, save cart items temporarily in DB
      await axios.post('/api/cart/sync', { cart: cart.map(i => ({ product_id: i.id, quantity: i.quantity })) }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      // Execute order completion
      const res = await axios.post('/api/checkout', {
        fulfillment_type: fulfillment,
        hub_id: fulfillment === 'pickup' ? 1 : null, // Default local pilot hub
        delivery_address: fulfillment === 'delivery' ? deliveryAddress : null,
        latitude: fulfillment === 'delivery' ? gpsLocation.lat : null,
        longitude: fulfillment === 'delivery' ? gpsLocation.lng : null,
        referral_code: referralCode || null
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setCheckoutResult(res.data);
      setCart([]); // Reset Cart
      alert("Suki! Order has been processed successfully via GCash/Maya escrow.");
    } catch (err) {
      alert("Checkout failed: " + (err.response?.data?.error || err.message));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* 1. Header Banner */}
      <div className="bg-green-600 text-white p-4 shadow-md text-center">
        <h1 className="text-2xl font-black tracking-tight">🛒 BayanBox Local Marketplace</h1>
        <p className="text-xs text-green-100 mt-1">Support neighborhood merchants with direct same-day delivery!</p>
      </div>

      <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2. Product Listing Area */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-extrabold text-gray-800 mb-4">🛍️ Active Local Goods</h2>
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm">Loading fresh arrivals from your neighbors...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow p-3 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} className="w-full h-28 object-cover rounded-md mb-2" />
                    <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{product.category}</span>
                    <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-lg font-black text-gray-900">₱{product.price}</span>
                      <span className="text-[10px] text-gray-400">Stock: {product.stock}</span>
                    </div>
                    {product.suki_points_award > 0 && (
                      <span className="block text-[10px] font-semibold text-green-600 mb-1">🪙 Earn +{product.suki_points_award} Suki Points</span>
                    )}
                    {product.affiliate_percentage > 0 && (
                      <span className="block text-[10px] font-bold text-orange-600 mb-2">🔗 Share link & earn {product.affiliate_percentage}% reward!</span>
                    )}
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="w-full py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-bold rounded transition"
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Shopping Cart Panel */}
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100 self-start">
          <h2 className="text-lg font-extrabold text-gray-800 border-b pb-2 mb-4 flex items-center justify-between">
            <span>🛒 My Cart</span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{cart.length} items</span>
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Your shopping cart is currently empty. Start supporting local sellers!</p>
          ) : (
            <div>
              {/* Cart Item Row */}
              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2 text-sm">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                      <span className="text-xs text-gray-500">₱{item.price} each</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateQuantity(item.id, -1, item.stock)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-center font-bold text-xs">-</button>
                      <span className="font-semibold w-4 text-center text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1, item.stock)} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-center font-bold text-xs">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs pl-2 font-bold hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Configs */}
              <div className="border-t pt-3 space-y-4">
                <div className="flex justify-between font-black text-gray-800 text-lg">
                  <span>Product Subtotal:</span>
                  <span>₱{cartTotal}</span>
                </div>

                {/* Referral Attribution */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">🎫 Affiliate Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g., NELESANJOSE"
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                  />
                </div>

                {/* Fulfillment Selection */}
                <div>
                  <span className="block text-xs font-semibold text-gray-500 mb-2">🚚 Select Fulfillment Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFulfillment('pickup')}
                      className={`py-2 text-xs font-bold rounded border ${fulfillment === 'pickup' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}
                    >
                      🏪 Free Hub Pickup
                    </button>
                    <button
                      onClick={() => setFulfillment('delivery')}
                      className={`py-2 text-xs font-bold rounded border ${fulfillment === 'delivery' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}
                    >
                      🏍️ Doorstep Delivery
                    </button>
                  </div>
                </div>

                {/* Delivery details if selected */}
                {fulfillment === 'delivery' && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Delivery Shipping Address</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street Name, Brgy. San Jose, Naga City (beside chapel)"
                        className="w-full p-2 border border-gray-300 rounded text-xs"
                        rows={2}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">📍 Standard distance calculations using the Mapbox Per-Km system apply.</p>
                  </div>
                )}

                {/* Action Trigger */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-lg shadow transition text-sm"
                >
                  Pay via GCash / Maya Escrow
                </button>
              </div>
            </div>
          )}

          {/* Checkout Result Modal */}
          {checkoutResult && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800">
              <h4 className="font-bold mb-1">🎉 Order Complete!</h4>
              <p>Order ID: #{checkoutResult.order_id}</p>
              <p>Products: ₱{checkoutResult.total_amount}</p>
              <p>Shipping: ₱{checkoutResult.shipping_amount}</p>
              <p className="font-bold mt-1 text-green-700">🪙 Earned {checkoutResult.loyalty_points_earned} Suki Points!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 6. Non-Functional & Operational Requirements

### 6.1 Performance & Resource-Efficiency
*   **Asset Footprint:** Initial PWA bundle sizes must remain under **1.5MB** compressed to support fast initial loading over typical provincial 3G connections [95].
*   **Execution Efficiency:** Distance calculations must be cached on the backend (Redis) using geohash coordinates to prevent duplicate Mapbox billing calls for recurring address routing requests.

### 6.2 Data Resilience & Local Storage limits
*   **Database Sync Limits:** Browser-level IndexedDB queue databases must retain up to 1,000 scanned entries offline and synchronize successfully in bulk without causing system locks on the PostgreSQL backend database tables [95].
*   **Session Management:** Session tokens for Staff and Rider users must remain valid locally for up to 30 days to bypass continuous network log-ins in remote connectivity areas.
