# Financial Transaction Reset — Procedure

Clears **all transactional / money-movement history** from the HABI database while
keeping every dummy account and all structural data intact, so manual testing can
start from a clean financial slate with the same logins.

| File | Role |
|---|---|
| [`scripts/reset-financials.sql`](reset-financials.sql) | The reset itself (single transaction, dry-run by default) |
| [`scripts/reset-financials.ps1`](reset-financials.ps1) | Safe runner: backup → run → verify → restore helper |

---

## 1. Quick start

```powershell
# 1. See exactly what would change. NOTHING is saved.
.\scripts\reset-financials.ps1

# 2. Review the report, then apply (takes a pg_dump backup automatically first).
.\scripts\reset-financials.ps1 -Apply

# 3. If you need to go back, use the printed restore command.
.\scripts\reset-financials.ps1 -Restore "scripts\backups\bayanbox_<timestamp>.sql"
```

Raw `psql` equivalents:

```bash
psql -U postgres -d bayanbox -f scripts/reset-financials.sql            # dry run
psql -U postgres -d bayanbox -v apply=on -f scripts/reset-financials.sql # commit
```

> **Stop the Laravel server before applying** (`php artisan serve`) so no request
> writes new ledger rows mid-reset, and so cached wallet balances are refetched.

---

## 2. What is cleared

Every table that represents money movement or a transaction:

| Area | Tables |
|---|---|
| **Product orders** | `orders`, `order_items`, `cart_items` |
| **Ledger (all money movement)** | `ledger_transactions` — `sales_receipt`, `marketplace_sale`, `marketplace_commission`, `mall_sale`, `delivery_split`, `pickup_handling_fee`, `affiliate_commission` |
| **Rider income** | `rider_cod_remittances`, `delivery_split` ledger entries, `rider_prepaid` balances, `parcels` (COD + delivery fees), `parcel_status_history`, `delivery_batches`, `delivery_batch_parcels` |
| **Merchant income** | `marketplace_sale` / `mall_sale` ledger entries, `merchant_earnings` + `admin_earnings` balances |
| **Affiliate commissions** | `pending_affiliate_commissions`, `affiliate_cash_outs`, `affiliate_commission` ledger entries, `affiliate_payout` balances |
| **Provider income** | `bookings` (quoted / commission / payout), `provider_earnings` balances |
| **Loyalty & promos** | `loyalty_points` (Suki Points ledger), `promo_redemptions`, `packaging_redemptions` |
| **Other financial** | `return_shield_grants` (merchant fee waivers), `sales_escrow` balance |
| **Transaction-generated** | `notifications`, `incident_reports`, `support_tickets` |

## 3. What is preserved (never deleted)

`users` (all 28 demo accounts, every role) · `wallets` (rows kept, **balance zeroed**) ·
`products` + `product_images` + `product_reviews` (81) + `provider_reviews` ·
`hubs` · `provider_profiles` · `merchant_payout_accounts` · `promo_codes` ·
`ad_campaigns` · `banners` · `categories` · `service_categories` ·
`delivery_rate_settings` · `packaging_items` · `system_settings` · `addresses`

Reviews survive because `product_reviews.order_item_id` and
`provider_reviews.booking_id` are `ON DELETE SET NULL` — the script uses plain
`DELETE`, so the review rows stay and only their purchase link is nulled.

## 4. What is restored (denormalized counters)

Transactions had mutated columns on preserved rows. The reset gives them back:

| Column | Why | How |
|---|---|---|
| `products.stock` | `MarketplaceService` decrements stock at checkout | adds back quantities from deleted `order_items` whose product still exists |
| `packaging_items.stock_qty` | `LoyaltyController` decrements on redemption | adds back deleted `packaging_redemptions` |
| `hubs.current_parcel_count` | `ParcelService` increments per parcel | → `0` |
| `promo_codes.used_count` | `PromoService` increments per redemption | → `0` |
| `provider_profiles.completed_jobs` | derived from bookings | → `0` |
| `wallets.balance` | `WalletService` credits/debits | → `0` (rows kept) |

ID sequences of cleared tables are restarted at 1 for predictable test IDs.
Sequences of preserved tables are left alone so new rows never collide.

---

## 5. Safety design

1. **Dry run by default** — the whole script runs in one transaction that is
   `ROLLBACK`ed unless you pass `apply=on`.
2. **`\set ON_ERROR_STOP on`** — any error aborts before `COMMIT`, so a partial
   reset can never land.
3. **PRESERVE GUARD** — row counts of all 18 structural tables are captured before
   and after; if any changed, the script raises and nothing is committed.
4. **MONEY GUARD** — asserts zero ledger rows and zero wallet balance at the end.
5. **No `TRUNCATE ... CASCADE`** — CASCADE would also wipe `product_reviews`
   through the `order_items` FK. Deletions are explicit, children before parents.
6. **Automatic `pg_dump`** before any `-Apply`; `-Restore` rebuilds from it.

---

## 6. Verifying a reset

The script prints before/after reports. After `-Apply`, confirm:

```sql
SELECT count(*) FROM ledger_transactions;   -- 0
SELECT count(*) FROM orders;                 -- 0
SELECT coalesce(sum(balance),0) FROM wallets;-- 0.00
SELECT count(*) FROM users;                  -- 28 (unchanged)
SELECT count(*) FROM products;               -- 29 (unchanged)
SELECT count(*) FROM product_reviews;        -- 81 (unchanged)
```

Then in the app: log in with any `DEMO-ACCOUNTS.txt` account, open Finance /
Affiliate / Rider screens — all balances and histories should read empty, and a
fresh checkout should start ledger IDs at 1.

---

## 7. Known data findings (surfaced by the reset's own diagnostics)

Section `1z` of the report found pre-existing integrity drift in the current DB:

- **33 `order_items` rows are orphaned** — they point at `products` (ids 1–77) and
  `orders` that no longer exist (the products table now starts at id 97). They
  survived an earlier data reload performed with trigger checks disabled.
- **50 stock units are stranded** as a result and cannot be given back to any
  product. The reset deletes these rows, which cleans the drift up.
- `product_reviews`, `wallets`, `ledger_transactions` and `products` are all
  consistent (0 orphans).

---

## 8. Not covered (deliberately)

- **Uploaded files** — `storage/app/public/` proof-of-delivery photos, product and
  ad images are untouched (they belong to preserved rows).
- **Sanctum tokens / sessions** — kept, so you stay logged in. Clear them via
  appendix item `A5` in the SQL if you want a true cold start.
- **Analytics** — `product_views`, `rider_locations`, `profile_views` kept; see
  appendix `A1`–`A2`.
- **Ad campaigns** — kept because they render as homepage promo banners; see
  appendix `A3` (zero counters only) and `A4` (delete rows).
- **No application code was modified** — this is a data-only procedure.
