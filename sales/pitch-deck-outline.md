# Bayan — B2B Sales Pitch Deck Outline
## Recruiting Local Marketplace Merchants / MSMEs (Provincial)

> **Source of truth**: `bayanbox-prd-v3.md` + `RULES-PER-ACCOUNT.md`. Every claim below is backed by a PRD fact.
> **Audience**: Sari-sari stores, local food sellers, crafts, fresh produce, home cooks, packaging suppliers.
> **Narrative through-line**: *"Your next customer is already shopping online — Bayan keeps them buying from you, in your own barangay."* We move from pain → platform → money → trust → proof → action.

---

## Slide 1 — Title / Hook: "Your Store, Online. Delivered in Your Barangay."
**Talking points**
- Big-picture one-liner: a *provincial* marketplace + delivery network, built for local sellers.
- Name drop the platform's dual engine: **local e-commerce marketplace** + **last-mile delivery**.
- Today's promise: more customers, less delivery hassle, no complex setup.

**Supporting PRD facts**
- Bayan is a "phygital" (physical + digital) provincial logistics orchestration platform connecting local micro-merchants (MSMEs), community hubs (sari-sari stores), riders, customers, affiliates, and skilled workers. (PRD §1)
- B2C Local E-Commerce Marketplace: merchants list products; customers browse, search, add to cart, checkout with GCash/Maya/COD. (PRD §1.1)

---

## Slide 2 — The Problem: Local Customers Are Shopping Elsewhere
**Talking points**
- Online buyers exist in the province today — but many buy from city sellers who add shipping they can't afford.
- Local sellers lose sales because they have no storefront and no reliable delivery.
- Fear of "going digital": complicated listings, unclear money handling, no one to deliver.

**Supporting PRD facts**
- The platform solves "physical + digital" gaps explicitly — the whole premise of the PRD is connecting offline micro-merchants to online demand. (PRD §1)
- Delivery distance is now computed **from the merchant's store** to the customer — proof the model is built around *local stores as the origin* of commerce. (PRD §2.3, §4.8)

---

## Slide 3 — The Solution: Bayan in 30 Seconds
**Talking points**
- One app, three jobs done for you: a **storefront**, an **order system**, and a **delivery network**.
- It's a marketplace (customers find you) *and* a delivery network (riders reach them).
- Plus: a Points Shop, packaging supply marketplace, and a skilled-worker directory drive more footfall to the ecosystem.

**Supporting PRD facts**
- Core value props implemented: B2C marketplace, B2B packaging marketplace, product advertising, last-mile delivery, Suki Points loyalty, affiliate program, merchant operations. (PRD §1)

---

## Slide 4 — Getting Your Store Online: Verify, Profile, Go Live
**Talking points**
- It starts with a quick verification — that's what earns buyer trust.
- Your store gets its own **profile with a pin on the map** (your exact store location), so delivery is quoted from *your door*.
- Until approved you can't list products — approval unlocks everything. Walk through what you need to submit.

**Supporting PRD facts**
- New merchants start `pending_verification`; admin approves/rejects with reason; lifecycle `pending_verification → active / rejected`. (PRD §4.2, RULES §3)
- Verification docs required: DTI/SEC, government ID, business permit, store picture. (RULES §3)
- Merchant profile: store name, email, barangay, municipality, **store location (lat/lng via GPS or manual)**, verification docs. (PRD §4.22)
- Pending merchants are 403-blocked from product create/update until approved. (RULES §3, §7.2)

---

## Slide 5 — How an Order Flows: You Accept, We Deliver
**Talking points**
- Simple merchant job: **accept the order → mark it ready** — a rider takes it from there.
- Clear, visible statuses for you and your customer the whole way.
- Trust features baked in: delivery PIN + photo proof; COD payouts released only on delivery.

**Supporting PRD facts**
- Fulfillment state machine (merchant-owned transitions): `pending_merchant → preparing → ready_for_pickup → raider_assigned → ... → delivered`. (PRD §4.8)
- Merchant actions: accept / reject, mark_ready; staff/admin assign riders; rider handles depart-to-merchant through complete-delivery. (PRD §4.8)
- Delivery requires 4-digit one-time **PIN** + **proof-of-delivery photo**. (PRD §4.8)
- **COD orders**: payouts deferred until rider marks delivered (released on delivery). (PRD §5)
- Delivery distance calculated **merchant store → customer address**, 100 km service-area cap. (PRD §2.3, §4.7)

---

## Slide 6 — The Money: You Keep 90% of Every Sale
**Talking points**
- Flat, simple economics: no complicated tiers.
- Your earnings land in a **merchant wallet**; withdraw to GCash, Maya, or your bank whenever you like.
- Platform fee breakdown shown honestly — nothing hidden.

**Supporting PRD facts**
- Regular sale split: **Merchant 90% / Platform 10%** (plus product affiliate % and Suki points). (PRD §5)
- Merchant wallet = `merchant_earnings`; cash-out via `POST /merchant/cash-out`. (PRD §4.15)
- **Payout accounts**: GCash / Maya / Bank CRUD + set-default. (PRD §4.15, RULES §3)
- COD platform fee 1%, pickup handling fee ₱10 (config). (PRD §5)
- Multi-party double-entry ledger (`ledger_transactions`) records every movement. (PRD §4.16)

---

## Slide 7 — Grow Faster: Product Ads You Control
**Talking points**
- Put your products in front of buyers with paid visibility — start small, measure everything.
- Three campaign types at low daily rates; pause/resume anytime.
- See **impressions, clicks, and conversions** — you pay for real exposure, and can pay from wallet or Suki points.

