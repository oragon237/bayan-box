import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner } from '../../components/ui.jsx';
import { MapPinIcon, ArrowRightIcon } from '../../components/icons.jsx';

/**
 * HomepageV2 — dense, deal-driven storefront for HABI.
 * Teal/navy/mango theme, mobile-first. Inspired by the mechanic of
 * modern deal-driven storefronts (density, urgency, price anchoring) but
 * uses HABI's own identity + local Filipino content.
 *
 * Shell (components/Shell.jsx) already renders the sticky header + bottom
 * nav + connectivity pill, so this page only renders the scrollable body.
 *
 * Data endpoints (PRD §4.3/§4.4/§4.14/§4.18):
 *   banners    → GET /banners
 *   categories → static rail (icons below)
 *   flash      → GET /products?per_page=6&on_sale=1&sort=reviews
 *   products   → GET /products?per_page=12
 */

const CATEGORIES = [
  { label: 'Fresh Produce', icon: '🥬', to: '/search?category=Fresh%20Produce' },
  { label: 'Home Cooks', icon: '🍳', to: '/search?category=Home%20Cooks' },
  { label: 'Local Crafts', icon: '🧶', to: '/search?category=Local%20Crafts' },
  { label: 'Packaging', icon: '🧺', to: '/search?category=Packaging' },
  { label: 'Provincial Goods', icon: '🏺', to: '/search?category=Provincial%20Goods' },
  { label: 'Points Shop', icon: '⭐', to: '/points-shop' },
];

/* ── countdown hook (urgency, PRD §4.14) ─────────────────────────── */
function useCountdown(targetMs) {
  const [left, setLeft] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const s = Math.floor(left / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/* ── Image w/ offline-safe fallback (failed URL → emoji, never blank) ─ */
function ImageFallback({ src, alt, className, emoji = '🛍️' }) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={`bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center overflow-hidden ${className}`}>
      {show
        ? <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} loading="lazy" />
        : <span className="text-3xl">{emoji}</span>}
    </div>
  );
}

