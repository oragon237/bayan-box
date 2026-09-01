-- =============================================================================
-- HABI — Financial Transaction Reset
-- =============================================================================
-- Clears ALL transactional / money-movement history while PRESERVING every
-- dummy account and all structural/config data needed for manual testing.
--
--   CLEARED   : orders + order_items, parcels + status history + batches,
--               bookings, ledger_transactions (every money movement),
--               affiliate commissions (pending + paid), affiliate cash-outs,
--               rider COD remittances, loyalty (Suki) points, promo
--               redemptions, packaging redemptions, return-shield grants,
--               cart items, transaction-generated notifications / incidents /
--               support tickets.
--   PRESERVED : users (all roles), wallets (rows kept, balance zeroed),
--               products + images + reviews, hubs, provider_profiles,
--               merchant_payout_accounts, promo_codes, ad_campaigns, banners,
--               categories, service_categories, delivery_rate_settings,
--               packaging_items, system_settings, addresses.
--   RESTORED  : denormalized counters that transactions had mutated —
--               products.stock, packaging_items.stock_qty,
--               hubs.current_parcel_count, promo_codes.used_count,
--               provider_profiles.completed_jobs.
--
-- SAFETY
--   * Runs inside ONE transaction. Any error aborts and applies nothing.
--   * DRY RUN BY DEFAULT — everything is rolled back.
--   * A PRESERVE GUARD fails the script if any structural table's row count
--     changed, so accounts can never be silently dropped.
--   * Uses DELETE (never TRUNCATE ... CASCADE): CASCADE would also wipe
--     product_reviews via the order_items FK.
--
-- USAGE
--   Dry run  : psql -U postgres -d bayanbox -f scripts/reset-financials.sql
--   Apply    : psql -U postgres -d bayanbox -v apply=on -f scripts/reset-financials.sql
--   (or use scripts/reset-financials.ps1, which takes a pg_dump backup first)
-- =============================================================================

\set ON_ERROR_STOP on

\if :{?apply}
\else
  \set apply off
\endif

\echo ''
\echo '======================================================================'
\echo ' HABI FINANCIAL TRANSACTION RESET'
\echo '   mode  :' :apply   '  (off = dry run, nothing is saved)'
\echo '   db    :' :DBNAME
\echo '======================================================================'

BEGIN;

-- =========================================================================
-- SECTION 0 · PRE-FLIGHT SNAPSHOT
-- =========================================================================
\echo ''
\echo '--- 0a. Money in the system BEFORE reset -----------------------------'
SELECT 'ledger rows'        AS metric, count(*)::text        AS value FROM ledger_transactions
UNION ALL SELECT 'ledger net (sum amount)', to_char(coalesce(sum(amount),0),'FM999999999990.00') FROM ledger_transactions
UNION ALL SELECT 'wallet balance total',    to_char(coalesce(sum(balance),0),'FM999999999990.00') FROM wallets
UNION ALL SELECT 'orders',                  count(*)::text   FROM orders
UNION ALL SELECT 'order_items',             count(*)::text   FROM order_items
UNION ALL SELECT 'order value',             to_char(coalesce(sum(total_amount),0),'FM999999999990.00') FROM orders
UNION ALL SELECT 'parcels',                 count(*)::text   FROM parcels
UNION ALL SELECT 'bookings',                count(*)::text   FROM bookings
UNION ALL SELECT 'pending affiliate comms', count(*)::text   FROM pending_affiliate_commissions
UNION ALL SELECT 'affiliate cash-outs',     count(*)::text   FROM affiliate_cash_outs
UNION ALL SELECT 'rider COD remittances',   count(*)::text   FROM rider_cod_remittances
UNION ALL SELECT 'loyalty point events',    count(*)::text   FROM loyalty_points
UNION ALL SELECT 'loyalty points outstanding', coalesce((SELECT sum(balance_after) FROM (SELECT user_id, max(id) AS mid FROM loyalty_points GROUP BY user_id) x JOIN loyalty_points lp ON lp.id = x.mid),0)::text
UNION ALL SELECT 'ad campaigns',            count(*)::text   FROM ad_campaigns
UNION ALL SELECT 'notifications',           count(*)::text   FROM notifications;

\echo ''
\echo '--- 0b. Per-wallet-type balances BEFORE reset ------------------------'
SELECT wallet_type, count(*) AS wallets, to_char(coalesce(sum(balance),0),'FM999999999990.00') AS total_balance
FROM wallets GROUP BY wallet_type ORDER BY wallet_type;

