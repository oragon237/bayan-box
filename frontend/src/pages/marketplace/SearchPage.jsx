import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const RECENT = JSON.parse(localStorage.getItem('bayanbox_recent_searches') || '[]');
const TRENDING = ['Fresh Produce', 'Packaging', 'On Sale', 'Abaca', 'Bicol'];

function SafeImg({ src, alt, className }) {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? 'https://placehold.co/600x600/e0e0e3/55555c?text=📦' : src || 'https://placehold.co/600x600/e0e0e3/55555c?text=📦'}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      loading="lazy"
    />
  );
}

function AdCard({ campaignId, product, user, notify, navigate, horizontal = false }) {
  useEffect(() => { client.post(`/ads/${campaignId}/impression`).catch(() => {}); }, [campaignId]);
  const click = () => { client.post(`/ads/${campaignId}/click`).catch(() => {}); navigate(`/product/${product.id}`); };

  // Horizontal = compact card for the "Sponsored Items" top row
  if (horizontal) {
    return (
      <div className="card p-2 w-36 shrink-0 text-left border border-purple-200/60">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-ink-50 mb-1.5">
          <button onClick={click} className="w-full h-full"><SafeImg src={product.image_url} alt={product.name} className="w-full h-full object-cover" /></button>
          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] font-semibold bg-purple-600 text-white rounded-md shadow">Sponsored</span>
        </div>
        <h4 className="font-bold text-ink-800 text-xs line-clamp-1">{product.name}</h4>
        <p className="text-sm font-black text-ink-900 mt-0.5">₱{Number(product.price).toLocaleString()}</p>
      </div>
    );
  }

  // Full grid card — matches regular product cards
  return (
    <div className="card p-3 flex flex-col justify-between h-full border border-purple-200/60">
      <div>
        <div className="relative aspect-square w-full rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden mb-2">
          <button onClick={click} className="w-full h-full"><SafeImg src={product.image_url} alt={product.name} className="w-full h-full object-cover" /></button>
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white rounded-md shadow">Sponsored</span>
        </div>
        <span className="inline-block bg-bayan-50 text-bayan-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{product.category || 'General'}</span>
        <button onClick={click} className="block text-left w-full">
          <h3 className="font-bold text-ink-800 text-sm leading-snug hover:text-bayan-700 transition line-clamp-2">{product.name}</h3>
        </button>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(Number(product.reviews_avg_rating || 0) || 4))}</span>
          <span className="text-[10px] text-ink-400">({product.reviews_count || 0})</span>
          <span className="text-[10px] text-ink-400 ml-auto">{product.stock} in stock</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5 mb-2">
          {product.sale_price ? (
            <>
              <span className="text-[10px] text-ink-400 line-through">₱{Number(product.price).toLocaleString()}</span>
              <span className="text-lg font-black text-red-600">₱{Number(product.sale_price).toLocaleString()}</span>
            </>
          ) : (
            <span className="text-lg font-black text-ink-900">₱{Number(product.price).toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={() => { if (!user) { notify('Please log in.', 'info'); navigate('/login'); return; } client.post('/cart/sync', { cart: [{ product_id: product.id, quantity: 1 }] }).catch(() => {}); notify('Added to cart.', 'success'); }}
          disabled={Number(product.stock) <= 0}
          className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl"
        >
          {Number(product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

export default function SearchPage({ user }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [categories, setCategories] = useState([]);
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onSaleOnly, setOnSaleOnly] = useState(searchParams.get('on_sale') === '1');
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState('relevance');

  const [products, setProducts] = useState([]);
  const [sponsoredItems, setSponsoredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PER_PAGE = 20;

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    client.get('/products/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const load = async (reset = true) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = { per_page: PER_PAGE, page: reset ? 1 : page };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (category) params.category = category;
      if (city.trim()) params.city = city.trim();
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (onSaleOnly) params.on_sale = 1;
      if (sort !== 'relevance') params.sort = sort;
      const res = await client.get('/products', { params });
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setProducts((prev) => (reset ? list : [...prev, ...list]));
      if (reset) {
        setSponsoredItems(res.data.sponsored_items || []);
      }
      setHasMore(res.data.current_page < res.data.last_page);
    } catch {
      setProducts((prev) => (reset ? [] : prev));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { setPage(1); load(true); }, [debouncedQuery, category, city, minPrice, maxPrice, onSaleOnly, sort]);
  useEffect(() => { if (page > 1) load(false); }, [page]);

  const saveRecent = (q) => {
    if (!q.trim()) return;
    const next = [q, ...RECENT.filter((r) => r !== q)].slice(0, 5);
    localStorage.setItem('bayanbox_recent_searches', JSON.stringify(next));
  };

  const trackClick = (id) => client.post(`/ads/${id}/click`).catch(() => {});

  const renderProduct = (p, isAd = false) => (
    <div key={`${isAd ? 'ad' : 'org'}-${p.id}`} className={`card p-3 flex flex-col justify-between ${isAd ? 'border border-purple-200/60' : ''}`}>
      <div>
        <div className="relative w-full h-28 rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-4xl mb-2">
          <button onClick={() => { if (p.ad_campaign_id) trackClick(p.ad_campaign_id); navigate(`/product/${p.id}`); }} className="w-full h-full flex items-center justify-center">
            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : '🛒'}
          </button>
          {(p.is_sponsored || isAd) && <span className="absolute top-1 left-1 text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">Sponsored</span>}
        </div>
        <span className="inline-block bg-bayan-50 text-bayan-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{p.category}</span>
        <button onClick={() => navigate(`/product/${p.id}`)} className="block text-left w-full">
          <h3 className="font-bold text-ink-800 text-sm leading-snug hover:text-bayan-700 transition">{p.name}</h3>
        </button>
        {p.merchant?.id && (
          <button onClick={() => navigate(`/store/${p.merchant.id}`)} className="text-[10px] font-semibold text-bayan-700 hover:underline mt-0.5">
            🏪 {p.merchant.name}
          </button>
        )}
        {p.reviews_count > 0 && <div className="flex items-center gap-1 mt-0.5"><span className="text-amber-400 text-xs">{'★'.repeat(Math.round(Number(p.reviews_avg_rating || 0)))}</span><span className="text-[10px] text-ink-400">({p.reviews_count})</span></div>}
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-baseline mb-2">
          <div>{p.sale_price ? <div className="flex items-baseline gap-1.5"><span className="text-[10px] text-ink-400 line-through">₱{Number(p.price).toLocaleString()}</span><span className="text-lg font-black text-red-600">₱{Number(p.sale_price).toLocaleString()}</span></div> : <span className="text-lg font-black text-ink-900">₱{Number(p.price).toLocaleString()}</span>}</div>
          <span className="text-[10px] text-ink-400">{p.stock} in stock</span>
        </div>
        <button onClick={() => { if (!user) { notify('Please log in.', 'info'); navigate('/login'); return; } client.post('/cart/sync', { cart: [{ product_id: p.id, quantity: 1 }] }).catch(() => {}); notify('Added to cart.', 'success'); }} disabled={p.stock <= 0} className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl">
          {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Sticky search bar */}
      <div className="sticky top-[88px] z-30 bg-ink-100/95 backdrop-blur -mx-4 px-4 py-2">
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(query); }} placeholder="Search products, stores, or descriptions…" className="field" />
      </div>

      {/* Empty state: suggestions */}
      {!debouncedQuery && !category && (
        <div className="space-y-4">
          {RECENT.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {RECENT.map((r) => <button key={r} onClick={() => setQuery(r)} className="chip border bg-white text-ink-600 border-ink-200">🕐 {r}</button>)}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Trending</h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => <button key={t} onClick={() => setQuery(t)} className="chip border bg-bayan-50 text-bayan-700 border-bayan-200">🔥 {t}</button>)}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => <button key={c} onClick={() => setCategory(c)} className="chip border bg-white text-ink-600 border-ink-200">{c}</button>)}
            </div>
          </div>
        </div>
      )}

      {/* Filters + sort */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field bg-white col-span-2 sm:col-span-1"><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="field" />
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min ₱" className="field" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max ₱" className="field" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field bg-white"><option value="relevance">Relevance</option><option value="reviews">Most Reviewed</option><option value="sales">Top Sales</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option></select>
      </div>
      <div className="flex gap-4 text-xs font-bold text-ink-600">
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} className="w-4 h-4 text-bayan-600" /> On Sale Only</label>
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-4 h-4 text-bayan-600" /> In Stock</label>
      </div>

      {/* Sponsored row */}
      {sponsoredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">⭐ Sponsored Items</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {sponsoredItems.map((s) => (
              <AdCard key={s.campaign_id} campaignId={s.campaign_id} product={s.product} user={user} notify={notify} navigate={navigate} horizontal />
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-52 bg-ink-200 rounded-2xl animate-pulse-soft" />)
        ) : products.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon="🔍" title="No products found" hint="Try a different search, or browse a category." />
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {categories.slice(0, 5).map((c) => <button key={c} onClick={() => setCategory(c)} className="chip border bg-white text-ink-600 border-ink-200">{c}</button>)}
            </div>
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="h-full">
              {renderProduct(p, !!p.is_sponsored)}
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {!loading && products.length > 0 && hasMore && (
        <div className="flex justify-center pt-2">
          {loadingMore ? <span className="w-7 h-7 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin" /> : <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl">Load More Products</button>}
        </div>
      )}
    </div>
  );
}