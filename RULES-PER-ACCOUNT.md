# RULES-PER-ACCOUNT.md — Role-Based Rules & Access Matrix (Bayan)

> Applies to: **Admin, Staff, Rider, Merchant, Customer, Provider** — enforced by `App\Enums\Role` + `EnsureRole` middleware (`backend/routes/api.php`) and by the frontend navigation (`frontend/src/components/Shell.jsx`, `frontend/src/App.jsx`).
> Reference: `HABI-prd-v1.md` §3. Default demo password: **`Password123!`**.

---

## 0. Login & Session Rules (all roles)

- Register/login by **phone + password** (`POST /api/auth/register|login`).
- One account has one role; the role decides the landing page and the tab set.
- `GET /api/auth/me` restores the session; `GET /api/wallets` shows the account's wallets.
- Every role may edit their **own profile** (name, email, barangay, municipality, fixed latitude/longitude).

---

## 1. Customer (`role=customer`) — e.g. Juan Dela Cruz `09170000005`

| Area | Rules |
|---|---|
| Marketplace | Browse, search, filter, view products/stores; public homepage without login |
| Cart | Add/remove items, sync cart, checkout (pickup or delivery) |
| Checkout | GCash/Maya/COD/Points/Affiliate-balance; enters delivery address + coordinates; sees merchant→customer delivery estimate and fee; **delivery > 100 km is blocked** |
| Orders | View own orders, track status (state machine), cancel own orders (before dispatch), generate delivery PIN |
| Points | Earn Suki points on purchases/reviews; redeem in Points Shop (points-only items); packaging redemptions; doorstep upgrade |
| Bookings | Hire providers, confirm or request rework after provider completes; review providers |
| Affiliate | **Eligible** — referral code/QR/PDF poster, register referrals, see earnings + income sources + ledger + pending (72h hold), request cash-out (min ₱200, after ID activation) |
| Profile | `/customer/profile` — edit info + fixed lat/lng (GPS button or manual) |
| Support | File support tickets |

---

## 2. Rider (`role=rider`) — e.g. Rico the Rider `09170000003`

| Area | Rules |
|---|---|
| Deliveries | See assigned deliveries (`/rider/deliveries`), view **merchant→customer route map**, call customer, navigate via Google Maps directions, mark out-for-delivery, mark delivered (PIN + photo), refuse (auto-reassign round-robin) |
| Dashboard | Active order + queue, today's earnings, merchant + customer cards with route map |
| Batches/Wallet | Legacy parcel batches, GPS telemetry, wallet (rider_prepaid), earnings, cash-outs |
| Emergency | Send SOS/incident report (`/rider/emergency`) → staff resolves |
| COD | Cash collected at delivery; COD payouts released when order delivered; remits collected COD to the hub (staff records remittance) |
| Affiliate | **Eligible** — same as customer affiliate program (income sources + 72h hold) |
| Profile | `/rider/profile` — edit info + fixed lat/lng |

---

## 3. Merchant (`role=merchant`) — e.g. Mang Juan Store `09170000004`

| Area | Rules |
|---|---|
| Products | CRUD own products (active/draft/archived), images, sale price, points items, low-stock alerts. **Blocked while `pending_verification` (403)** |
| Orders | Accept/reject orders, mark ready for pickup, view merchant orders (`/merchant/orders`) |
| Fulfillment | State-machine transitions owned by merchant: accept, reject, mark_ready |
| Analytics | Dashboard + reports: revenue, pending orders, units sold, wallet balance, best-sellers |
| Wallet | Withdraw from `merchant_earnings`, manage payout accounts (GCash/Maya/Bank), cash-outs |
| Ads | Create/pause/resume ad campaigns (sponsored/featured/flash deal), analytics |
| Profile | `/merchant/profile` — store name, email, barangay, municipality, **store location (lat/lng, GPS or manual)**, verification docs (DTI/SEC, gov ID, business permit, picture) |
| Affiliate | **Eligible** — same as customer affiliate program |
| Support | File support tickets |

**Merchant verification rules**: new merchants start `pending_verification`; they cannot create/update products until approved (403). Admin approves/rejects with reason.

---

