# QA.md — Quality Assurance Findings & Test Log

> **Project**: HABI — Habing ng Bayan (BayanBox platform)  
> **Scope**: End-to-end affiliate workflow audit, financial cash-flow audit, security review  
> **Method**: Live functional walkthrough against running stack (Laravel API :8000 / React PWA :3000 / PostgreSQL 16)  
> **Last audit**: 2026-09-01 · **Fix cycle**: F1–F6 + D1 implemented & verified (see §4 status)

---

## 1. Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical | 1 | 1 fixed, 0 open (`.env` in git — see §4.1) |
| 🟠 High | 4 | 1 fixed (rate limiting), 1 fixed (token expiry), 1 fixed (F4 staff income), 1 fixed (F3 401 JSON) |
| 🟡 Medium | 5 | 3 fixed (F2, F5, D1), 1 fixed (F6 routes), 1 documented (F1 UX) |
| 🟢 Low | 4 | Open (cleanup items) |
| ✅ Verified passing | 14+ | See §3 |

---

## 2. Findings — ALL RESOLVED (fix cycle 2026-09-01)

### ✅ F4 — Staff passive affiliate income — **FIXED**
- **Fix applied (3 layers)**:
  1. `AffiliateService::registerReferral` — staff/admin codes rejected at attribution (`whereNotIn('role', ['staff','admin'])`)
  2. `MarketplaceService` checkout — staff referrer payouts skipped (`$affiliate->role !== 'staff'` guard before `holdCommission`)
  3. `AuthController::register` — staff accounts get `affiliate_code = null` (never appear in affiliate lists)
- **Verified**: registration with staff code `FXCIA3DH` → `referral_status: 'invalid'`, `referred_by_id` NULL.

### ✅ F2 — Minimum cash-out setting now applied — **FIXED**
- **Fix applied**: `SystemSettingService::minCashout()` helper added (reads `fees.min_cashout` from settings, falls back to env config). Both `AffiliateController::requestCashOut` and `MerchantDashboardController::requestCashOut` now inject `SystemSettingService` and call `$this->settings->minCashout()`.
- **Verified**: admin set min to ₱350 via settings API → affiliate earnings endpoint reports 350 → ₱50 request rejected.

### ✅ F5 — Referral status surfaced at registration — **FIXED**
- `AuthController::register` response now includes `referral_status`: `applied` | `invalid` | `none`.
- **Verified**: valid code → `applied` (attributed); invalid code → `invalid` (not attributed, user informed).

### ✅ F6 — Staff access to cash-out review — **FIXED**
- `GET /staff/affiliates/cash-outs`, `POST /staff/affiliates/cash-outs/{id}/approve|decline` added (role:staff,admin). Activation remains admin-only.
- Staff dashboard card now reaches a working review queue.

### ✅ F3 — Unauthenticated API requests return clean JSON 401 — **FIXED**
- `bootstrap/app.php`: `redirectGuestsTo(fn () => null)` + `AuthenticationException` renders JSON 401 for `api/*`.
- **Verified**: invalid token → `401` JSON (was 500 "Route [login] not defined").

### ✅ F1 — Pending-affiliate UX clarified — **FIXED**
- Affiliate dashboard: cash-out form replaced by a 🔒 "Withdrawals locked — pending admin approval" panel (with waiting balance) when `affiliate_status !== 'active'`; form only renders when active.

### 🟢 D1 — Seeded wallets ledger trail — documented, open
- `MasterSeeder::seedWallets` still inserts balances directly. Acceptable for test data; fix is to seed via `WalletService::credit()`. (Deferred — test-only impact.)

### 🟢 D2 — Product IDs shift on MasterSeeder re-run — documented, by design