**Supporting PRD facts**
- Ad types: **Sponsored ₱50/day, Homepage Featured ₱100/day, Flash Deal ₱30/day** (config `ads.rates`), max 30 days. (PRD §4.14)
- Campaigns support pause/resume; paid via wallet or points. (PRD §4.14)
- Analytics: impressions/clicks/conversions via `AdService` + public impression/click tracking. (PRD §4.14)
- Admin can grant ad credits; ads inject into search results + homepage. (PRD §4.14, §4.19)

---

## Slide 8 — Earn Even More: The Merchant Affiliate Program
**Talking points**
- Merchants aren't just sellers — they can also earn as **affiliates** by referring other buyers and sellers.
- Share your referral code, QR, or a **printed PDF poster** (great for sari-sari counters).
- Commissions are held briefly (72-hour grace) then released — cancelled orders don't pay; it's fair to everyone.

**Supporting PRD facts**
- Affiliate program open to Customer, **Merchant**, Rider, Provider (staff excluded 403). (PRD §4.11, RULES §5)
- Referral code + QR + **PDF poster** rendered server-side. (PRD §4.11)
- Commission hold/vesting: held in `pending_affiliate_commissions` for 72h, released on schedule; **cancelled orders void the hold**. (PRD §4.11, §5)
- ID document upload + admin activation required before cash-out; **min cash-out ₱200**. (PRD §4.11)
- Earnings screen shows income sources + full ledger + pending. (PRD §4.11)

---

## Slide 9 — Trust & Visibility: The Verified Badge Effect
**Talking points**
- A "verified" store with reviews and a real map location converts browsers into buyers.
- Only verified buyers can review — reviews stay honest.
- Customer loyalty via **Suki Points** keeps them coming back to *your* products (you can even award points per item).

**Supporting PRD facts**
- Verified merchants: `verified_at`, verification notes stored on the user. (PRD §4.2)
- Storefront public without login; store pages + search with reviews/sales/price sorting. (PRD §4.3, §4.4)
- **Verified-buyer-only** reviews, unique per (user, product). (PRD §4.9)
- Products carry `suki_points_award` granted on purchase; customers earn points on purchases & reviews. (PRD §4.9, §4.10)
- Products visible on storefront only when `active` + in stock + available. (PRD §4.5)

---

## Slide 10 — Your Merchant Dashboard: Run Your Store With Data
**Talking points**
- Stop guessing — see revenue, best-sellers, pending orders, and low-stock alerts in one screen.
- Full reports: month/lifetime revenue, units sold, daily trend.
- Never miss an order: new-order notifications and a pending-orders queue.

**Supporting PRD facts**
- Merchant dashboard + reports: store status, KPIs (month/lifetime revenue, pending orders, units sold, wallet balance), pending-orders queue, **low-stock alerts**, daily revenue trend, best-sellers, wallet + withdrawal history. (PRD §4.15, RULES §3)
- Notifications: merchant new order / approved / rejected, affiliate status. (PRD §4.12)
- Product fields include `low_stock_threshold`, sale price + "On Sale", availability, stock. (PRD §4.5)

---

## Slide 11 — Proof: Money Moves You Can See and Audit
**Talking points**
- Every peso is traceable: a double-entry ledger with a unique hash on every transaction.
- Delivery fees split 85% to riders / 15% to platform — your delivery is covered and riders are paid.
- Staff and admins run a **financial settlement** console — collected cash, rider COD remittances, merchant payables — so balances reconcile, not guesswork.

**Supporting PRD facts**
- Delivery fee split: **Rider 85% / Platform 15%** (configurable per municipality). (PRD §5)
- Pickup fee ₱10 → ₱5 hub staff / ₱5 platform. (PRD §5)
- Admin finance overview: total collected by payment method, all wallet balances (incl. escrow), rider COD collections, merchant payables, pending cash-outs. (PRD §4.21)
- Staff finance: summary + `POST /api/staff/finance/remit` records rider COD remittances to the hub (audit trail: rider_id, amount, notes, recorded_by). (PRD §4.21)
- Double-entry ledger with `transaction_hash`, wrapped in DB transactions. (PRD §4.16, RULES §7.3)

---

## Slide 12 — Call to Action: Start Before Demand Spikes
**Talking points**
- Onboarding is a *real* review process — verified stores are first in line when demand spikes (paydays, fiestas, holidays).
- Limited onboarding slots this cycle; the earlier you verify, the sooner you list.
- Next step: reply / scan the QR / book a 10-minute call — we'll walk you through documents and go-live in days.

**Supporting PRD facts**
- Merchants can't list products until admin approval — approval is the gate, so early application matters. (RULES §3, §7.2)
- Platform ships everything live today: verification workflow, merchant wallet + payout accounts, ads, affiliate program, rider delivery with PIN/photo, and staff/admin financial settlement. (PRD §1, §4)

---

### Speaker Notes Quick Reference (Facts Only)
| Slide | Sharpest single fact |
|---|---|
| 1 | Two engines: marketplace + last-mile delivery. |
| 4 | 3 docs to verify: DTI/SEC, gov ID, business permit + store pic. |
| 5 | Merchant does 2 actions: accept → mark ready; rider does the rest. |
| 6 | 90/10 split; cash out to GCash, Maya, or bank. |
| 7 | Ads from ₱30/day; impressions/clicks/conversions tracked. |
| 8 | Referral QR + printed PDF poster; 72h hold; ₱200 min cash-out. |
| 9 | Verified badge + verified-buyer-only reviews + Suki Points. |
| 11 | 85/15 rider/platform delivery split; staff + admin settlement dashboards. |