/* ── Price anchoring: strikethrough original + "from" + -X% ─────── */
function PriceBlock({ price, sale, unit }) {
  const base = Number(price) || 0;
  const discount = sale ? Math.round((1 - Number(sale) / base) * 100) : 0;
  return (
    <div className="mt-1">
      <div className="flex items-baseline gap-1">
        {sale && <span className="text-[11px] text-ink-400 line-through">₱{base.toLocaleString()}</span>}
        <span className="text-sm font-black text-ink-900">
          {unit ? 'from ' : ''}₱{Number(sale ?? base).toLocaleString()}
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
function HeroCarousel({ banners, onGo }) {
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
      <button onClick={() => onGo(b.link_url || '/')} className="w-full block">
        <ImageFallback src={b.image_url} alt={b.title} className="w-full h-40 sm:h-48" />
        <span className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-bayan-600 text-white text-xs font-bold shadow-lg">
          {b.cta_text || 'Shop now'} →
        </span>
      </button>
      {banners.length > 1 && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
          <button
            aria-label="Previous"
            onClick={() => setIdx((idx - 1 + banners.length) % banners.length)}
            className="w-9 h-9 flex items-center justify-center text-white text-lg font-black"
          >
            ‹
          </button>
          {banners.map((_, i) => (
            <button key={i} aria-label={`Slide ${i + 1} of ${banners.length}`} onClick={() => setIdx(i)} className="w-9 h-9 flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`} />
            </button>
          ))}
          <button
            aria-label="Next"
            onClick={() => setIdx((idx + 1) % banners.length)}
            className="w-9 h-9 flex items-center justify-center text-white text-lg font-black"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}

/* ── Slot 2: Urgency / deal bar ──────────────────────────────────── */
function DealBar({ flashEndsAt, onGo }) {
  const time = useCountdown(flashEndsAt);
  return (
    <section className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 rounded-2xl px-4 py-3">
      <span className="text-sm font-black">⚡ Flash Deals today</span>
      <div className="flex items-center gap-2">
        <span className="font-black tabular-nums" aria-live="polite">⏱ {time}</span>
        <button onClick={() => onGo('/search?on_sale=1')} className="underline text-xs font-bold">See all</button>
      </div>
    </section>
  );
}

/* ── Slot 3: Category rail (real product images, emoji fallback) ──── */
function CategoryRail({ categories, categoryImages, onGo }) {
  return (
    <div className="flex items-stretch gap-4">
      <nav aria-label="Shop by category" className="flex min-w-0 md:w-[496px] md:shrink-0 lg:w-[520px] gap-3 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
        {categories.map((c) => {
          const img = categoryImages?.[c.label];
          return (
            <button key={c.label} onClick={() => onGo(c.to)} className="w-16 shrink-0 flex flex-col items-center gap-1">
              <span className="w-14 h-14 rounded-2xl bg-bayan-50 flex items-center justify-center overflow-hidden text-2xl">
                {img ? <CategoryTileImage src={img} alt={c.label} emoji={c.icon} /> : c.icon}
              </span>
              <span className="text-[11px] font-bold text-ink-700 leading-tight text-center">{c.label}</span>
            </button>
          );
        })}
        <button onClick={() => onGo('/search')} className="w-16 shrink-0 flex flex-col items-center gap-1">
          <span className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center text-2xl">➕</span>
          <span className="text-[11px] font-bold text-ink-700">More</span>
        </button>
      </nav>

      <button
        type="button"
        onClick={() => onGo('/delivery-cost')}
        className="hidden md:flex relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-ink-900 px-5 py-3 text-left text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-4 focus-visible:ring-bayan-200"
      >
        <span className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-bayan-500/30 blur-2xl" />
        <span className="absolute -right-3 bottom-0 h-20 w-20 rounded-full border border-blue-400/30" />
        <span className="relative flex h-full items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-bayan-300">
            <MapPinIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-bayan-300">HABI Delivery</span>
            <span className="mt-0.5 block text-sm font-black leading-tight">Need something delivered?</span>
            <span className="mt-1 block text-[11px] text-white/70">Estimate your local fare in seconds.</span>
          </span>
          <span className="hidden lg:inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-bold text-white">
            Estimate fare <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-white/70 lg:hidden" />
        </span>
      </button>
    </div>
  );
}

/* Category tile image — falls back to the emoji icon on error/404 */
function CategoryTileImage({ src, alt, emoji }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="text-2xl">{emoji}</span>;
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} loading="lazy" />;
}

/* ── Slot 4: Flash-sale grid (2-col) ─────────────────────────────── */
function FlashGrid({ items, flashEndsAt, onGo }) {
  const time = useCountdown(flashEndsAt);
  if (!items.length) return null;
  return (
    <section aria-label="Flash deals">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">🔥 Flash Sale</h3>
        <span className="text-[11px] font-bold text-red-600">⏱ {time}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="card p-2.5 block">
            <button onClick={() => onGo(`/product/${p.id}`)} className="w-full block text-left">
              <div className="relative">
                <ImageFallback src={p.image_url || p.images?.[0]?.image_url} alt={p.name} className="aspect-square w-full rounded-xl mb-2" />
                {Number(p.sale_price) > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                    -{Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)}%
                  </span>
                )}
              </div>
              <h4 className="font-bold text-ink-800 text-sm line-clamp-1">{p.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(p.reviews_avg_rating) || 4))))}</span>
                <span className="text-[11px] text-ink-500">({p.reviews_count || 0})</span>
              </div>
              <PriceBlock price={p.price} sale={p.sale_price} />
              {Number(p.suki_points_award) > 0 && (
                <span className="block text-[11px] font-semibold text-bayan-600 mt-0.5">🪙 Earn +{p.suki_points_award} Suki</span>
              )}
            </button>
            <button
              onClick={() => onGo(`/product/${p.id}`)}
              className="w-full mt-1.5 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl"
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Slot 5: Stacked promo banners ───────────────────────────────── */
function PromoBanners({ onGo }) {
  const promos = [
    { icon: '⭐', title: 'Points Shop', sub: 'Redeem with Suki Points', to: '/points-shop', tint: 'from-amber-50 to-amber-100 border-amber-200 text-amber-800' },
    { icon: '🧑‍🔧', title: 'Skilled Workers', sub: 'Hire nearby local pros', to: '/providers', tint: 'from-bayan-50 to-bayan-100 border-bayan-200 text-bayan-800' },
    { icon: '🛵', title: 'Free delivery over ₱500', sub: 'In your barangay', to: '/search', tint: 'from-ink-50 to-ink-100 border-ink-200 text-ink-700' },
  ];
  return (
    <section aria-label="Offers" className="space-y-3">
      {promos.map((p) => (
        <button key={p.title} onClick={() => onGo(p.to)} className={`card p-4 flex items-center gap-3 bg-gradient-to-br ${p.tint} group w-full text-left`}>
          <span className="text-2xl">{p.icon}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold">{p.title}</span>
            <span className="block text-xs text-ink-500">{p.sub}</span>
          </span>
          <span className="text-ink-300 group-hover:translate-x-0.5 transition">→</span>
        </button>
      ))}
    </section>
  );
}

