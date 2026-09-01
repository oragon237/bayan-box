# Bayan — New Homepage: Content, Copy & Offer Strategy

**Owner:** Marketing Lead (content / copy / offer strategy)
**Collaborator:** UI/UX Agent (layout & wireframe) — this doc defines *what* each block says and *why*; the wireframe defines *how* it's arranged.
**Inspiration mechanic:** Temu's high-density, deal-driven storefront — **steal the mechanic, never the look or the words**.
**Sources:** `bayanbox-prd-v3.md` (now branded **Bayan**) · `RULES-PER-ACCOUNT.md` · `marketing/branding-positioning-ideas.md`
**Theme:** purple `#673de6` · charcoal `ink-*` · amber accent · DM Sans · mobile-first PWA.

---

## 0. Positioning Reminder (every block must serve this)

> **"Your neighbor barangay's store — at your door."**
> Ang tindahan ng kapit-barangay, nasa pintuan mo.

Three pillars, repeated in different words throughout the page:
1. **Reach** — your store now serves the *next* barangay; buyers can shop a barangay they don't live in.
2. **Freshness, not boxes** — sariwa, hindi naka-box.
3. **Trust across barangays** — verified merchants, Suki Points, reviews, PIN + photo proof, fair delivery.

---

## 1. HOMEPAGE COPY (per block)

