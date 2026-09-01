<?php

/*
|--------------------------------------------------------------------------
| HABI Domain Configuration
|--------------------------------------------------------------------------
| Central tunable knobs for the logistics OS. Values here can be overridden
| per-environment via the matching .env variables.
*/

return [

    /*
    |----------------------------------------------------------------------
    | Distance Matrix Provider
    |----------------------------------------------------------------------
    | 'mapbox' or 'openrouteservice'. DeliveryPricingService resolves the
    | provider through DistanceMatrixService so it can fail over between
    | the two when a token is missing or a provider errors out.
    */
    'distance_provider' => env('DISTANCE_PROVIDER', 'mapbox'),

    'mapbox' => [
        'access_token' => env('MAPBOX_ACCESS_TOKEN', ''),
        'base_url' => 'https://api.mapbox.com/directions/v5/mapbox/driving',
        'profile' => 'driving',
    ],

    'openrouteservice' => [
        'api_key' => env('ORS_API_KEY', ''),
        'base_url' => 'https://api.openrouteservice.org/v2/directions',
        'profile' => 'driving-car',
    ],

    /*
    |----------------------------------------------------------------------
    | Distance Cache (NFR 6.1)
    |----------------------------------------------------------------------
    | Cache Mapbox/ORS responses by rounded geohash so recurring address
    | pairs never double-bill the provider. TTL in seconds.
    */
    'distance_cache' => [
        'enabled' => env('DISTANCE_CACHE_ENABLED', true),
        'store' => env('DISTANCE_CACHE_STORE', 'redis'),
        'geohash_precision' => 6,   // ~0.6km x 0.6km buckets
        'ttl' => 60 * 60 * 24 * 7, // 7 days
    ],

    /*
    |----------------------------------------------------------------------
    | Revenue Split Defaults (FR-CALC-005)
    |----------------------------------------------------------------------
    | Used as a fallback when a municipality has no delivery_rate_settings
    | row. The authoritative numbers live in delivery_rate_settings.
    */
    'delivery_splits' => [
        'platform_percentage' => env('PLATFORM_SPLIT_PERCENT', 15.00), // 15% platform
        'rider_percentage' => env('RIDER_SPLIT_PERCENT', 85.00),       // 85% rider
    ],

    /*
    |----------------------------------------------------------------------
    | Surge Multiplier Controls (FR-CALC-006)
    |----------------------------------------------------------------------
    | Night surge: applied between night_start and night_end (24h clock)
    | unless manually overridden on delivery_rate_settings.surge_multiplier.
    */
    'surge' => [
        'night_surge_enabled' => env('NIGHT_SURGE_ENABLED', true),
        'night_surge_multiplier' => env('NIGHT_SURGE_MULTIPLIER', 1.50),
        'night_start_hour' => 21, // 9PM
        'night_end_hour' => 6,    // 6AM
        'weather_surge_enabled' => env('WEATHER_SURGE_ENABLED', false),
        'weather_surge_multiplier' => env('WEATHER_SURGE_MULTIPLIER', 1.50),
    ],

    /*
    |----------------------------------------------------------------------
    | ETA Buffer (FR-MAP-004)
    |----------------------------------------------------------------------
    | Provincial multiplier applied on top of raw route ETA to absorb
    | farm traffic / tricycle bottlenecks. Rendered as a friendly range.
    */
    'eta' => [
        'buffer_multiplier' => env('ETA_BUFFER_MULTIPLIER', 1.30),
        'range_spread_minutes' => 7,
    ],

    /*
    |----------------------------------------------------------------------
    | Loyalty Engine (FR-LOY-001..004)
    |----------------------------------------------------------------------
    */
    'loyalty' => [
        // FR-LOY-002: 1 point per parcel picked up within 24h of arrival
        'pickup_within_hours' => 24,
        'pickup_points_per_parcel' => 1,
        // FR-LOY-003: merchant drop-off (returns consolidation) points
        'return_dropoff_points_per_parcel' => 1,
        // FR-LOY-004: doorstep upgrade cost in points (3km radius)
        'doorstep_upgrade_points' => 50,
        'doorstep_upgrade_radius_km' => 3,
        // Packaging marketplace price in points (100 points = 1 roll thermal paper)
        'packaging_points_per_peso' => 1,
    ],

    /*
    |----------------------------------------------------------------------
    | Affiliate & Micro-Referral (FR-AFF-001..003)
    |----------------------------------------------------------------------
    */
    'affiliate' => [
        // FR-AFF-002: permanent micro-commission per future parcel
        'micro_commission_per_parcel' => env('REFERRAL_MICRO_COMMISSION', 2.00),
        // FR-AFF-003: B2B threshold for Return Shield Credit
        'b2b_referral_threshold_shipments' => 10,
        'b2b_return_shield_days' => 30,
        'b2b_return_shield_discount_percent' => 50.00,
        // Marketplace commission grace/hold period: commission is held in escrow
        // for this many hours after payment. If the order is cancelled within
        // the window the commission is voided; otherwise it vests and is
        // released to the affiliate wallet (scheduled release).
        'commission_hold_hours' => env('AFFILIATE_COMMISSION_HOLD_HOURS', 72),
        // QR poster rendering
        'poster_base_url' => env('POSTER_BASE_URL', 'http://localhost:8000'),
        // Frontend URL for the /r/{code} QR redirect → /login?ref={code}
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    /*
    |----------------------------------------------------------------------
    | OTP / Pickup Security
    |----------------------------------------------------------------------
    */
    'otp' => [
        'length' => 6,
        'digits_only' => true,
        'ttl_minutes' => 48,          // 2 days before expiry
        'sms_template' => 'HABI pickup OTP: {otp}. Valid {ttl_minutes}h. Show this PIN to hub staff to claim parcel {tracking}.',
    ],

    /*
    |----------------------------------------------------------------------
    | Open Contract Ledger (COD + Wallet Top-ups)
    |----------------------------------------------------------------------
    */
    'ledger' => [
        'platform_user_id' => env('PLATFORM_USER_ID', 1),
        'cod_settlement_window_days' => 3,
        'cod_platform_fee_percent' => env('COD_PLATFORM_FEE_PERCENT', 1.00),
    ],

    /*
    |----------------------------------------------------------------------
    | Sessions (NFR 6.2)
    |----------------------------------------------------------------------
    */
    'session' => [
        'staff_rider_ttl_days' => 30,
    ],

    /*
    |----------------------------------------------------------------------
    | Local E-Commerce Marketplace (PRD v4 §3.7)
    |----------------------------------------------------------------------
    | Revenue splits and fees for the merchant storefront (FR-MKT-007).
    */
    'marketplace' => [
        'platform_commission_percent' => 10.00,   // 10% platform rake
        'merchant_share_percent' => 90.00,        // 90% merchant payout
        'pickup_handling_fee' => env('MARKETPLACE_PICKUP_HANDLING_FEE', 10.00), // ₱10 split ₱5 hub / ₱5 platform
        'max_affiliate_percentage' => 50.00,      // FR-MKT-003 cap
        'max_delivery_km' => env('MAX_DELIVERY_KM', 100), // service-area radius cap
    ],

    /*
    |----------------------------------------------------------------------
    | Affiliate & Referrals
    |----------------------------------------------------------------------
    */
    'affiliate' => [
        'min_cashout' => env('AFFILIATE_MIN_CASHOUT', 200.00), // minimum cash-out threshold
    ],

    /*
    |----------------------------------------------------------------------
    | In-app rewards (item 9)
    |----------------------------------------------------------------------
    */
    'rewards' => [
        'review_points' => env('REVIEW_POINTS', 5), // Suki points awarded for leaving a provider review
    ],

    /*
    |----------------------------------------------------------------------
    | Product Advertising (merchant ad campaigns)
    |----------------------------------------------------------------------
    */
    'ads' => [
        'rates' => [
            'sponsored' => env('AD_SPONSORED_RATE', 50.00),           // ₱50/day
            'homepage_featured' => env('AD_HOMEPAGE_FEATURED_RATE', 100.00), // ₱100/day
            'flash_deal' => env('AD_FLASH_DEAL_RATE', 30.00),          // ₱30/day
        ],
        'max_duration_days' => 30,
    ],

];