/* ── Slot 6: Dense product grid (price anchoring) ────────────────── */
function ProductCard({ p, onGo }) {
  return (
    <div className="card p-2 flex flex-col">
      <button onClick={() => onGo(`/product/${p.id}`)} className="w-full block text-left">
        <ImageFallback src={p.image_url || p.images?.[0]?.image_url} alt={p.name} className="aspect-square w-full rounded-xl mb-2" />
        <h4 className="text-xs font-bold text-ink-800 leading-snug line-clamp-2">{p.name}</h4>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-amber-400 text-[11px]">{'★'.repeat(Math.min(5, Math.max(1, Math.round(Number(p.reviews_avg_rating) || 4))))}</span>
          <span className="text-[10px] text-ink-500">({p.reviews_count || 0})</span>
        </div>
        <PriceBlock price={p.price} sale={p.sale_price} />
      </button>
      <button
        onClick={() => onGo(`/product/${p.id}`)}
        className="mt-auto w-full mt-1.5 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl"
      >
        + 🛒
      </button>
    </div>
  );
}

/* ── Pabili highlight — buy-for-me, items outside the catalog ─────── */
function PabiliHighlight({ onGo }) {
  return (
    <section aria-label="Pabili — Buy For Me">
      <button
        onClick={() => onGo('/pabili')}
        className="w-full text-left rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-bayan-600 text-white p-5 shadow-lift relative overflow-hidden group"
      >
        <span className="absolute -right-6 -top-6 text-[120px] opacity-15 leading-none select-none">🧾</span>
        <span className="absolute top-3 right-3 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">New</span>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/85">Di may sa store? Pabili mo lang!</p>
        <p className="text-xl font-black tracking-tight mt-1">Pabili — Buy For Me 🛒</p>
        <p className="text-[11px] text-white/85 mt-1 max-w-md">
          Any item not in the catalog — list it, staff confirms the price, you approve, and a rider brings it straight to your door.
        </p>
        <span className="inline-flex items-center gap-1 mt-3 rounded-xl bg-white text-orange-600 px-3.5 py-2 text-xs font-black group-hover:bg-amber-50 transition">
          Try Pabili <ArrowRightIcon className="w-3.5 h-3.5" />
        </span>
      </button>
    </section>
  );
}

function MallShelf({ products, onGo }) {
  if (!products.length) return null;
  return (
    <section aria-label="HABI Mall">
      <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-ink-900 to-bayan-700 px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-bayan-200">Official store</p>
          <h3 className="text-base font-black">HABI Mall</h3>
          <p className="text-[11px] text-white/70">Everyday essentials, direct from HABI.</p>
        </div>
        <button onClick={() => onGo('/mall')} className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25">All products →</button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p) => <ProductCard key={p.id} p={p} onGo={onGo} />)}
      </div>
    </section>
  );
}

function ProductGrid({ products, onGo }) {
  if (!products.length) return null;
  return (
    <section aria-label="Shop local barangays">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">Shop local barangays</h3>
        <button onClick={() => onGo('/search')} className="text-xs font-bold text-bayan-600">See all →</button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {products.map((p) => <ProductCard key={p.id} p={p} onGo={onGo} />)}
      </div>
      <div className="flex justify-center pt-3">
        <button onClick={() => onGo('/search')} className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl">Load more</button>
      </div>
    </section>
  );
}

