# Bayan — HomepageV2 (React Component Skeleton)

> **Purpose**: layout scaffold for the new dense, deal-driven homepage (`/`, customer landing). Purple `#673de6` / charcoal `ink-*` / amber theme, mobile-first, self-contained (React only — no external imports). Placeholder slots are explicitly marked; wire copy is illustrative, not final (Marketing owns copy).
> **Reference**: `uiux/homepage-layout-wireframe.md` (section spec), `uiux/design-system.md` (tokens), PRD §4.3/§4.4/§4.14/§4.9.
> **Integration target**: swap the current `MarketplaceHome.jsx` at `/` (App.jsx `MainRoutes`) OR mount as `HomepageV2` inside the Shell — keep Shell's header connectivity pill + bottom nav.

---

## Component map (slots)

| Slot | Name | Notes |
|---|---|---|
| `HeroCarousel` | admin banners | dots + arrows, auto-advance |
| `DealBar` | urgency strip | countdown to `flash_deal.ends_at` |
| `CategoryRail` | icon shortcuts | horizontal scroll |
| `FlashGrid` | 2-col sale cards | `-X% OFF`, countdown chip, `Earn +N Suki` |
| `PromoBanners` | stacked cross-sell | Points Shop / Workers / free delivery |
| `ProductCard` + `ProductGrid` | dense browse | **price anchoring** (`from ₱` + strikethrough) |
| `TrustStrip` | payments/proof/offline chips | de-risk |
| `Footer` | brand + links | rebranded (no "Box") |

---

## Skeleton code

```jsx
import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ *
 * HomepageV2 — dense, deal-driven storefront (layout scaffold only).
 * Purple/charcoal/amber theme, mobile-first. No external imports.
 * Wire copy is illustrative — Marketing owns final copy.
 * Real data hooks (each labeled with its PRD endpoint) replace MOCK.
 * ------------------------------------------------------------------ */

const BRAND = '#673de6';

/* ── countdown hook (flash-deal urgency) ─────────────────────────── */
function useCountdown(targetMs) {
  const [left, setLeft] = useState(targetMs - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(targetMs - Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const s = Math.max(0, Math.floor(left / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/* ── MOCK data (replace with real API reads, PRD § listed) ───────── */
const MOCK_BANNERS = [
  { id: 1, title: 'Bayan Mall grand sale', img: '', link: '/search?category=Provincial%20Goods', cta: 'Shop now' },
  { id: 2, title: 'Fresh from the farm', img: '', link: '/search?category=Fresh%20Produce', cta: 'Browse' },
];
const MOCK_CATEGORIES = [
  { label: 'Fresh Produce', icon: '🥬', to: '/search?category=Fresh%20Produce' },
  { label: 'Home Cooks', icon: '🍳', to: '/search?category=Home%20Cooks' },
  { label: 'Local Crafts', icon: '🧶', to: '/search?category=Local%20Crafts' },
  { label: 'Packaging', icon: '📦', to: '/search?category=Packaging' },
  { label: 'Provincial Goods', icon: '🏝️', to: '/search?category=Provincial%20Goods' },
  { label: 'Points Shop', icon: '🪙', to: '/points-shop' },
];
const MOCK_FLASH = [
  { id: 1, name: 'Fresh Kangkong bundle', price: 200, sale: 120, rating: 4.5, reviews: 12, suki: 5, img: '' },
  { id: 2, name: 'Home-cooked adobo pack', price: 80, sale: 45, rating: 3.8, reviews: 40, suki: 3, img: '' },
];
const MOCK_PRODUCTS = [
  { id: 1, name: 'Local rice 25kg', price: 1250, sale: 1100, unit: 'sack', rating: 4.7, reviews: 84, suki: 10, img: '' },
  { id: 2, name: 'Handwoven banig', price: 250, sale: null, unit: 'pc', rating: 4.9, reviews: 21, suki: 6, img: '' },
  { id: 3, name: 'Sari-sari bundle', price: 120, sale: null, unit: 'set', rating: 4.2, reviews: 8, suki: 2, img: '' },
];

/* ── Small shared pieces ─────────────────────────────────────────── */
function ImageFallback({ src, alt, className }) {
  // Offline-safe: gradient tile + emoji fallback, never a remote placeholder.
  return (
    <div className={`bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center text-3xl overflow-hidden ${className}`}>
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : <span>🛍️</span>}
    </div>
  );
}

function PriceBlock({ price, sale, unit }) {
  const discount = sale ? Math.round((1 - sale / price) * 100) : 0;
  return (
    <div className="mt-1">
      <div className="flex items-baseline gap-1">
        {/* price anchoring: strikethrough original + "from" for multi-unit */}
        {sale ? <span className="text-[11px] text-ink-400 line-through">₱{price.toLocaleString()}</span> : null}
        <span className="text-sm font-black text-ink-900">
          {unit ? 'from ' : ''}₱{(sale ?? price).toLocaleString()}
        </span>
        {discount > 0 && (
          <span className="text-[10px] font-black text-white bg-red-500 px-1 py-0.5 rounded-full">-{discount}%</span>
        )}
      </div>
      {unit && <span className="text-[10px] text-ink-500">per {unit}</span>}
    </div>
  );
}

/* ── Slot 1: Hero carousel ───────────────────────────────────────── */
function HeroCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [paused, banners.length]);
  if (!banners.length) return null;
  const b = banners[idx];
  return (
    <section
      aria-label="Promotions"
      className="relative rounded-2xl overflow-hidden shadow-lift"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SLOT: hero slide → render <img> from b.img (or Link to b.link) */}
      <ImageFallback src={b.img} alt={b.title} className="w-full h-40 sm:h-48" />
      <a href={b.link} className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-bayan-600 text-white text-xs font-bold shadow-lg">
        {b.cta} →
      </a>
      {/* SLOT: carousel controls — 44px hit area, dots + arrows */}
      <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
        <button aria-label="Previous" onClick={() => setIdx((idx - 1 + banners.length) % banners.length)} className="w-9 h-9 flex items-center justify-center">‹</button>
        {banners.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1} of ${banners.length}`}
            onClick={() => setIdx(i)}
            className="w-9 h-9 flex items-center justify-center"
          >
            <span className={`w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`} />
          </button>
        ))}
        <button aria-label="Next" onClick={() => setIdx((idx + 1) % banners.length)} className="w-9 h-9 flex items-center justify-center">›</button>
      </div>
    </section>
  );
}