\echo ''
\echo '--- 0c. Ledger by type BEFORE reset ----------------------------------'
SELECT type, count(*) AS entries, to_char(sum(amount),'FM999999999990.00') AS net
FROM ledger_transactions GROUP BY type ORDER BY type;

-- =========================================================================
-- SECTION 1 · PRESERVE GUARD BASELINE + RESTORE BASELINES
-- =========================================================================
-- 1a. Structural tables that MUST keep their exact row count.
CREATE TEMP TABLE _preserve_baseline ON COMMIT DROP AS
SELECT 'users' AS tbl, count(*) AS n FROM users
UNION ALL SELECT 'wallets',                  count(*) FROM wallets
UNION ALL SELECT 'products',                 count(*) FROM products
UNION ALL SELECT 'product_images',           count(*) FROM product_images
UNION ALL SELECT 'product_reviews',          count(*) FROM product_reviews
UNION ALL SELECT 'provider_reviews',         count(*) FROM provider_reviews
UNION ALL SELECT 'hubs',                     count(*) FROM hubs
UNION ALL SELECT 'provider_profiles',        count(*) FROM provider_profiles
UNION ALL SELECT 'merchant_payout_accounts', count(*) FROM merchant_payout_accounts
UNION ALL SELECT 'promo_codes',              count(*) FROM promo_codes
UNION ALL SELECT 'ad_campaigns',             count(*) FROM ad_campaigns
UNION ALL SELECT 'banners',                  count(*) FROM banners
UNION ALL SELECT 'categories',               count(*) FROM categories
UNION ALL SELECT 'service_categories',       count(*) FROM service_categories
UNION ALL SELECT 'delivery_rate_settings',   count(*) FROM delivery_rate_settings
UNION ALL SELECT 'packaging_items',          count(*) FROM packaging_items
UNION ALL SELECT 'system_settings',          count(*) FROM system_settings
UNION ALL SELECT 'addresses',                count(*) FROM addresses;

-- 1b. Units that transactions had consumed from structural rows.
--     MarketplaceService decrements products.stock at checkout;
--     LoyaltyController decrements packaging_items.stock_qty at redemption.
--     Captured here so Section 3 can give them back.
--     Restricted to rows whose parent still exists: this database carries
--     legacy orphan order_items (product_id 1-77, products now start at 97),
--     whose stock cannot be given back to a product that is gone.
CREATE TEMP TABLE _restore_product_stock ON COMMIT DROP AS
SELECT oi.product_id, COALESCE(SUM(oi.quantity),0)::int AS qty_sold
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
 GROUP BY oi.product_id;

CREATE TEMP TABLE _restore_packaging_stock ON COMMIT DROP AS
SELECT pr.packaging_item_id, COALESCE(SUM(pr.quantity),0)::int AS qty_redeemed
  FROM packaging_redemptions pr
  JOIN packaging_items i ON i.id = pr.packaging_item_id
 GROUP BY pr.packaging_item_id;

-- 1c. Data-integrity diagnostics: rows that already point at missing parents.
--     These are removed by the reset as a side effect; reported for the record.
CREATE TEMP TABLE _orphan_report ON COMMIT DROP AS
SELECT 'order_items -> missing product' AS finding, count(*)::bigint AS rows_affected
  FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE p.id IS NULL
UNION ALL SELECT 'order_items -> missing order', count(*)
  FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE o.id IS NULL
UNION ALL SELECT 'product_reviews -> missing product', count(*)
  FROM product_reviews pr LEFT JOIN products p ON p.id = pr.product_id WHERE p.id IS NULL
UNION ALL SELECT 'ledger_transactions -> missing wallet', count(*)
  FROM ledger_transactions l LEFT JOIN wallets w ON w.id = l.wallet_id WHERE w.id IS NULL
UNION ALL SELECT 'wallets -> missing user', count(*)
  FROM wallets w LEFT JOIN users u ON u.id = w.user_id WHERE u.id IS NULL
UNION ALL SELECT 'products -> missing merchant', count(*)
  FROM products p LEFT JOIN users u ON u.id = p.merchant_id WHERE u.id IS NULL
UNION ALL SELECT 'stock units stranded in orphaned order_items (not restorable)',
  coalesce(sum(oi.quantity),0)::bigint
  FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE p.id IS NULL;

-- =========================================================================
-- SECTION 2 · DELETE TRANSACTION HISTORY (children before parents)
-- =========================================================================
\echo ''
\echo '--- 2. Deleting transactional history --------------------------------'