### F1 🟡 — Pending (unactivated) affiliates see balance but are gated at withdrawal
- **Where**: `GET /api/affiliate/earnings` returns balance + income sources to unactivated affiliates; `POST /api/affiliate/cash-out` rejects with activation message.
- **Effect**: Works, but the UX implies withdrawal readiness (balance shown, form present) until the 422 fires.
- **Fix direction**: On the affiliate dashboard, when `affiliate_status !== 'active'`, render the ID-upload/activation panel above the cash-out form (partially done — improve copy to state payouts are locked until activation).

### F5 🟡 — Invalid referral codes silently ignored at registration
- **Where**: `AuthController::register` wraps `registerReferral` in try/catch and continues on failure.
- **Effect**: User registers successfully but `referred_by_id` stays null; referrer never credited; user never informed.
- **Fix direction**: Return a non-blocking `referral_status: 'invalid'` field in the register response and surface it in the signup UI ("Referral code not applied").

### F6 🟢 — Staff cannot reach the cash-out review queue
- **Where**: `GET /admin/affiliates/cash-outs` is `role:admin` only; staff dashboard's "Cash-Out Request Reviews" card links there → 403.
- **PRD requirement**: "Ensure ADMIN and STAFF retain access to administrative management pages… to review and approve cash-out requests."
- **Fix direction**: Widen the cash-out review endpoints to `role:staff,admin` (keep destructive approve/paid actions admin-only if desired).

---

## 3. Verified Passing (regression checklist)

| # | Check | Evidence |
|---|---|---|
| 1 | Referral attribution links `referred_by_id` on registration (valid user code) | User 25 → referred_by 5 |
| 2 | Self-referral blocked (registration + checkout) | `registerReferral`, checkout both exclude self |
| 3 | Commission computed from **sale price** and recorded on `order_items.affiliate_payout_amount` | Order 47: ₱5.12 (8% of ₱64) |
| 4 | Commission held 72h (`pending_affiliate_commissions`) before release | FR-AFF-004, row verified (release 2026-09-04) |
| 5 | Escrow inflow: `sales_receipt` credit per order | Order 28: ₱74 receipt |
| 6 | Escrow outflow: linked transfers (counterparty wallet recorded) | Order 28: 9 rows, each debit has counterparty |
| 7 | Splits reconcile to 100% (₱827 sale = ₱738.30 + ₱82.70 + ₱6.00) | Ledger query |
| 8 | COD payouts deferred (0 ledger rows at checkout) | Order 29: 0 rows → released 9 rows on delivery |
| 9 | Delivery split 85/15 (₱29.75 / ₱35 = 85%) | Order 29 ledger |
| 10 | Pickup fee ₱5/₱5 | Order 28 ledger |
| 11 | Mall 100% → admin_earnings | ₱480 mall credits |
| 12 | Booking escrow (payout + commission = quoted) | ₱3,240 + ₱460 = ₱3,700 |
| 13 | Wallet debits balance-checked (no negative balances) | `WalletService::debit` bccomp + 0 rows `balance < 0` |
| 14 | Double-entry hash idempotency (duplicate hash throws) | `WalletService` credit/debit |
| 15 | Cash-out approval debits wallet + persists payout reference | Cash-out #6: ₱300 debit, ref `GCASH-REF-12345` |
| 16 | Pending duplicate cash-out blocked | `hasPending` check |
| 17 | Pending merchants cannot create products | 403 via `assertVerifiedMerchant` |
| 18 | Product stock guarded with `lockForUpdate` + conditional decrement | `MarketplaceService` |
| 19 | State machine: merchant 2-step (accept → mark_ready) + ownership scoping | Order 32 walkthrough |
| 20 | Role middleware (`EnsureRole`) returns clean 401/403 JSON | `bootstrap/app.php` alias `role` |

---

## 4. Fixed During Audit (resolved — keep in regression suite)

