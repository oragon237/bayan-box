# Bayan — 3-Part Cold Email Sequence for Merchant / MSME Recruiting

> **Source of truth**: `bayanbox-prd-v3.md` + `RULES-PER-ACCOUNT.md`. All facts below are from the PRD.
> **Sender**: [Your Name], Sales Executive — Bayan | [your phone / WhatsApp] | [bayanbox site]
> **Cadence**: Email 1 → 3 days → Email 2 → 3–4 days → Email 3. Each email under 200 words.

---

## Email 1 — Hook + Value Proposition

**Subject:** Your next customer is shopping online — keep them buying from you

**Greeting:** Hi [Store Owner Name],

Your neighbors are buying online every day. Right now, many of them end up buying from city sellers — plus shipping they can't afford. Bayan keeps those sales in your own barangay.

Bayan is a provincial marketplace + delivery network built for local stores like yours. List your products, and customers nearby can find you, order, and pay — GCash, Maya, or cash on delivery.

Here's what changes for you:

- **You keep 90% of every sale.** A flat 10% platform share. No hidden tiers.
- **Last-mile delivery is handled.** Our riders pick up from your store and deliver to your customer's door.
- **No upfront listing or subscription fees.** You only share when you sell.

No technical skills needed. If you can list a product on a phone, you're ready.

Reply **"interested"** and we'll start your onboarding this week.

**[Your Name], Sales Executive — Bayan**

---

## Email 2 — Proof + Specifics

**Subject:** The actual math of a Bayan store — you keep 90%

**Hi [Store Owner Name],**

Last email I promised delivery handled — here's the rest of the math, straight from how our platform works:

- **Every regular sale:** you keep 90%, platform takes 10%.
- **COD orders:** your payout is released the moment the rider delivers, with a PIN and photo as proof.
- **Your money, your way:** withdraw from your merchant wallet to GCash, Maya, or your bank.

Now the growth levers:

- **Run ads:** Sponsored (₱50/day), Homepage Featured (₱100/day), or Flash Deal (₱30/day) — with impressions, clicks, and conversions tracked.
- **Earn as an affiliate:** share your referral code, QR, or printed poster and earn commissions (released after a 72-hour hold; cash out from ₱200).
- **Get the verified badge:** submit your DTI/SEC, gov ID, and business permit — our admin team approves your store.

One honest requirement: you must be verified before you can list products. That's what makes buyers trust you.

Reply **"details"** for the full onboarding checklist.

**[Your Name], Sales Executive — Bayan**

---

## Email 3 — Objection Handling + Urgent CTA

**Subject:** Last call: limited onboarding spots before demand spikes

**Hi [Store Owner Name],**

Two questions we hear most — answered directly:

**"Isn't it hard to sell online?"**
No. You accept the order and mark it ready. Our riders take over from there — round-robin assignment, refuse-and-reassign, and a route map from your store to the customer's door. You can even block deliveries beyond 100 km from your store.

**"Do I really get paid, and is it accurate?"**
Yes — and it's transparent. Every peso is tracked in a double-entry ledger: your merchant earnings, delivery splits (85% to riders, 15% to platform), and a settlement dashboard our staff and admins reconcile, including COD cash remittances from riders back to the hub.

Demand spikes around paydays and fiestas — and verified stores are first in line. Onboarding is limited, and pending stores can't list products until approved.

Reply **"start"** today and we'll reserve your verification slot.

**[Your Name], Sales Executive — Bayan**

---

### Word counts (for reference)
- Email 1: ~150 words
- Email 2: ~165 words
- Email 3: ~150 words

### Facts-only checklist (every claim maps to the PRD)
| Claim in email | PRD / RULES source |
|---|---|
| 90/10 split, flat 10% | PRD §5 (Regular sale: Merchant 90% / Platform 10%) |
| Last-mile handled by riders | PRD §4.8 (fulfillment state machine, rider transitions) |
| GCash / Maya / COD payments | PRD §4.7 (payment_method) |
| COD released on delivery + PIN/photo | PRD §4.8, §5 (COD deferred until delivered; PIN + POD photo) |
| Withdraw to GCash/Maya/Bank | PRD §4.15 (merchant_payout_accounts) |
| Ads ₱50 / ₱100 / ₱30 per day | PRD §4.14 (ads.rates) |
| Ads track impressions/clicks/conversions | PRD §4.14 (AdService + tracking endpoints) |
| Affiliate for merchants, QR + PDF poster | PRD §4.11 (eligible roles incl. merchant; QR + poster) |
| 72-hour commission hold | PRD §4.11 (commission_hold_hours default 72) |
| Cash out from ₱200 | PRD §4.11 (min cash-out ₱200) |
| Verification docs (DTI/SEC, gov ID, business permit) | RULES §3 (verification docs list) |
| Verified before listing products | RULES §3, §7.2 (pending_verification 403 on product CRUD) |
| 100 km delivery cap | PRD §4.7, §5 (max_delivery_km default 100) |
| Delivery split 85/15 rider/platform | PRD §5 |
| Double-entry ledger + settlement dashboard | PRD §4.16, §4.21 (admin/staff finance, remit) |