/* ── Slot 7: Trust strip ─────────────────────────────────────────── */
function TrustStrip() {
  const chips = ['✓ GCash · Maya · COD', '✓ PIN + photo proof', '✓ Up to 100 km', '✓ Works offline'];
  return (
    <section aria-label="Why shop with HABI" className="flex flex-wrap justify-center gap-2 pt-1">
      {chips.map((c) => <span key={c} className="px-3 py-1.5 rounded-full bg-ink-100 text-ink-600 text-[11px] font-bold">{c}</span>)}
    </section>
  );
}

/* ── Footer (rebranded — no "Box") ───────────────────────────────── */
function Footer() {
  return (
    <footer className="pt-4 border-t border-ink-100">
      <div className="flex items-center gap-2 text-lg font-black text-ink-900">
        <img src="/habi-logo-concept.png" alt="HABI" className="h-8 w-[92px] object-contain object-left" />
      </div>
      <p className="mt-2 text-xs text-ink-500">Your neighbor barangay's store, at your door.</p>
      <p className="mt-4 text-center text-[11px] text-ink-400">© {new Date().getFullYear()} HABI · Made for Philippine provinces.</p>
    </footer>
  );
}

/* ── HomepageV2 — assembles all slots ────────────────────────────── */
export default function HomepageV2({ user }) {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [flash, setFlash] = useState([]);
  const [mallProducts, setMallProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryImages, setCategoryImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const flashEndsAt = endOfToday();

  const go = (to) => navigate(to);

  useEffect(() => {
    Promise.all([
      client.get('/banners').then((r) => setBanners(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      client.get('/products', { params: { per_page: 6, on_sale: 1, sort: 'reviews' } }).then((r) => setFlash(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {}),
      client.get('/products', { params: { per_page: 6, official_mall: 1 } }).then((r) => setMallProducts(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {}),
      client.get('/products', { params: { per_page: 12 } }).then((r) => setProducts(Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => {}),
      // Category images: use the lightweight endpoint, fall back to client scan offline
      client.get('/products/category-images').then((r) => {
        const rows = Array.isArray(r.data) ? r.data : [];
        const imgMap = {};
        rows.forEach((c) => { if (c?.image_url && c?.category) imgMap[c.category] = c.image_url; });
        setCategoryImages(imgMap);
      }).catch(() => {
        client.get('/products', { params: { per_page: 100 } }).then((r) => {
          const all = Array.isArray(r.data?.data) ? r.data.data : [];
          const imgMap = {};
          all.forEach((p) => {
            if (p.image_url && p.category && !imgMap[p.category]) imgMap[p.category] = p.image_url;
          });
          setCategoryImages(imgMap);
        }).catch(() => {});
      }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>;

  return (
    <div className="space-y-5 pb-4">
      {/* Location + search */}
      <form
        onSubmit={(e) => { e.preventDefault(); go('/search?q=' + encodeURIComponent(query.trim())); }}
        className="flex items-center gap-2 p-2.5 bg-white border border-ink-200 rounded-2xl focus-within:ring-2 focus-within:ring-bayan-500"
      >
        <span className="text-ink-400 pl-1">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, stores, or opis…"
          className="flex-1 bg-transparent outline-none text-sm text-ink-800 placeholder:text-ink-400"
        />
        <button type="submit" className="px-4 py-1.5 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl transition">Search</button>
      </form>
      <div className="flex items-center gap-1.5 px-1 -mt-2 text-[11px] font-bold text-ink-500">
        <span>📍</span>
        <span>{user?.barangay ? `${user.barangay}, ${user.municipality || ''}` : 'Near your barangay'}</span>
      </div>

      <HeroCarousel banners={banners} onGo={go} />
      <PabiliHighlight onGo={go} />
      <DealBar flashEndsAt={flashEndsAt} onGo={go} />
      <CategoryRail categories={CATEGORIES} categoryImages={categoryImages} onGo={go} />
      <FlashGrid items={flash} flashEndsAt={flashEndsAt} onGo={go} />
      <MallShelf products={mallProducts} onGo={go} />
      <PromoBanners onGo={go} />
      <ProductGrid products={products} onGo={go} />
      <TrustStrip />
      <Footer />
    </div>
  );
}