-- 2a. Money movement --------------------------------------------------------
DELETE FROM ledger_transactions;                 -- every credit/debit entry
DELETE FROM pending_affiliate_commissions;       -- held affiliate earnings
DELETE FROM affiliate_cash_outs;                 -- payout requests/history
DELETE FROM rider_cod_remittances;               -- rider cash-on-delivery remittances
DELETE FROM return_shield_grants;                -- merchant fee-waiver grants

-- 2b. Points / promo / packaging redemptions --------------------------------
DELETE FROM loyalty_points;                      -- Suki Points ledger
DELETE FROM promo_redemptions;                   -- promo usage history
DELETE FROM packaging_redemptions;               -- packaging point redemptions

-- 2c. Commerce + logistics transactions -------------------------------------
DELETE FROM cart_items;                          -- in-flight carts
DELETE FROM incident_reports;                    -- order-linked disputes/reports
DELETE FROM support_tickets;                     -- order-linked tickets
DELETE FROM order_items;                         -- product_reviews.order_item_id -> NULL (reviews kept)
DELETE FROM orders;                              -- product orders
DELETE FROM bookings;                            -- provider service bookings (provider_reviews.booking_id -> NULL)
DELETE FROM parcel_status_history;               -- parcel audit trail
DELETE FROM delivery_batch_parcels;              -- batch <-> parcel pivot
DELETE FROM delivery_batches;                    -- barangay route batches
DELETE FROM parcels;                             -- delivery parcels (COD + fees)

-- 2d. Transaction-generated messaging ---------------------------------------
DELETE FROM notifications;                       -- order/parcel/affiliate notices

-- =========================================================================
-- SECTION 3 · RESTORE DENORMALIZED COUNTERS
-- =========================================================================
\echo '--- 3. Restoring counters that transactions had mutated --------------'

UPDATE products p
   SET stock = p.stock + r.qty_sold,
       updated_at = CURRENT_TIMESTAMP
  FROM _restore_product_stock r
 WHERE r.product_id = p.id
   AND r.qty_sold > 0;

UPDATE packaging_items i
   SET stock_qty = i.stock_qty + r.qty_redeemed,
       updated_at = CURRENT_TIMESTAMP
  FROM _restore_packaging_stock r
 WHERE r.packaging_item_id = i.id
   AND r.qty_redeemed > 0;

UPDATE hubs            SET current_parcel_count = 0, updated_at = CURRENT_TIMESTAMP;
UPDATE promo_codes     SET used_count = 0,            updated_at = CURRENT_TIMESTAMP;

-- completed_jobs is derived from bookings, which are now empty.
UPDATE provider_profiles SET completed_jobs = 0,     updated_at = CURRENT_TIMESTAMP;

\echo ''
\echo '--- 1z. Pre-existing orphan rows (cleaned up by this reset) ----------'
SELECT finding, rows_affected FROM _orphan_report ORDER BY rows_affected DESC, finding;

\echo ''
\echo '--- 3z. Counter restore report ---------------------------------------'
SELECT 'stock units given back (live products)' AS item,
       COALESCE(SUM(qty_sold),0)::text          AS value FROM _restore_product_stock
UNION ALL SELECT 'packaging units given back',        COALESCE(SUM(qty_redeemed),0)::text FROM _restore_packaging_stock
UNION ALL SELECT 'products total stock now',          (SELECT coalesce(sum(stock),0)::text FROM products)
UNION ALL SELECT 'products with negative stock',      (SELECT count(*)::text FROM products WHERE stock < 0)
UNION ALL SELECT 'hubs parcel count',                 (SELECT coalesce(sum(current_parcel_count),0)::text FROM hubs)
UNION ALL SELECT 'promo used_count total',            (SELECT coalesce(sum(used_count),0)::text FROM promo_codes)
UNION ALL SELECT 'stock units NOT restorable (orphaned order_items)',
       (SELECT rows_affected::text FROM _orphan_report
         WHERE finding = 'stock units stranded in orphaned order_items (not restorable)');

-- =========================================================================
-- SECTION 4 · ZERO WALLETS (rows kept, balances cleared)
-- =========================================================================
\echo '--- 4. Zeroing wallet balances (wallet rows preserved) ---------------'
UPDATE wallets SET balance = 0, updated_at = CURRENT_TIMESTAMP;