/* ── Slot 2: Urgency / deal bar ──────────────────────────────────── */
function DealBar({ flashEndsAt }) {
  const time = useCountdown(flashEndsAt);
  return (
    <section className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 rounded-2xl px-4 py-3">
      {/* SLOT: headline copy (Marketing) */}
      <span className="text-sm font-black">⚡ Flash Deals today</span>
      <div className="flex items-center gap-2">
        <span className="font-black tabular-nums" aria-live="polite">⏱ {time}</span>
        <a href="/search?on_sale=1" className="underline text-xs font-bold">See all</a>
      </div>
    </section>
  );
}

/* ── Slot 3: Category icon rail ──────────────────────────────────── */
function CategoryRail({ categories }) {
  return (
    <nav aria-label="Shop by category" className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
      {categories.map((c) => (
        <a key={c.label} href={c.to} className="w-16 shrink-0 flex flex-col items-center gap-1">
          <span className="w-14 h-14 rounded-2xl bg-bayan-50 flex items-center justify-center text-2xl">{c.icon}</span>
          <span className="text-[11px] font-bold text-ink-700 leading-tight text-center">{c.label}</span>
        </a>
      ))}
      <a href="/search" className="w-16 shrink-0 flex flex-col items-center gap-1">
        <span className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center text-2xl">➕</span>
        <span className="text-[11px] font-bold text-ink-700">More</span>
      </a>
    </nav>
  );
}

