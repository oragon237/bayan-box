import { useEffect, useState } from 'react';
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
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">🔥 On Sale Deals</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {onSale.map((p) => (
              <button key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="card p-2 w-36 shrink-0 text-left">
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-2xl mb-1.5">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : '🛒'}
                </div>
                <h4 className="font-bold text-ink-800 text-xs line-clamp-1">{p.name}</h4>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[10px] text-ink-400 line-through">₱{Number(p.price).toLocaleString()}</span>
                  <span className="text-sm font-black text-red-600">₱{Number(p.sale_price).toLocaleString()}</span>
                </div>
              </button>
            ))}
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