### 1.1 Hero (top, above the fold)
| Field | Copy |
|---|---|
| **Eyebrow badge** | `📍 Tara, Sipocot` (geo-chip with the user's municipality — always local) |
| **Headline (EN)** | **Your neighbor barangay's store — at your door.** |
| **Headline (Taglish)** | **Ang tindahan ng kapit-barangay, nasa pintuan mo.** |
| **Subhead (EN)** | Fresh produce, lutong-bahay, and sari-sari staples from verified local stores — delivered fast, sariwa, hindi naka-box. |
| **Subhead (Taglish)** | Sariwang gulay, lutong-bahay, at pangangailangan sa tindahan — mula sa verified na tindahan sa kalapit na barangay, ihahatid sa iyo. |
| **CTA primary** | `Mamili ngayon` (Shop now) → scrolls to deal grid |
| **CTA secondary (merchant)** | `Ilabas ang tindahan mo` (Put your store out there) → merchant onboarding |
| **Micro-trust line** | `GCash · Maya · COD · Suki Points` |

### 1.2 Category shortcut row
- **Headline:** `Ano ang kailangan mo ngayon?` (What do you need today?)
- **Label style:** 2-word tiles, Filipino-first. See full set in §3.

### 1.3 Barangay Flash Sale rail
- **Headline:** `Barangay Flash Sale` + live countdown chip `Matatapos sa 02:14:36`
- **Sub-line:** `Mula sa mga tindahan ngayong hapon — bago magsara ang benta.` (From today's afternoon stores — before the sale closes.)
- **Card CTA:** `Bilhin` (Buy) · rail "see all": `Tingnan lahat`

### 1.4 Araw-Araw Deal (daily deal hero card)
- **Headline:** `Araw-Araw Deal` with badge `Deal ng Araw`
- **Sub-line:** `Ngayon: [Mang Juan Store, Tara] — [Kalamansi 250g] mula ₱40 → ₱28.` (Today's pick, rotated daily.)
- **CTA:** `Kunin ang deal` (Grab the deal)

### 1.5 Promo banner stack (2–3 stacked banners)
1. `Libreng delivery sa kapit-barangay` — **CTA:** `I-claim` (Claim)
2. `Suki Points x2 ngayong linggo` — **CTA:** `Kumita ng points` (Earn points)
3. `Bayan Mall — official provincial goods, 0% rake` — **CTA:** `Tingnan ang Mall`

### 1.6 Main product grid (tabs)
- Tab labels: `Para sa'yo` (For you) · `Best Sellers` · `Sariwa Ngayon` (Fresh today) · `Bago sa Bayan` (New in town)
- Section headline above tabs: `Bumili mula sa kapit-barangay` (Buy from the neighbor barangay)
- Card CTA (dense grid): price button `₱28` (tap-to-add), plus `+` affordance.

### 1.7 Nearby stores rail
- **Headline:** `Tindahan sa kapit-barangay` (Stores in the neighbor barangay)
- **Card:** store avatar + name + `📍 [Barangay], [Municipality]` + rating + `Bisitahin ang tindahan` (Visit the store)

### 1.8 Trust strip (full-width, see §4)
- **Headline:** `Bakit magtiwala sa Bayan?` (Why trust Bayan?) — no CTA, pure reassurance.

### 1.9 Suki Surprise + Kapit-Bahay Rewards (gamified, see §2.4–2.5)
- **Suki Surprise:** `Buksan ang bayong, kunin ang premyo` (Open the bayong, take the prize) — **CTA:** `Buksan ang bayong`
- **Kapit-Bahay Rewards:** `I-refer ang kapit-bahay, kumita ng commission` — **CTA:** `Mag-refer at kumita` (Refer & earn) · secondary `I-share ang code`

### 1.10 Merchant conversion band (bottom)
- **Headline:** `Tindahan mo, bukas sa buong bayan.` (Your store, open to the whole town.)
- **Body:** `Keep 90% of every sale · delivery from your store · verified badge · payout to GCash/Maya/bank`
- **CTA:** `Ilista ang iyong tindahan — libre` (List your store — free)

### 1.11 Footer microcopy (reassurance repeat)
- `Sariwa, hindi naka-box. · Delivery PIN + photo proof · 100 km coverage, fair fees · Works offline`

---

## 2. DEAL / URGENCY STRUCTURE (Bayan-flavored, legally distinct)

| Temu mechanic | Bayan equivalent | Why it works for us |
|---|---|---|
| Flash deals + countdown | **Barangay Flash Sale** — 2-hour timed windows rotating by barangay/category (e.g., "Gulay ngayon, 1PM–3PM") | Names the *place*, not just the deal — hyper-local urgency. Maps to existing merchant **Flash Deal ads (₱30/day, PRD §4.14)** surfaced on the homepage. |
| "Limited time" banners | **Fiesta Countdown** — countdown to the town/municipal fiesta weekend ("Fiesta ng Sipocot — Sabado na!") | Calendar-native urgency; every province has a fiesta. Seasonal anchor for promo carousel (§4.3 admin banners). |
| Daily deal | **Araw-Araw Deal** — one rotating barangay merchant + product at a steep, honest discount, refreshed daily | Predictable daily habit ("anong deal ngayon?"), promotes a *different* barangay each day — showcases coverage. Maps to **Homepage Featured ads (₱100/day)**. |
| Gamified loyalty (spin/coins) | **Suki Surprise** — a daily tap-to-reveal prize (bonus Suki Points, discount voucher, or free doorstep upgrade) framed as *opening a bayong*, not a casino wheel | Filipino object (bayong) instead of a generic wheel; uses **existing Suki Points engine (PRD §4.10)**. Honest: small, predictable rewards. |
| Referral rewards | **Kapit-Bahay Rewards** — refer a neighbor-barangay buyer; earn commission with a **72-hour grace hold that voids if the order is cancelled** | Uses the **existing affiliate program (PRD §4.11)**; the 72h-hold honesty is a *trust differentiator* — we tell users the money is protected, not instant. |
| Free shipping banner | **Libreng delivery sa kapit-barangay** + **Doorstep upgrade (50 Suki Points, 3 km, PRD §4.10)** | "Free for neighbors" is truer than "free for everyone" — matches merchant→customer origin model. |

### 2.1 Urgency copy rules (keep honest — this is a trust brand)
- Countdowns only on *real* time-window deals (flash sale, fiesta), never fake.
- Always show `Mula ₱X` (from-price) with strikethrough alongside the real `₱Y`.
- Never say "only X left" unless stock is actually low (`low_stock_threshold` exists in PRD §4.5 — use it truthfully).
- Flash sale sub-line naming the barangay: `Mula kay Mang Juan, Tara — hanggang 3PM.`

### 2.2 Daily deal mechanic (spec)
- One deal/day, auto-rotated at midnight; merchant + product + sale_price from the product's real `sale_price` (PRD §4.5) or a flash-deal campaign.
- Deal card shows: product photo, merchant name + barangay chip, `Mula ₱40 → ₱28` (strikethrough), `-30%`, countdown to midnight, and Suki Points earned (`+5 Suki Points`).
- Rule: a merchant can be "Deal ng Araw" at most once a week → fairness across barangays.

### 2.3 Suki Surprise mechanic (spec)
- One tap-to-reveal per day per logged-in user; rewards pool: `+10 Suki Points` (common), `-₱20 voucher` (uncommon), `Libreng doorstep upgrade` (rare, ties to PRD §4.10 50-pts/3km rule).
- Frame as *"Buksan ang bayong"* — a woven basket reveal, Filipino and warm, not a casino wheel.

### 2.4 Kapit-Bahay Rewards (referral hook — copy that sells the 72h hold)
- Headline: `Kumita kapag bumili ang kapit-bahay mo.`
- Body: `I-share ang iyong referral code o QR. Kapag may umorder, may commission ka — protektado ng 72-hour grace period, at kung makansela ang order, walang magiging commission. Ganito namin pinoprotektahan ang rewards.` (Share your code or QR. When someone orders, you earn — protected by a 72-hour grace period; if the order is cancelled, no commission is created. That's how we protect rewards.)
- Honesty note: this *advertises the guardrail* (PRD §4.11 / §5) as a feature — "we don't pay fake referrals" is a trust signal Temu doesn't have.

---

## 3. CATEGORY SET (homepage shortcut icons)

8 tiles, 4×2 grid on mobile — Filipino-first labels, tap → `/search?category=...` (PRD §4.3):

| Icon | Label (Taglish) | Label (EN) | Sample items |
|---|---|---|---|
| 🥬 | **Sariwang Gulay** | Fresh Produce | sili, ampalaya, kalamansi, kamatis |
| 🍚 | **Lutong-Bahay** | Home Cooks | pandesal, chicken inasal bento, kakanin |
| 🥫 | **Sari-Sari Staples** | Sari-Sari Staples | canned goods, instant coffee, sabon, laundry |
| 🧺 | **Local Crafts** | Local Crafts | bayong, banig, woven baskets |
| 🛍️ | **Packing & Pambaon** | Packaging | kraft bags, supot, containers (B2B, Suki Points redeemable — PRD §4.10) |
| 🏺 | **Provincial Goods** | Provincial Goods | local honey, vinegar, pasalubong |
| ⭐ | **Points Shop** | Points Shop | points-only items (PRD §4.10) |
| 🔧 | **Skilled Workers** | Skilled Workers | hire verified providers (PRD §4.13) |

Notes for UI/UX agent: **avoid a 📦 (box) icon for the Packaging tile** — use 🛍️/🧵 to reinforce "not-a-box." Tiles should render from the admin-managed category catalog (PRD §4.18), with these 8 as the default order.

---

## 4. TRUST STRIP (full-width, 4 columns on desktop / 2×2 on mobile)

**Headline:** `Bakit magtiwala sa Bayan?` · **Sub:** `Verified na tindahan. Protektadong rewards. Malinaw na delivery.`

| Icon | Title | Copy |
|---|---|---|
| ✅ | **Verified merchants** | Bawat tindahan ay dumadaan sa verification (ID + business docs, admin-approved) bago magbenta. (Every store is verified before selling — PRD §4.2.) |
| ⭐ | **Suki Points sa bawat order** | Kumita ng points sa bawat bili at review — i-redeem sa Points Shop. (Earn points on every order and review — PRD §4.10.) |
| 🛵 | **PIN + photo proof** | May 4-digit delivery PIN at photo proof ang bawat pagdating — hindi basta iiwan ang order. (Every delivery has a PIN + photo proof — PRD §4.8.) |
| 📍 | **Cover ang buong lugar mo** | Delivery mula sa tindahan hanggang sa bahay mo — hanggang 100 km, fair per-km fees, walang runaway quote. (Delivery from the store to your home, up to 100 km, fair fees — PRD §2.3, §5.) |

**Reframing note:** never lead with "100 km limit." Lead with **"we cover your whole area"** and *then* state the cap as honesty: *"hanggang 100 km, fair per-km fees"*. The cap is a fairness feature, not a boundary complaint.

---

## 5. PRICE ANCHORING (realistic pesos, Philippine provincial)

Pattern: `Mula ₱X` (from-price) always paired with strikethrough original + `-N%` + `+N Suki Points`.

| Product | Original | Sale | Anchor copy on card |
|---|---|---|---|
| Kalamansi 250 g | ₱40 | ₱28 | `Mula ₱28` ~~₱40~~ `-30%` |
| Siling haba 100 g | ₱35 | ₱22 | `Mula ₱22` ~~₱35~~ `-37%` |
| Ampalaya 500 g | ₱60 | ₱45 | `Mula ₱45` ~~₱60~~ `-25%` |
| Pandesal (10 pcs) | ₱30 | ₱25 | `Mula ₱25` ~~₱30~~ `-17%` |
| Chicken inasal bento | ₱120 | ₱99 | `Mula ₱99` ~~₱120~~ `-18%` |
| Bayong (large) | ₱150 | ₱120 | `Mula ₱120` ~~₱150~~ `-20%` |
| Kraft bags (20 pcs) | ₱50 | ₱38 | `Mula ₱38` ~~₱50~~ `-24%` (B2B, points-redeemable) |
| Points Shop item | — | 100 pts | `100 Suki Points` (no cash) |

**Delivery anchoring (honest, near-first):**
- `Delivery mula ₱20` (kapit-barangay) — always shown as a *starting* price with `sukat mula sa tindahan mo` (measured from your store).
- `Libreng delivery` banner qualified: `sa kapit-barangay` or `pag may ₱399+ order` — qualify honestly, never a blanket lie.
- **Doorstep upgrade:** `+50 Suki Points = libreng doorstep upgrade (3 km)` (PRD §4.10).

**Bundle mechanic (sari-sari native):** "Tingi packs" — multi-item bundles that mirror real sari-sari buying: `Pambaon Pack (pandesal + kape + itlog): mula ₱45` (~~₱58~~). Bundles raise AOV naturally, in a way Temu's "multi-item card" mechanic can't match culturally.

---

## 6. "NOT-A-BOX" REASSURANCE (fresh/cooked goods)

**Master line (use everywhere, hero + trust strip + product badges + footer):**

> **`Sariwa, hindi naka-box.`** — Fresh, not boxed.

**Supporting line for perishables:**
> `Pandesal, inasal, sili, at kalamansi — dumarating sa food-safe bags at lalagyan, mabilis na mabilis. Walang box requirement. May care requirement.` (Pandesal, inasal, sili, and kalamansi arrive in food-safe bags and containers, fast. No box requirement — there's a *care* requirement.)

**Product-card badges for perishable categories:** `Sariwa` (fresh) · `Mainit pa` (still warm, lutong-bahay) · `Pwedeng i-deliver ngayon` (deliverable today). Use **food-safe bag/container illustrations, never a box** in the fresh/cooked sections.

---

## 7. WHAT TO AVOID (legal & brand distinctness from Temu)

**The rule:** steal the *mechanic* (dense grid, countdown, price anchoring, gamified loyalty — these are ideas, not protectable expression), but never reproduce Temu's *expression*: slogans, mascot, specific copy, or visual identity.

1. **No Temu slogans, exact or translated.** Never use or adapt: "Shop like a billionaire," "Team up, price down," "Together we shop," "Buy & win," or any Temu catchphrase. All our lines are original Filipino-flavored copy (this doc).
2. **No copycat mascot.** Temu's mascot is a cute red shopping-bag/tag character. **Do not** create a similar bag/tag/basket character. Our visual vocabulary: **bayong (woven basket), jeepney, kariton, kalabaw, sari-sari jar** — Filipino objects only.
3. **Distinct color & typography (keep ours).** Temu = red/orange/white + heavy condensed sans. Bayan = **purple `#673de6` + charcoal `ink-*` + amber accent + DM Sans** (PRD §9). Do not introduce red/orange dominance or a condensed display font that mimics Temu's look.
4. **No Temu-style badge copy.** Their UI stamps like "MEGA SALE," "88% OFF," "$0 Shipping" are their expressions. Ours: `Barangay Flash Sale`, `Araw-Araw Deal`, `Suki Surprise`, `Libreng delivery sa kapit-barangay`, `-N% OFF` (a generic discount badge is fine and functional).
5. **Don't copy the "coupon-clutter" density verbatim.** We want density, but our page still breathes with rounded-2xl cards, gradient hero, and glow orbs (PRD §9). Density *with* brand warmth.
6. **No identical deal names.** Avoid "Deal of the Day," "Flash Sale" alone is generic-but-shared; our **compound Filipino names** (`Araw-Araw Deal`, `Barangay Flash Sale`, `Fiesta Countdown`, `Suki Surprise`) are the distinct brand.
7. **Don't import Temu's packaging/free-shipping claims.** Ours are honest and qualified (§5), which is both legally safer and *better* for a trust-first provincial brand.
8. **Commission original illustrations/icons** (or use an original icon set) for category tiles and the bayong reveal — don't lift emoji sets or icon packs that mimic Temu's look; emojis are fine as placeholders only.

---

## 8. Collab Note for UI/UX Agent (content → layout handoff)

- **Scroll order (1–2 screens, mobile-first):** Hero → Category tiles (4×2) → Barangay Flash Sale rail → Araw-Araw Deal card → Promo banner stack → Trust strip → Main grid tabs → Nearby stores rail → Suki Surprise + Kapit-Bahay Rewards → Merchant conversion band → Footer.
- **Priority:** category tiles + flash sale rail + Araw-Araw Deal must fit in the first screenful after the hero — that's where Temu's conversion density comes from.
- **Every product card** must carry: image, name, `Mula ₱X` + strikethrough + `-N%`, `+N Suki Points`, merchant barangay chip (`📍 Tara`), and verified badge for cross-barangay trust.
- **Keep public without login** (PRD §4.3); login only triggered at checkout/add-to-cart.
- **Existing backend hooks to reuse:** banner carousel + category grid + "On Sale Deals" carousel (PRD §4.3), ad campaigns incl. flash deal (PRD §4.14), Points Shop & Skilled Worker quick links, admin-managed categories (PRD §4.18) — the layout can be built on today's data without new endpoints for v1 of this homepage.
