# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Project "BayanBox" (BodegaBarangay) — Provincial Last-Mile Logistics OS

**Version:** 3.0.0  
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
     Platform     Hub PWA      Logistics  B2B Return   Tracking &   Job Claims,
     Dashboard    Inventory    Routings   Shield       Suki Points  Standardized Rates
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
*   **Access Channel:** Web portal optimized for both desktop and mobile [112].
*   **Core Responsibilities:**
    *   **Parcel Pre-Registration:** Upload outbound parcel details via CSV bulk import to generate regional tracking barcodes [4, 21].
    *   **Return Shield Dashboard:** Track consolidated regional returns, manage customer refunds, and coordinate return packaging [4, 120].
    *   **B2B Packaging Marketplace:** Buy packing materials (bubble wrap, thermal labels, mailers) at bulk wholesale rates using accumulated points or cash [4].
    *   **Affiliate Network:** Track B2B referral linkages and monitor earned credits or shipping vouchers [8].

### 2.5 Customer (Local Shopper Affiliate)
*   **Access Channel:** High-performance, lightweight React PWA designed to bypass the Google Play Store [95, 112].
*   **Core Responsibilities:**
    *   **Real-time Simple Tracking:** Follow active shipments on a simplified, vector-rendered Leaflet/Mapbox map with estimated arrival hours (ETAs) [21, 95].
    *   **Suki Points Dashboard:** Track loyalty points accumulated through successful package pickups [95].
    *   **Community Referral Hub:** Generate custom physical referral QR codes to invite neighbors, tracking pending cashback rewards [8].

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

---

## 6. Non-Functional & Operational Requirements

### 6.1 Performance & Resource-Efficiency
*   **Asset Footprint:** Initial PWA bundle sizes must remain under **1.5MB** compressed to support fast initial loading over typical provincial 3G connections [95].
*   **Execution Efficiency:** Distance calculations must be cached on the backend (Redis) using geohash coordinates to prevent duplicate Mapbox billing calls for recurring address routing requests.

### 6.2 Data Resilience & Local Storage limits
*   **Database Sync Limits:** Browser-level IndexedDB queue databases must retain up to 1,000 scanned entries offline and synchronize successfully in bulk without causing system locks on the PostgreSQL backend database tables [95].
*   **Session Management:** Session tokens for Staff and Rider users must remain valid locally for up to 30 days to bypass continuous network log-ins in remote connectivity areas.