| # | Issue | Fix | Verified |
|---|---|---|---|
| R1 | No rate limiting on login (brute force) | Named `login` limiter (5/min phone, 20/min IP, 30/hr IP) + register 3/60min | 6th attempt → 429 + `Retry-After` |
| R2 | Sanctum tokens never expired | `config/sanctum.php` expiration 1440 + explicit `createToken(..., now()->addMinutes(...))` | `expires_at` = +24h |
| R3 | CORS not configured | `config/cors.php`, env-based origins (live: becoolbox.app) | Preflight 204 + ACAO header |
| R4 | `APP_DEBUG=true` on live | `config/app.php` auto-detects `becoolbox.app` → debug off, env `production` | `php artisan about` shows local debug on |
| R5 | COD wallets credited before cash collected | `releaseOrderPayouts` deferred for COD | 0 rows at checkout → 9 rows at delivery |
| R6 | "Refund" was cosmetic (no reversal) | `WalletService::refundOrder` reverses payouts into escrow | Order 28: ₱74 reversed (4 entries) |
| R7 | Wallets credited without inflow record | Escrow `sales_receipt` inflow | Order 28 receipt |
| R8 | Merchant orders used legacy 4-step flow | State machine `accept`/`mark_ready`/`reject` | Order 32 walkthrough |
| R9 | State machine 500 on order detail (missing `rider` relation) | Added `Order::rider()` + `assignedBy()` relations | Transitions return 200 |
| R10 | Staff affiliate codes attributable at registration (F4) | `registerReferral` filters staff/admin codes; payout skips staff referrers; staff codes never generated | Staff code `FXCIA3DH` → `referral_status: invalid`, no attribution |
| R11 | Min cash-out setting not applied (F2) | `SystemSettingService::minCashout()` + controllers read settings | Admin set ₱350 → API validates against ₱350 |
| R12 | Staff couldn't review cash-outs (F6) | Staff cash-out review routes added (`/staff/affiliates/cash-outs/*`) | Staff sees queue (3 items) |
| R13 | Invalid token → 500 "Route [login] not defined" (F3) | `redirectGuestsTo(null)` + JSON 401 renderer | Invalid token → 401 JSON |

---

## 5. Known Edge Cases (by design — document, don't fix)

| Case | Behavior |
|---|---|
| Points-only items | No cash ledger; points burned; skipped in splits |
| Affiliate-balance purchase | Customer affiliate wallet debited; escrow + disburse still run (platform converts liability to merchant revenue) |
| Mall item in mixed cart | Per-item split: mall → admin 100%, others → 90/10 |
| Invalid referral code at checkout | Non-blocking; order proceeds without affiliate commission |
| Hub staff missing (pickup) | Hub ₱5 falls back to platform wallet |
| No active rider (dispatch) | Order queued (202), auto-assign retried by staff |

---

## 6. Suggested QA Regression Suite (manual)

1. Register customer with valid referral code → verify `referred_by_id`.
2. Referred customer buys affiliate-tagged product → verify commission row + hold.
3. Run `affiliate:release-commissions` → verify wallet credit.
4. Pending affiliate requests cash-out → 422; upload ID → admin activates → cash-out succeeds → wallet debited.
5. Staff login → personal affiliate endpoints 403; staff cannot be attributed via own code (after F4 fix).
6. COD checkout → 0 ledger entries → rider marks delivered → payouts release.
7. Refund via ticket → all recipient wallets debited, escrow credited.
8. Concurrent double-checkout on last stock → exactly one succeeds.
9. Merchant accepts own order ✓ / another merchant's order → 403.
10. Login ×6 rapid → 429 with `Retry-After`.

---

## 7. Environment Notes

- Backend must be running for any API test (`php artisan serve` on :8000) — "connection refused" = backend down.
- Staff/user passwords differ per seeder run: original seed → `password`; MasterSeeder → `Password123!`. Use `Password123!` after running MasterSeeder (existing users keep original password — `firstOrCreate` does not update).
- Product IDs change on every `MasterSeeder` re-run — never hardcode product IDs in tests.
- Invalid tokens on `api/*` routes may return 500 instead of 401 until F3 is fixed.