-- =========================================================================
-- SECTION 5 · RESET SEQUENCES FOR CLEARED TABLES
-- =========================================================================
-- Keeps test IDs small and predictable. Sequences of preserved tables are
-- deliberately left alone so new rows never collide with existing ones.
\echo '--- 5. Restarting ID sequences of cleared tables ---------------------'
SELECT setval('ledger_transactions_id_seq',           1, false);
SELECT setval('pending_affiliate_commissions_id_seq', 1, false);
SELECT setval('affiliate_cash_outs_id_seq',           1, false);
SELECT setval('rider_cod_remittances_id_seq',         1, false);
SELECT setval('return_shield_grants_id_seq',          1, false);
SELECT setval('loyalty_points_id_seq',                1, false);
SELECT setval('promo_redemptions_id_seq',             1, false);
SELECT setval('packaging_redemptions_id_seq',         1, false);
SELECT setval('cart_items_id_seq',                    1, false);
SELECT setval('incident_reports_id_seq',              1, false);
SELECT setval('support_tickets_id_seq',               1, false);
SELECT setval('order_items_id_seq',                   1, false);
SELECT setval('orders_id_seq',                        1, false);
SELECT setval('bookings_id_seq',                      1, false);
SELECT setval('parcel_status_history_id_seq',         1, false);
SELECT setval('delivery_batch_parcels_id_seq',        1, false);
SELECT setval('delivery_batches_id_seq',              1, false);
SELECT setval('parcels_id_seq',                       1, false);
SELECT setval('notifications_id_seq',                 1, false);

-- =========================================================================
-- SECTION 6 · POST-FLIGHT VERIFICATION + GUARDS
-- =========================================================================
\echo ''
\echo '--- 6a. Transaction tables AFTER reset (all must be 0) ---------------'
SELECT 'ledger_transactions' AS tbl, count(*) AS remaining FROM ledger_transactions
UNION ALL SELECT 'orders',                     count(*) FROM orders
UNION ALL SELECT 'order_items',                count(*) FROM order_items
UNION ALL SELECT 'parcels',                    count(*) FROM parcels
UNION ALL SELECT 'bookings',                   count(*) FROM bookings
UNION ALL SELECT 'pending_affiliate_commissions', count(*) FROM pending_affiliate_commissions
UNION ALL SELECT 'affiliate_cash_outs',        count(*) FROM affiliate_cash_outs
UNION ALL SELECT 'rider_cod_remittances',      count(*) FROM rider_cod_remittances
UNION ALL SELECT 'loyalty_points',             count(*) FROM loyalty_points
UNION ALL SELECT 'promo_redemptions',          count(*) FROM promo_redemptions
UNION ALL SELECT 'packaging_redemptions',      count(*) FROM packaging_redemptions
UNION ALL SELECT 'cart_items',                 count(*) FROM cart_items
UNION ALL SELECT 'notifications',              count(*) FROM notifications;

\echo ''
\echo '--- 6b. Preserved structures AFTER reset -----------------------------'
SELECT 'users' AS tbl, count(*) AS rows_kept FROM users
UNION ALL SELECT 'users:admin',     count(*) FROM users WHERE role='admin'
UNION ALL SELECT 'users:staff',     count(*) FROM users WHERE role='staff'
UNION ALL SELECT 'users:rider',     count(*) FROM users WHERE role='rider'
UNION ALL SELECT 'users:merchant',  count(*) FROM users WHERE role='merchant'
UNION ALL SELECT 'users:customer',  count(*) FROM users WHERE role='customer'
UNION ALL SELECT 'users:provider',  count(*) FROM users WHERE role='provider'
UNION ALL SELECT 'wallets',         count(*) FROM wallets
UNION ALL SELECT 'products',        count(*) FROM products
UNION ALL SELECT 'product_images',  count(*) FROM product_images
UNION ALL SELECT 'product_reviews', count(*) FROM product_reviews
UNION ALL SELECT 'hubs',            count(*) FROM hubs
UNION ALL SELECT 'provider_profiles', count(*) FROM provider_profiles
UNION ALL SELECT 'promo_codes',     count(*) FROM promo_codes
UNION ALL SELECT 'ad_campaigns',    count(*) FROM ad_campaigns
UNION ALL SELECT 'banners',         count(*) FROM banners
UNION ALL SELECT 'categories',      count(*) FROM categories
UNION ALL SELECT 'packaging_items', count(*) FROM packaging_items
ORDER BY 1;

\echo ''
\echo '--- 6c. Wallet balances AFTER reset (all must be 0.00) ---------------'
SELECT wallet_type, count(*) AS wallets, to_char(coalesce(sum(balance),0),'FM999999999990.00') AS total_balance
FROM wallets GROUP BY wallet_type ORDER BY wallet_type;

-- Guard 1: no money may remain anywhere.
DO $guard$
DECLARE bad BIGINT;
BEGIN
    SELECT COALESCE(SUM(ABS(balance)),0) INTO bad FROM wallets;
    IF bad <> 0 THEN
        RAISE EXCEPTION 'MONEY GUARD FAILED: % PHP still present in wallets', bad;
    END IF;
    SELECT count(*) INTO bad FROM ledger_transactions;
    IF bad > 0 THEN
        RAISE EXCEPTION 'LEDGER GUARD FAILED: % ledger rows still remain', bad;
    END IF;