/* ── Slot 4: Flash-sale grid (2-col) ─────────────────────────────── */
function FlashGrid({ items, flashEndsAt }) {
  const time = useCountdown(flashEndsAt);
  return (
    <section aria-label="Flash deals">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">🔥 Flash Sale</h3>
        <span className="text-[11px] font-bold text-red-600">⏱ {time}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((p) => (
          <a key={p.id} href={`/product/${p.id}`} className="card p-2.5 block">
            <div className="relative">
              {/* SLOT: product image; sale badge; countdown chip */}
              <ImageFallback src={p.img} alt={p.name} className="w-full h-24 rounded-lg mb-1.5" />
              {p.sale && <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">-{Math.round((1 - p.sale / p.price) * 100)}%</span>}
            </div>
            <h4 className="font-bold text-ink-800 text-sm line-clamp-1">{p.name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(p.rating))}</span>
              <span className="text-[11px] text-ink-500">({p.reviews})</span>
            </div>
            <PriceBlock price={p.price} sale={p.sale} />
            {p.suki > 0 && <span className="block text-[11px] font-semibold text-bayan-600 mt-0.5">🪙 Earn +{p.suki} Suki</span>}
            <button className="w-full mt-1.5 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">
              + Add
            </button>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── Slot 5: Stacked promo banners ───────────────────────────────── */
function PromoBanners() {
  const promos = [
    { icon: '🪙', title: 'Points Shop', sub: 'Redeem with Suki Points', to: '/points-shop', tint: 'from-amber-50 to-amber-100 border-amber-200 text-amber-800' },
    { icon: '🧑‍🔧', title: 'Skilled Workers', sub: 'Hire nearby local pros', to: '/providers', tint: 'from-bayan-50 to-bayan-100 border-bayan-200 text-bayan-800' },
    { icon: '🛵', title: 'Free delivery over ₱500', sub: 'In your barangay', to: '/search', tint: 'from-ink-50 to-ink-100 border-ink-200 text-ink-700' },
  ];
  return (
    <section aria-label="Offers" className="space-y-3">
      {promos.map((p) => (
        <a key={p.title} href={p.to} className={`card p-4 flex items-center gap-3 bg-gradient-to-br ${p.tint} group`}>
          <span className="text-2xl">{p.icon}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold">{p.title}</span>
            <span className="block text-xs text-ink-500">{p.sub}</span>
          </span>
          <span className="text-ink-300 group-hover:translate-x-0.5 transition">→</span>
        </a>
      ))}
    </section>
  );
}

/* ── Slot 6: Dense product grid (price anchoring) ────────────────── */
function ProductCard({ p }) {
  return (
    <a href={`/product/${p.id}`} className="card p-2 flex flex-col">
      <ImageFallback src={p.img} alt={p.name} className="w-full h-20 rounded-lg mb-1.5" />
      <h4 className="text-xs font-bold text-ink-800 leading-snug line-clamp-2">{p.name}</h4>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-amber-400 text-[11px]">{'★'.repeat(Math.round(p.rating))}</span>
        <span className="text-[10px] text-ink-500">({p.reviews})</span>
      </div>
      <PriceBlock price={p.price} sale={p.sale} unit={p.unit} />
      <button className="mt-auto w-full mt-1.5 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">
        + 🛒
      </button>
    </a>
  );
}

function ProductGrid({ products }) {
  return (
    <section aria-label="Shop local barangays">
      {/* SLOT: filter chips row — category / sort (PRD §4.4) */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">Shop local barangays</h3>
        <a href="/search" className="text-xs font-bold text-bayan-600">See all →</a>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {/* SLOT: infinite scroll / Load More */}
      <div className="flex justify-center pt-3">
        <button className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl">Load more</button>
      </div>
    </section>
  );
}

/* ── Slot 7: Trust strip ─────────────────────────────────────────── */
function TrustStrip() {
  const chips = ['✓ GCash · Maya · COD', '✓ PIN + photo proof', '✓ Up to 100 km', '✓ Works offline'];
  return (
    <section aria-label="Why shop with Bayan" className="flex flex-wrap justify-center gap-2 pt-1">
      {chips.map((c) => <span key={c} className="px-3 py-1.5 rounded-full bg-ink-100 text-ink-600 text-[11px] font-bold">{c}</span>)}
    </section>
  );
}

/* ── Footer (rebranded — no "Box") ───────────────────────────────── */
function Footer() {
  return (
    <footer className="pt-4 border-t border-ink-100">
      <div className="flex items-center gap-2 text-lg font-black text-ink-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND }}>🏪</span>
        Bayan
      </div>
      <p className="mt-2 text-xs text-ink-500">Your neighbor barangay's store, at your door.</p>
      <p className="mt-4 text-center text-[11px] text-ink-400">© {new Date().getFullYear()} Bayan · Made for Philippine provinces.</p>
    </footer>
  );
}

/* ── HomepageV2 — assembles all slots ────────────────────────────── */
export default function HomepageV2({ user, online = true, queueCount = 0, onNavigate }) {
  // SLOT: real data hooks — replace MOCK with:
  //   banners   → GET /api/banners            (PRD §4.18)
  //   categories→ GET /api/products/categories (PRD §4.4)
  //   flash     → GET /api/products?on_sale=1&sort=discount (PRD §4.5)
  //   products  → GET /api/products?per_page=20 (PRD §4.4)
  //   suki      → GET /api/loyalty             (PRD §4.9)  [user only]
  const [banners] = useState(MOCK_BANNERS);
  const [categories] = useState(MOCK_CATEGORIES);
  const [flash] = useState(MOCK_FLASH);
  const [products] = useState(MOCK_PRODUCTS);
  const flashEndsAt = Date.now() + 3 * 60 * 60 * 1000; // SLOT: flash_deal.ends_at

  return (
    <div className="space-y-5 pb-4">
      {/* SLOT: sticky header (identity + location anchor + cart) —
          normally lives in Shell; inline for standalone demo */}
      <header className="sticky top-0 z-40 bg-ink-900 text-white shadow-lift-dark">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND }}>🏪</span>
            <span className="text-lg font-black tracking-tight">Bayan</span>
          </span>
          <button className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold">
            Deliver to: Tara ▾
          </button>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-white/15">
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-amber-900'}`} />
            {online ? 'Online' : 'Offline'}
            {queueCount > 0 && <span className="px-1 bg-white text-bayan-700 rounded-full text-[10px]">{queueCount}</span>}
          </span>
        </div>
      </header>

      {/* SLOT: search bar (facets, PRD §4.4) */}
      <form
        onSubmit={(e) => { e.preventDefault(); onNavigate?.('/search?q=' + encodeURIComponent(new FormData(e.currentTarget).get('q') || '')); }}
        className="flex items-center gap-2 p-2.5 bg-white border border-ink-200 rounded-2xl focus-within:ring-2 focus-within:ring-bayan-500"
      >
        <span className="text-ink-400 pl-1">🔍</span>
        <input name="q" placeholder="Search products, stores, or opis…" className="flex-1 bg-transparent outline-none text-sm text-ink-800 placeholder:text-ink-400" />
      </form>

      <HeroCarousel banners={banners} />
      <DealBar flashEndsAt={flashEndsAt} />
      <CategoryRail categories={categories} />
      <FlashGrid items={flash} flashEndsAt={flashEndsAt} />
      <PromoBanners />
      <ProductGrid products={products} />
      <TrustStrip />
      <Footer />

      {/* SLOT: bottom nav — defer to Shell.jsx per-role tabs */}
    </div>
  );
}
```

---

## Integration notes
1. **Swap point**: App.jsx `MainRoutes` → replace `MarketplaceHome` at `/` with `HomepageV2` (keep role-conditional routing for admin/staff/merchant/rider).
2. **Data**: each slot documents its PRD endpoint; wire MOCK data into a small `useHomeData()` hook that fires the reads and falls back to cached/offline values (PRD §2.2).
3. **Accessibility**: single-link cards (no nested buttons), 44 px targets, `aria-label` on carousel controls, `tabular-nums` countdown (design-system §8).
4. **Rebrand**: use "Bayan" everywhere; no "Box", no 🧊 mark (legacy `LandingPage.jsx` / `beboolbox-logo.png` — audit Issue 13).
5. **Copy**: headline/CTA/offer text are wire placeholders — Marketing owns final copy (see `homepage-layout-wireframe.md` §6).
