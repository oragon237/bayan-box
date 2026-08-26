-- =============================================================================
-- BayanBox (BodegaBarangay) — Complete PostgreSQL Schema DDL
-- Version: 3.0.0
-- Target: PostgreSQL 15+ with optional PostGIS for geofenced queries
-- =============================================================================

-- 0a. Extensions (optional — enable for geofenced geo-queries / promos)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- 0b. User role enum (PRD 4.1 #1)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'rider', 'merchant', 'customer', 'provider');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- 1. USERS (PRD 4.1 #2)
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'customer',
    affiliate_code  VARCHAR(15) UNIQUE NOT NULL,
    referred_by_id  INT REFERENCES users(id) ON DELETE SET NULL,
    barangay        VARCHAR(100),
    municipality    VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'active',
    remember_token  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_municipality ON users(municipality);
CREATE INDEX idx_users_barangay ON users(barangay);

-- =========================================================================
-- 2. HUBS (PRD 4.1 #3)
-- =========================================================================
CREATE TABLE IF NOT EXISTS hubs (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    address             TEXT NOT NULL,
    barangay            VARCHAR(100),
    municipality        VARCHAR(100),
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    staff_id            INT REFERENCES users(id) ON DELETE SET NULL,
    capacity_limit      INT NOT NULL DEFAULT 500,
    current_parcel_count INT DEFAULT 0,
    referral_code       VARCHAR(15) UNIQUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hubs_barangay ON hubs(barangay);
CREATE INDEX idx_hubs_municipality ON hubs(municipality);
CREATE INDEX idx_hubs_geoloc ON hubs(latitude, longitude);

-- =========================================================================
-- 3. PROVIDER PROFILES (PRD 4.1 #4)
-- =========================================================================
CREATE TABLE IF NOT EXISTS provider_profiles (
    id                          SERIAL PRIMARY KEY,
    user_id                     INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_verified                 BOOLEAN DEFAULT FALSE,
    verified_badge_assigned_at  TIMESTAMP,
    skills                      TEXT[],
    custom_rate_enabled         BOOLEAN DEFAULT FALSE,
    custom_commission_override  DECIMAL(5, 2) DEFAULT NULL,
    verification_expiry         TIMESTAMP,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. SERVICE CATEGORIES (PRD 4.1 #5)
-- =========================================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id                             SERIAL PRIMARY KEY,
    name                           VARCHAR(100) NOT NULL,
    base_pakyaw_rate               DECIMAL(10, 2) NOT NULL,
    global_commission_percentage   DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    created_at                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 5. DELIVERY RATE SETTINGS (PRD 4.1 #6) — Per-Km Calculator Config
-- =========================================================================
CREATE TABLE IF NOT EXISTS delivery_rate_settings (
    id                   SERIAL PRIMARY KEY,
    municipality_name    VARCHAR(100) UNIQUE NOT NULL,
    base_fare            DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    base_distance_km     DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    per_km_rate          DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    platform_percentage  DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    rider_percentage     DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
    surge_multiplier     DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    surge_override_active BOOLEAN DEFAULT FALSE,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 6. PARCELS (PRD 4.1 #7)
-- =========================================================================
CREATE TABLE IF NOT EXISTS parcels (
    id                        SERIAL PRIMARY KEY,
    tracking_number           VARCHAR(100) UNIQUE NOT NULL,
    shipper_name              VARCHAR(100),
    recipient_name            VARCHAR(100) NOT NULL,
    recipient_phone           VARCHAR(20) NOT NULL,
    hub_id                    INT NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    rider_id                  INT REFERENCES users(id) ON DELETE SET NULL,
    status                    VARCHAR(30) DEFAULT 'received_at_hub',
    otp_code                  VARCHAR(6) NOT NULL,
    otp_expires_at            TIMESTAMP,
    otp_attempts              INT DEFAULT 0,
    cod_amount                DECIMAL(10, 2) DEFAULT 0.00,

    -- Geo pins for the calculator
    origin_address            VARCHAR(255),
    origin_latitude           DECIMAL(10, 8),
    origin_longitude          DECIMAL(11, 8),
    destination_address       VARCHAR(255),
    destination_latitude      DECIMAL(10, 8),
    destination_longitude     DECIMAL(11, 8),
    destination_barangay      VARCHAR(100),

    -- Delivery metrics (set by DeliveryPricingService)
    delivery_distance_km      DECIMAL(6, 2) DEFAULT 0.00,
    calculated_delivery_fee   DECIMAL(10, 2) DEFAULT 0.00,
    applied_surge             DECIMAL(3, 2) DEFAULT 1.00,

    -- Timestamps for Suki Points 24h window
    arrived_at_hub_at         TIMESTAMP,
    picked_up_at              TIMESTAMP,
    delivered_at              TIMESTAMP,

    -- Affiliate micro-commission (FR-AFF-002)
    referred_by_id            INT REFERENCES users(id) ON DELETE SET NULL,
    referral_commission_paid_at TIMESTAMP,

    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcels_hub_status ON parcels(hub_id, status);
CREATE INDEX idx_parcels_barangay_status ON parcels(destination_barangay, status);
CREATE INDEX idx_parcels_rider_id ON parcels(rider_id);
CREATE INDEX idx_parcels_arrived_at ON parcels(arrived_at_hub_at);

-- =========================================================================
-- 7. BOOKINGS (PRD 4.1 #8) — Skilled Services
-- =========================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id                  SERIAL PRIMARY KEY,
    customer_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id         INT REFERENCES users(id) ON DELETE SET NULL,
    service_id          INT NOT NULL REFERENCES service_categories(id),
    status              VARCHAR(20) DEFAULT 'pending',
    booking_date        TIMESTAMP NOT NULL,
    address             TEXT NOT NULL,
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    quoted_amount       DECIMAL(10, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) NOT NULL,
    provider_payout     DECIMAL(10, 2) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);

-- =========================================================================
-- 8. WALLETS (PRD 4.1 #9)
-- =========================================================================
CREATE TABLE IF NOT EXISTS wallets (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_type VARCHAR(30) NOT NULL,
    balance     DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency    VARCHAR(3) DEFAULT 'PHP',
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, wallet_type)
);

-- =========================================================================
-- 9. LEDGER TRANSACTIONS (PRD 4.1 #9) — Double-Entry Protection
-- =========================================================================
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id                      SERIAL PRIMARY KEY,
    wallet_id               INT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    counterparty_wallet_id  INT REFERENCES wallets(id) ON DELETE RESTRICT,
    amount                  DECIMAL(12, 2) NOT NULL,
    balance_after           DECIMAL(12, 2),
    direction               VARCHAR(10) DEFAULT 'credit',
    type                    VARCHAR(40) DEFAULT 'manual',
    description             VARCHAR(255) NOT NULL,
    transaction_hash        VARCHAR(64) UNIQUE NOT NULL,
    reference_type          VARCHAR(60),
    reference_id            BIGINT,
    meta                    JSONB,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_wallet_created ON ledger_transactions(wallet_id, created_at);
CREATE INDEX idx_ledger_reference ON ledger_transactions(reference_type, reference_id);

-- =========================================================================
-- 10. ADDRESSES — Customer / Sender geocoded locations
-- =========================================================================
CREATE TABLE IF NOT EXISTS addresses (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label        VARCHAR(50) DEFAULT 'Home',
    full_address TEXT NOT NULL,
    barangay     VARCHAR(100),
    municipality VARCHAR(100),
    province     VARCHAR(100),
    latitude     DECIMAL(10, 8) NOT NULL,
    longitude    DECIMAL(11, 8) NOT NULL,
    is_default   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_geoloc ON addresses(latitude, longitude);
CREATE INDEX idx_addresses_barangay ON addresses(barangay);

-- =========================================================================
-- 11. PROMO CODES (FR-PROMO-001..003)
-- =========================================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id                        SERIAL PRIMARY KEY,
    code                      VARCHAR(40) UNIQUE NOT NULL,
    description               VARCHAR(255),
    discount_type             VARCHAR(20) NOT NULL DEFAULT 'flat',
    discount_value            DECIMAL(10, 2) DEFAULT 0.00,
    min_transaction_amount    DECIMAL(10, 2) DEFAULT 0.00,
    hub_id                    INT REFERENCES hubs(id) ON DELETE CASCADE,
    barangay                  VARCHAR(100),
    municipality              VARCHAR(100),
    min_parcels_per_transaction INT DEFAULT 1,
    max_uses                  INT DEFAULT 0,
    used_count                INT DEFAULT 0,
    starts_at                 TIMESTAMP,
    expires_at                TIMESTAMP,
    is_active                 BOOLEAN DEFAULT TRUE,
    created_by                INT REFERENCES users(id) ON DELETE SET NULL,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promo_barangay ON promo_codes(barangay);
CREATE INDEX idx_promo_hub_id ON promo_codes(hub_id);

-- =========================================================================
-- 12. PROMO REDEMPTIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id              SERIAL PRIMARY KEY,
    promo_code_id   INT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parcel_id       INT REFERENCES parcels(id) ON DELETE SET NULL,
    discounted_amount DECIMAL(10, 2) DEFAULT 0.00,
    reference       VARCHAR(60),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (promo_code_id, user_id, parcel_id)
);

-- =========================================================================
-- 13. LOYALTY POINTS (FR-LOY-001) — Suki Points Ledger
-- =========================================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
    id            SERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points        INT NOT NULL,
    type          VARCHAR(40) NOT NULL,
    description   VARCHAR(255) NOT NULL,
    reference_type VARCHAR(60),
    reference_id   BIGINT,
    balance_after INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lp_user_created ON loyalty_points(user_id, created_at);
CREATE INDEX idx_lp_type ON loyalty_points(type);

-- =========================================================================
-- 14. PACKAGING ITEMS (FR-LOY-003) — B2B Packaging Marketplace
-- =========================================================================
CREATE TABLE IF NOT EXISTS packaging_items (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    sku         VARCHAR(40) UNIQUE NOT NULL,
    description TEXT,
    cash_price  DECIMAL(10, 2) DEFAULT 0.00,
    points_price INT DEFAULT 0,
    stock_qty   INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 15. PACKAGING REDEMPTIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS packaging_redemptions (
    id                SERIAL PRIMARY KEY,
    user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    packaging_item_id INT NOT NULL REFERENCES packaging_items(id),
    quantity          INT DEFAULT 1,
    points_spent      INT NOT NULL,
    status            VARCHAR(20) DEFAULT 'processing',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 16. PARCEL STATUS HISTORY — Audit Trail
-- =========================================================================
CREATE TABLE IF NOT EXISTS parcel_status_history (
    id            SERIAL PRIMARY KEY,
    parcel_id     INT NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    status        VARCHAR(30) NOT NULL,
    note          VARCHAR(255),
    actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    latitude      DECIMAL(10, 8),
    longitude     DECIMAL(11, 8),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_psh_parcel_created ON parcel_status_history(parcel_id, created_at);

-- =========================================================================
-- 17. RIDER LOCATIONS — GPS Telemetry (FR-MAP-002)
-- =========================================================================
CREATE TABLE IF NOT EXISTS rider_locations (
    id          SERIAL PRIMARY KEY,
    rider_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude    DECIMAL(10, 8) NOT NULL,
    longitude   DECIMAL(11, 8) NOT NULL,
    accuracy_m  REAL DEFAULT 0,
    speed_mps   REAL,
    heading_deg REAL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rl_rider_recorded ON rider_locations(rider_id, recorded_at);
CREATE INDEX idx_rl_geoloc ON rider_locations(latitude, longitude);

-- =========================================================================
-- 18. DELIVERY BATCHES — Barangay-clustered routes
-- =========================================================================
CREATE TABLE IF NOT EXISTS delivery_batches (
    id            SERIAL PRIMARY KEY,
    batch_code    VARCHAR(40) UNIQUE NOT NULL,
    hub_id        INT NOT NULL REFERENCES hubs(id),
    rider_id      INT REFERENCES users(id) ON DELETE SET NULL,
    barangay      VARCHAR(100),
    status        VARCHAR(20) DEFAULT 'pending',
    assigned_at   TIMESTAMP,
    started_at    TIMESTAMP,
    completed_at  TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_db_barangay ON delivery_batches(barangay);
CREATE INDEX idx_db_status ON delivery_batches(status);

-- =========================================================================
-- 19. DELIVERY BATCH ↔ PARCELS Pivot
-- =========================================================================
CREATE TABLE IF NOT EXISTS delivery_batch_parcels (
    id               SERIAL PRIMARY KEY,
    delivery_batch_id INT NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
    parcel_id        INT NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    sequence         INT DEFAULT 0,
    dropoff_status   VARCHAR(20) DEFAULT 'pending',
    proof_photo_path VARCHAR(255),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (delivery_batch_id, parcel_id)
);

-- =========================================================================
-- 20. LARAVEL CACHE & JOB TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS cache (
    key        VARCHAR(255) PRIMARY KEY,
    value      TEXT NOT NULL,
    expiration INT NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
    key        VARCHAR(255) PRIMARY KEY,
    owner      VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id           BIGSERIAL PRIMARY KEY,
    queue        VARCHAR(255) NOT NULL,
    payload      TEXT NOT NULL,
    attempts     SMALLINT NOT NULL DEFAULT 0,
    reserved_at  INT,
    available_at INT NOT NULL,
    created_at   INT NOT NULL
);

CREATE INDEX idx_jobs_queue ON jobs(queue);

-- =========================================================================
-- PostGIS Spatial Indexes (optional — uncomment when PostGIS is active)
-- =========================================================================
-- CREATE INDEX idx_hubs_geom ON hubs USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
-- CREATE INDEX idx_parcels_dest_geom ON parcels USING GIST (ST_SetSRID(ST_MakePoint(destination_longitude, destination_latitude), 4326));
-- CREATE INDEX idx_rider_locations_geom ON rider_locations USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
-- CREATE INDEX idx_addresses_geom ON addresses USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));