END $guard$;

-- Guard 2: every structural table must be untouched in row count.
CREATE TEMP TABLE _preserve_after ON COMMIT DROP AS
SELECT 'users' AS tbl, count(*) AS n FROM users
UNION ALL SELECT 'wallets',                  count(*) FROM wallets
UNION ALL SELECT 'products',                 count(*) FROM products
UNION ALL SELECT 'product_images',           count(*) FROM product_images
UNION ALL SELECT 'product_reviews',          count(*) FROM product_reviews
UNION ALL SELECT 'provider_reviews',         count(*) FROM provider_reviews
UNION ALL SELECT 'hubs',                     count(*) FROM hubs
UNION ALL SELECT 'provider_profiles',        count(*) FROM provider_profiles
UNION ALL SELECT 'merchant_payout_accounts', count(*) FROM merchant_payout_accounts
UNION ALL SELECT 'promo_codes',              count(*) FROM promo_codes
UNION ALL SELECT 'ad_campaigns',             count(*) FROM ad_campaigns
UNION ALL SELECT 'banners',                  count(*) FROM banners
UNION ALL SELECT 'categories',               count(*) FROM categories
UNION ALL SELECT 'service_categories',       count(*) FROM service_categories
UNION ALL SELECT 'delivery_rate_settings',   count(*) FROM delivery_rate_settings
UNION ALL SELECT 'packaging_items',          count(*) FROM packaging_items
UNION ALL SELECT 'system_settings',          count(*) FROM system_settings
UNION ALL SELECT 'addresses',                count(*) FROM addresses;

DO $guard$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT b.tbl, b.n AS before_n, a.n AS after_n
               FROM _preserve_baseline b
               JOIN _preserve_after a USING (tbl)
              WHERE a.n <> b.n LOOP
        RAISE EXCEPTION 'PRESERVE GUARD FAILED: table % changed row count (% -> %)', r.tbl, r.before_n, r.after_n;
    END LOOP;
    RAISE NOTICE 'PRESERVE GUARD OK — all dummy accounts and structures intact';
END $guard$;

\echo ''
\echo '======================================================================'
\if :apply
  \echo ' APPLYING — committing changes.'
  COMMIT;
  \echo ' COMMITTED. Financial history cleared.'
\else
  \echo ' DRY RUN — rolling back. Nothing changed.'
  \echo ' Re-run with  -v apply=on  to make it real.'
  ROLLBACK;
\endif
\echo '======================================================================'
\echo ''

-- =============================================================================
-- APPENDIX · OPTIONAL (all commented out — uncomment what you need)
-- =============================================================================
-- These are NOT part of the financial reset because they are content or
-- session state rather than money movement.

-- A1. Analytics / telemetry history:
-- DELETE FROM product_views;      SELECT setval('product_views_id_seq', 1, false);
-- DELETE FROM rider_locations;    SELECT setval('rider_locations_id_seq', 1, false);

-- A2. Provider profile view counters:
-- UPDATE provider_profiles SET profile_views = 0;

-- A3. Ad campaign performance counters (keeps the campaigns as homepage
--     banner content, only zeroes impressions/clicks/conversions):
-- UPDATE ad_campaigns SET impressions = 0, clicks = 0, conversions = 0;

-- A4. Delete ad campaigns entirely (WARNING: removes homepage promo banners
--     and their stored image references):
-- DELETE FROM ad_campaigns;       SELECT setval('ad_campaigns_id_seq', 1, false);

-- A5. Log every device out (deletes Sanctum tokens; users must re-login):
-- DELETE FROM personal_access_tokens;
-- DELETE FROM sessions;

-- A6. Keep transaction-generated notifications instead of clearing them:
--     (remove the DELETE FROM notifications line in Section 2d)

-- A7. Reset merchant verification / affiliate enrollment back to defaults
--     (changes account state — off by default because it alters accounts):
-- UPDATE users SET affiliate_status = NULL, affiliate_activated_at = NULL,
--                  affiliate_documents = NULL WHERE affiliate_status IS NOT NULL;
-- UPDATE products SET status = 'active' WHERE status <> 'active';

-- A8. Restore product stock to the seeder's original values instead of the
--     computed give-back in Section 3 (only if you reseed anyway):
--     php artisan migrate:fresh --seed   (destroys accounts — NOT recommended)
-- =============================================================================