## 4. Provider (`role=provider`) — Skilled Worker

| Area | Rules |
|---|---|
| Profile | `/provider/profile` — skills card, picture, availability, hourly rate, **fixed lat/lng**, official badge, completed jobs, profile views |
| Jobs | Accept bookings → complete → resubmit on rework; payout on customer confirm (`provider_earnings`) |
| Reviews | Reviewed by customers; reviews award Suki points |
| Affiliate | **Eligible** — same as customer affiliate program |
| Bookings | Two-party completion: customer confirm or rework (with reason) |

---

## 5. Staff (`role=staff`) — e.g. Nena Hub Staff `09170000002`

| Area | Rules |
|---|---|
| Ops Console | Dispatch queue, manual/auto rider assignment, live status board, force status override, incident management, support tickets (refund reversal / redelivery / dismiss), delivery history + audit trail, hazard zones |
| Mall/Hub Inventory | View/edit mall inventory, hub inventory, parcel intake/release/return (OTP) |
| **Finance** | `GET /staff/finance` summary (collected cash, rider COD outstanding, merchant payables) and **`POST /staff/finance/remit`** to record rider COD remittances |
| Hub referral QR | **Allowed** — hub-level referral QR/poster (hub feature) |
| **Affiliate (personal)** | **STRICTLY BLOCKED (403)** — staff cannot enroll in the personal affiliate program, cannot see personal earnings, cannot request cash-outs |
| Profile | Edit own info + fixed lat/lng |

---

## 6. Admin (`role=admin`) — e.g. Admin `09170000001`

| Area | Rules |
|---|---|
| Oversight | Merchants (verify/approve/reject/activate/deactivate), riders, affiliates (activate, cash-out approve/decline), mall products, banners, ads (rate override, credit grants), categories, settings (fees/ads/toggles/locations) |
| **Finance** | `GET /admin/finance` — money-flow overview: total collected by payment method, all wallet balances (incl. escrow), rider COD collections, merchant payables, pending cash-outs |
| Ops | Same dispatch/incident/ticket powers as staff (role: staff, admin) |
| Mall | Admin-owned store; mall sales → `admin_earnings` (0% rake) |
| Affiliate management | Admin console lists affiliates + cash-outs (approve/decline/activate); admin is **not** enrolled in the personal consumer affiliate program |
| Profile | Edit own info + fixed lat/lng |

---

## 7. Hard Guardrails (enforced — see `.dsh/skills/AGENTS.md`)

1. **Staff ↔ Affiliate**: staff are always 403 from the personal affiliate program (backend `AffiliateController::assertAffiliateEligible` allow-list + route scoping). Hub referral QR remains a hub feature usable by staff.
2. **Pending merchants**: `pending_verification` merchants cannot invoke product create/update (403).
3. **Ledger integrity**: all wallet movements are double-entry (`ledger_transactions`), wrapped in `DB::transaction`, with unique `transaction_hash`; splits read from `config('bayanbox.*')` (90/10 marketplace, 100% mall→admin, 85/15 delivery, ₱5/₱5 pickup).
4. **Ownership**: riders only see their own deliveries; customers only see their own orders/bookings; merchants only their own products/orders.
5. **Service area**: delivery beyond 100 km (`max_delivery_km`) is rejected at checkout (backend 422 + frontend block).

---

## 8. Demo Accounts Quick Reference

All passwords: **`Password123!`**

| Role | Name | Phone |
|---|---|---|
| Admin | Admin | 09170000001 |
| Staff | Nena Hub Staff | 09170000002 |
| Rider | Rico the Rider | 09170000003 |
| Rider (extra) | Berto Rider | 09175550000 |
| Merchant (verified, Tara Sipocot) | Mang Juan Store | 09170000004 |
| Merchant (pending) | Nena Sari-Sari | 09170000007 |
| Customer (cart+points, Tara Sipocot) | Juan Dela Cruz | 09170000005 |
| Customer | Maria Clara | 09170000006 |
| Affiliate (pending cash-out) | Rosie | 09170000008 |
| Affiliate (extra) | Karding | 09170000009 |
| Reviewers | Ramon / Liza / Tomas | 09170000010/11/12 |
