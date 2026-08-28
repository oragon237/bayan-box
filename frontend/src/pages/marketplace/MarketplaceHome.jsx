import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner } from '../../components/ui.jsx';

const CATEGORIES = [
  { label: 'Fresh Produce', icon: '🥬', color: 'from-green-400 to-green-600' },
  { label: 'Home Cooks', icon: '🍳', color: 'from-orange-400 to-orange-600' },
  { label: 'Local Crafts', icon: '🧶', color: 'from-purple-400 to-purple-600' },
  { label: 'Packaging', icon: '📦', color: 'from-blue-400 to-blue-600' },
  { label: 'Provincial Goods', icon: '🏝️', color: 'from-teal-400 to-teal-600' },
  { label: 'Points Shop', icon: '🪙', color: 'from-amber-400 to-amber-600' },
];

export default function MarketplaceHome({ user }) {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [onSale, setOnSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const saleScroller = useRef(null);

  const scrollBy = (dir) => {
    saleScroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  useEffect(() => {
    Promise.all([
      client.get('/banners').then((r) => setBanners(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      client.get('/products', { params: { per_page: 8, on_sale: 1, sort: 'reviews' } }).then((r) => setOnSale(Array.isArray(r.data.data) ? r.data.data : [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>;

  return (
    <div className="space-y-5">
      {/* Banners */}
      {banners.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden max-w-full">
          <button onClick={() => navigate(banners[bannerIdx].link_url || '/')} className="w-full block">
            <img src={banners[bannerIdx].image_url} alt={banners[bannerIdx].title} className="w-full h-36 sm:h-48 object-cover rounded-2xl" />
          </button>
          {banners.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} className={`w-2.5 h-2.5 rounded-full ${i === bannerIdx ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search bar */}
      <button onClick={() => navigate('/search')} className="w-full p-3.5 bg-ink-50 border border-ink-200 rounded-2xl text-left text-sm text-ink-400 transition hover:bg-ink-100">
        🔍 Search products, stores, or descriptions…
      </button>

      {/* Category grid */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Shop by Category</h3>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <button key={c.label} onClick={() => navigate(`/search?category=${encodeURIComponent(c.label)}`)} className="card p-3 text-center hover:shadow-lift transition">
              <span className="text-3xl block mb-1">{c.icon}</span>
              <span className="text-xs font-bold text-ink-700">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* On Sale carousel */}
      {onSale.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">🔥 On Sale Deals</h3>
            <div className="flex gap-1.5">
              <button onClick={() => scrollBy(-1)} className="w-8 h-8 rounded-full bg-white border border-ink-200 flex items-center justify-center text-sm font-bold text-ink-600 hover:bg-ink-50 shadow-sm transition">‹</button>
              <button onClick={() => scrollBy(1)} className="w-8 h-8 rounded-full bg-white border border-ink-200 flex items-center justify-center text-sm font-bold text-ink-600 hover:bg-ink-50 shadow-sm transition">›</button>
            </div>
          </div>
          <div ref={saleScroller} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2 -mx-4 px-4">
            {onSale.map((p) => {
              const pct = p.sale_price ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
              return (
                <button key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="card p-2.5 w-52 shrink-0 snap-start text-left">
                  <div className="relative w-full h-28 rounded-lg bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden mb-2">
                    <img
                      src={p.image_url || 'https://placehold.co/400x400/e0e0e3/55555c?text=📦'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x400/e0e0e3/55555c?text=📦'; }}
                    />
                    {pct > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">-{pct}% OFF</span>
                    )}
                  </div>
                  <h4 className="font-bold text-ink-800 text-sm leading-snug line-clamp-1">{p.name}</h4>
                  {p.reviews_count > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(Number(p.reviews_avg_rating || 0) || 4))}</span>
                      <span className="text-[10px] text-ink-400">({p.reviews_count})</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-xs text-ink-400 line-through">₱{Number(p.price).toLocaleString()}</span>
                    <span className="text-base font-black text-red-600">₱{Number(p.sale_price).toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/points-shop')} className="card p-4 text-center bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <span className="text-2xl">🪙</span>
          <p className="font-bold text-amber-800 text-sm mt-1">Points Shop</p>
          <p className="text-[10px] text-amber-600">Redeem with Suki Points</p>
        </button>
        <button onClick={() => navigate('/providers')} className="card p-4 text-center bg-gradient-to-br from-bayan-50 to-bayan-100 border-bayan-200">
          <span className="text-2xl">🧑‍🔧</span>
          <p className="font-bold text-bayan-800 text-sm mt-1">Skilled Workers</p>
          <p className="text-[10px] text-bayan-600">Hire local providers</p>
        </button>
      </div>
    </div>
  );
}