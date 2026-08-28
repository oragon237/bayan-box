import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function Marketplace({ user }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [onSale, setOnSale] = useState(searchParams.get('on_sale') === '1');
  const [sort, setSort] = useState('');
  const [city, setCity] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Infinite scroll pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PER_PAGE = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), 300);
    return () => clearTimeout(t);
  }, [city]);

  const loadProducts = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setLoadError('');
    } else {
      setLoadingMore(true);
    }
    try {
      const params = { per_page: PER_PAGE, page: reset ? 1 : page };
      if (category) params.category = category;
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
      if (onSale) params.on_sale = 1;
      if (sort) params.sort = sort;
      if (debouncedCity.trim()) params.city = debouncedCity.trim();
      const res = await client.get('/products', { params });
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setProducts((prev) => (reset ? list : [...prev, ...list]));
      // Featured campaigns from homepage_featured ads
      if (reset && res.data.featured_campaigns) {
        setFeaturedProducts(res.data.featured_campaigns.map((f) => ({ ...f.product, campaign_id: f.id })));
      }
      setHasMore(res.data.current_page < res.data.last_page);
      if (reset && list.length === 0) setLoadError('No products currently available.');
    } catch (err) {
      setLoadError(err.response?.status === 401 ? 'Session expired. Please log in again.' : 'Could not load products. Check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadProducts(true);
  }, [category, debouncedSearch, onSale, sort, debouncedCity]);

  useEffect(() => {
    if (page > 1) loadProducts(false);
  }, [page]);

  // Load next batch on scroll near bottom
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && hasMore && !loadingMore) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingMore]);

  useEffect(() => {
    client.get('/products/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    client.get('/banners').then((res) => setBanners(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  // Track impressions for sponsored products when the page loads
  useEffect(() => {
    products.filter((p) => p.ad_campaign_id).forEach((p) => {
      client.post(`/ads/${p.ad_campaign_id}/impression`).catch(() => {});
    });
  }, [products]);

  const addToCart = (product) => {
    if (!user) {
      notify('Please log in to add items to your cart.', 'info');
      navigate('/login');
      return;
    }
    client.post('/cart/sync', { cart: [{ product_id: product.id, quantity: 1 }] }).catch(() => {});
    notify('Added to cart.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight">Local Marketplace</h2>
            <p className="text-white/75 text-sm mt-1">Support neighborhood merchants with direct same-day delivery.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate('/points-shop')} className="px-3 py-2 bg-amber-500/90 hover:bg-amber-600 text-white text-xs font-bold rounded-xl border border-amber-400 transition">🪙 Points Shop</button>
            <button onClick={() => navigate('/providers')} className="px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl border border-white/20 transition">🧑‍🔧 Skilled Workers</button>
          </div>
        </div>
      </div>

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

      {/* Featured ad campaigns */}
      {featuredProducts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Featured Products</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {featuredProducts.map((f) => (
              <button key={f.campaign_id} onClick={() => { client.post(`/ads/${f.campaign_id}/click`).catch(() => {}); navigate(`/product/${f.product_id}`); }} className="card p-2 w-40 shrink-0 text-left transition hover:shadow-lift">
                <img src={f.image_url || 'https://placehold.co/400x400/673de6/ffffff?text=📦'} alt={f.name} className="w-full h-24 rounded-lg object-cover mb-1.5" />
                <h4 className="font-bold text-ink-800 text-xs line-clamp-1">{f.name}</h4>
                <p className="text-sm font-black text-ink-900 mt-0.5">₱{Number(f.price).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, stores, or descriptions…" className="field" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / municipality…" className="field" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="field bg-white">
            <option value="">Newest</option>
            <option value="reviews">Most Reviewed</option>
            <option value="sales">Top Sales</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-ink-200 cursor-pointer">
            <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} className="w-4 h-4 text-bayan-600 rounded border-ink-300" />
            <span className="text-xs font-bold text-ink-700">On Sale</span>
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCategory('')} className={`chip border shrink-0 ${category === '' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>All</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(category === c ? '' : c)} className={`chip border shrink-0 ${category === c ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Product grid — full width */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-52 bg-ink-200 rounded-2xl animate-pulse-soft" />)
        ) : loadError && products.length === 0 ? (
          <div className="col-span-full card p-6 text-center">
            <p className="text-ink-400 text-sm">{loadError}</p>
            <button onClick={loadProducts} className="mt-3 px-4 py-2 bg-bayan-600 text-white text-xs font-bold rounded-xl">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full"><EmptyState icon="🛍️" title="No products" hint="Try adjusting your filters." /></div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="card p-3 flex flex-col justify-between">
              <div>
                <button onClick={() => navigate(`/product/${p.id}`)} className="w-full h-28 rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center text-4xl mb-2 overflow-hidden transition hover:scale-[1.02]">
                  {p.image_url || (p.images && p.images[0]?.image_url) ? <img src={p.image_url || p.images[0].image_url} alt={p.name} className="w-full h-full object-cover" /> : <span>🛒</span>}
                </button>
                <span className="inline-block bg-bayan-50 text-bayan-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{p.category}</span>
                {p.is_official_mall && <span className="inline-block bg-bayan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ml-1">BeCoolBox Official</span>}
                {p.is_sponsored && <span className="inline-block bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ml-1">Sponsored</span>}
                <button
                  onClick={() => {
                    if (p.ad_campaign_id) client.post(`/ads/${p.ad_campaign_id}/click`).catch(() => {});
                    navigate(`/product/${p.id}`);
                  }}
                  className="block text-left w-full"
                >
                  <h3 className="font-bold text-ink-800 text-sm leading-snug hover:text-bayan-700 transition">{p.name}</h3>
                </button>
                {p.reviews_count > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(Number(p.reviews_avg_rating || 0)))}</span>
                    <span className="text-[10px] text-ink-400">({p.reviews_count})</span>
                  </div>
                )}
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">{p.description}</p>
              </div>
              <div className="mt-3">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    {p.sale_price ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-ink-400 line-through">₱{Number(p.price).toLocaleString()}</span>
                        <span className="text-lg font-black text-ink-900">₱{Number(p.sale_price).toLocaleString()}</span>
                        <span className="text-[9px] font-black text-white bg-red-500 px-1 py-0.5 rounded-full">SALE</span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-ink-900">₱{Number(p.price).toLocaleString()}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-ink-400">Stock: {p.stock}</span>
                </div>
                {Number(p.suki_points_award) > 0 && <span className="block text-[10px] font-semibold text-bayan-600 mb-1">🪙 Earn +{p.suki_points_award} Suki</span>}
                {Number(p.affiliate_percentage) > 0 && <span className="block text-[10px] font-bold text-orange-600 mb-2">🔗 Share & earn {p.affiliate_percentage}%</span>}
                <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl transition">
                  {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more / infinite scroll fallback */}
      {!loading && !loadError && products.length > 0 && hasMore && (
        <div className="flex justify-center pt-2">
          {loadingMore ? (
            <span className="w-7 h-7 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl transition">
              Load More Products
            </button>
          )}
        </div>
      )}
    </div>
  );
}