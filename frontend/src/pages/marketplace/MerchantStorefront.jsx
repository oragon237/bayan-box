import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { useToast } from '../../components/ui.jsx';

const DEFAULT_BANNER = 'https://placehold.co/1200x300/673de6/ffffff?text=BayanBox+Store';
const DEFAULT_LOGO = 'https://placehold.co/200x200/673de6/ffffff?text=🛍️';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'about', label: 'About & Policies' },
  { value: 'reviews', label: 'Store Reviews' },
];

function SafeImg({ src, alt, className, fallback }) {
  const [err, setErr] = useState(false);
  return <img src={err || !src ? fallback : src} alt={alt} onError={() => setErr(true)} loading="lazy" className={className} />;
}

function SkeletonCard() {
  return (
    <div className="card p-3">
      <div className="w-full aspect-square rounded-xl bg-ink-200 animate-pulse-soft mb-2" />
      <div className="h-3 bg-ink-200 rounded animate-pulse-soft mb-1.5 w-3/4" />
      <div className="h-3 bg-ink-200 rounded animate-pulse-soft mb-2 w-1/2" />
      <div className="h-7 bg-ink-200 rounded-lg animate-pulse-soft" />
    </div>
  );
}

export default function MerchantStorefront({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [tab, setTab] = useState('products');
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search + filters
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStock, setInStock] = useState(false);

  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [following, setFollowing] = useState(() => localStorage.getItem('follow_'.$id) === '1');

  // Search suggestions
  const suggestions = store?.products?.data?.filter((p) => q && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5) || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    client.get(`/merchants/${id}/store`).then((res) => setStore(res.data)).catch(() => notify('Store not found.', 'error')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setPage(1);
    client.get(`/merchants/${id}/reviews`).then((res) => setReviews(res.data.data || [])).catch(() => {});
  }, [id]);

  const loadProducts = async (reset = true) => {
    if (!id) return;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = { per_page: 20, page: reset ? 1 : page };
      if (debouncedQ.trim()) params.q = debouncedQ.trim();
      if (category) params.category = category;
      if (sort) params.sort = sort;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (inStock) params.in_stock = 1;
      const res = await client.get(`/merchants/${id}/store`, { params });
      setProducts((prev) => (reset ? res.data.products.data : [...prev, ...res.data.products.data]));
      setHasMore(res.data.products.current_page < res.data.products.last_page);
      setStore((prev) => ({ ...prev, products: res.data.products }));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProducts(true);
  }, [debouncedQ, category, sort, minPrice, maxPrice, minRating, inStock, id]);

  useEffect(() => {
    if (page > 1) loadProducts(false);
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400 && hasMore && !loadingMore) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingMore]);

  const toggleFollow = () => {
    const next = !following;
    setFollowing(next);
    localStorage.setItem('follow_'.$id, next ? '1' : '0');
    notify(next ? 'Store followed.' : 'Unfollowed.');
  };

  const addToCart = (p) => {
    if (!user) { notify('Please log in.', 'info'); navigate('/login'); return; }
    client.post('/cart/sync', { cart: [{ product_id: p.id, quantity: 1 }] }).catch(() => {});
    notify('Added to cart.', 'success');
  };

  const resetFilters = () => {
    setQ(''); setCategory(''); setSort(''); setMinPrice(''); setMaxPrice(''); setMinRating(''); setInStock(false);
  };

  const hasActiveFilters = q || category || sort || minPrice || maxPrice || minRating || inStock;

  if (loading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto">
        <div className="h-40 rounded-3xl bg-ink-200 animate-pulse-soft" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!store) return <div className="text-center text-ink-400 py-16">Store not found.</div>;

  const { merchant, stats, categories } = store;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="relative h-36 sm:h-44 bg-gradient-to-br from-bayan-700 to-bayan-500">
          <SafeImg src={merchant.banner_url} alt="banner" fallback={DEFAULT_BANNER} className="w-full h-full object-cover" />
          {merchant.is_official_mall && (
            <span className="absolute top-3 left-3 bg-bayan-600 text-white text-[11px] font-black px-2 py-1 rounded-full">BeCoolBox Official</span>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 relative">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-card shrink-0">
              <SafeImg src={merchant.logo_url} alt="logo" fallback={DEFAULT_LOGO} className="w-full h-full rounded-xl object-cover" />
            </div>
            <div className="flex-1 sm:pb-1">
              <h1 className="text-2xl font-black text-ink-900 flex items-center gap-2">
                {merchant.name}
                {merchant.verified && <span className="chip border bg-green-50 text-green-700 border-green-200">✓ Verified</span>}
              </h1>
              <p className="text-sm text-ink-400">{merchant.barangay ? `${merchant.barangay}, ` : ''}{merchant.municipality || ''}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-amber-500">★ {stats.rating}</span>
                <span className="text-xs text-ink-400">({stats.review_count} reviews)</span>
                <span className="text-xs text-ink-400">· {stats.product_count} products</span>
              </div>
            </div>
            <div className="flex gap-2 sm:pb-1">
              <button onClick={toggleFollow} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${following ? 'bg-bayan-100 text-bayan-700 border border-bayan-200' : 'bg-bayan-600 hover:bg-bayan-700 text-white'}`}>
                {following ? '✓ Following' : 'Follow Store'}
              </button>
              <button onClick={() => notify('Contact merchant coming soon.', 'info')} className="px-4 py-2 rounded-xl text-sm font-bold bg-ink-100 hover:bg-ink-200 text-ink-700 transition">
                💬 Contact
              </button>
            </div>
          </div>

          {/* Store stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-ink-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-ink-800">{stats.rating}★</p><p className="text-[10px] text-ink-400 uppercase">Overall rating</p></div>
            <div className="bg-ink-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-ink-800">{stats.units_sold}</p><p className="text-[10px] text-ink-400 uppercase">Units sold</p></div>
            <div className="bg-ink-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-ink-800">{stats.response_time}</p><p className="text-[10px] text-ink-400 uppercase">Response time</p></div>
            <div className="bg-ink-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-ink-800">{stats.fulfillment_rate}%</p><p className="text-[10px] text-ink-400 uppercase">Fulfillment rate</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={`chip border shrink-0 ${tab === t.value ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Filters sidebar */}
          <aside className="card p-4 h-fit lg:sticky lg:top-20 space-y-3">
            <h3 className="font-bold text-ink-800">Filters</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Price range</label>
              <div className="flex gap-2">
                <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min ₱" aria-label="Minimum price" className="field" />
                <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max ₱" aria-label="Maximum price" className="field" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Minimum rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating" className="field bg-white">
                <option value="">Any rating</option>
                <option value="4">4★ & up</option>
                <option value="3">3★ & up</option>
                <option value="2">2★ & up</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} aria-label="In stock only" className="w-4 h-4 text-bayan-600" />
              <span className="text-xs font-bold text-ink-700">In stock only</span>
            </label>
          </aside>

          {/* Catalog */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search + category tabs */}
            <div className="space-y-3">
              <div className="relative">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in this store…" aria-label="Search in store" className="field pr-9" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
                {q && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-ink-100 shadow-card overflow-hidden">
                    {suggestions.map((s) => (
                      <button key={s.id} onClick={() => { setQ(s.name); }} className="w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">🔍 {s.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => { setSort(''); setCategory(''); }} className={`chip border shrink-0 ${!category && !sort ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>All Products</button>
                <button onClick={() => { setSort('best_sellers'); setCategory(''); }} className={`chip border shrink-0 ${sort === 'best_sellers' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>Best Sellers</button>
                <button onClick={() => { setSort('newest'); setCategory(''); }} className={`chip border shrink-0 ${sort === 'newest' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>New Arrivals</button>
                <button onClick={() => { setSort('on_sale'); setCategory(''); }} className={`chip border shrink-0 ${sort === 'on_sale' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>On Sale</button>
                {categories.map((c) => (
                  <button key={c} onClick={() => { setCategory(c === category ? '' : c); setSort(''); }} className={`chip border shrink-0 ${category === c ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}</div>
            ) : products.length === 0 ? (
              <div className="card p-10 text-center space-y-3">
                <p className="text-4xl">🔍</p>
                <p className="font-bold text-ink-800">No products found</p>
                <p className="text-sm text-ink-400">Try adjusting your search or filters.</p>
                {hasActiveFilters && <button onClick={resetFilters} className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">Reset filters</button>}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="card p-3 flex flex-col justify-between h-full">
                      <div>
                        <button onClick={() => navigate(`/product/${p.id}`)} className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden block">
                          <SafeImg src={p.image_url || p.images?.[0]?.image_url} alt={p.name} fallback="https://placehold.co/400x400/e0e0e3/55555c?text=📦" className="w-full h-full object-cover" />
                          {p.sale_price && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">SALE</span>}
                        </button>
                        <button onClick={() => navigate(`/product/${p.id}`)} className="block w-full text-left mt-2">
                          <h3 className="font-bold text-ink-800 text-sm leading-snug line-clamp-2 hover:text-bayan-700 transition">{p.name}</h3>
                        </button>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-xs font-bold text-ink-700">{Number(p.reviews_avg_rating || 0).toFixed(1)}</span>
                          <span className="text-[10px] text-ink-400">({p.reviews_count || 0}) · {p.units_sold || 0} sold</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-baseline gap-1.5 mb-2">
                          {p.sale_price ? (
                            <>
                              <span className="text-xs text-ink-400 line-through">₱{Number(p.price).toLocaleString()}</span>
                              <span className="text-base font-black text-red-600">₱{Number(p.sale_price).toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="text-base font-black text-ink-900">₱{Number(p.price).toLocaleString()}</span>
                          )}
                        </div>
                        <button onClick={() => addToCart(p)} className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl" disabled={p.stock <= 0}>
                          {p.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    {loadingMore ? <span className="w-7 h-7 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin" /> : <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl">Load More</button>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card p-5 space-y-4 max-w-3xl">
          <h3 className="text-xl font-black text-ink-800">About {merchant.name}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-ink-50 rounded-xl p-3"><p className="text-[10px] text-ink-400 uppercase font-bold">Store location</p><p className="font-bold text-ink-800 mt-0.5">{merchant.barangay ? `${merchant.barangay}, ` : ''}{merchant.municipality || '—'}</p></div>
            <div className="bg-ink-50 rounded-xl p-3"><p className="text-[10px] text-ink-400 uppercase font-bold">Joined</p><p className="font-bold text-ink-800 mt-0.5">{new Date(merchant.joined_at).toLocaleDateString()}</p></div>
          </div>
          <div>
            <h4 className="font-bold text-ink-800 mb-1">Shipping methods</h4>
            <p className="text-sm text-ink-500">Click & collect at the hub (₱10) or doorstep delivery with dynamic per-km fees (₱40 for the first 2 km, then ₱10/km).</p>
          </div>
          <div>
            <h4 className="font-bold text-ink-800 mb-1">Return policy</h4>
            <p className="text-sm text-ink-500">Damaged or incorrect items can be reported within 48 hours of delivery. Approved refunds are processed back to the original payment method.</p>
          </div>
          <div>
            <h4 className="font-bold text-ink-800 mb-1">Seller background</h4>
            <p className="text-sm text-ink-500">{merchant.verified ? 'This is a verified merchant on BayanBox, serving the local community.' : 'This merchant is pending verification.'}</p>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3 max-w-3xl">
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1">Store reviews ({stats.review_count})</h3>
          {reviews.length === 0 ? (
            <div className="card p-6 text-center"><p className="text-ink-400 text-sm">No reviews yet for this store.</p></div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-ink-800 text-sm">{r.user?.name || 'Customer'}</p>
                  <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(r.rating || 0))}</span>
                </div>
                <p className="text-xs text-ink-400 mb-1">on {r.product?.name}</p>
                {r.review && <p className="text-sm text-ink-600">{r.review}</p>}
                <p className="text-[11px] text-ink-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}