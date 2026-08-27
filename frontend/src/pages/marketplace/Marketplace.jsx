import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Spinner, EmptyState, useToast } from '../../components/ui.jsx';

const DEFAULT_COORDS = { lat: 13.6218, lng: 123.1948 }; // Naga default

export default function Marketplace({ user }) {
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state (local mirror + server)
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Checkout state
  const [fulfillment, setFulfillment] = useState('pickup');
  const [hubId, setHubId] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { per_page: 50 };
      if (category) params.category = category;
      if (search.trim()) params.q = search.trim();
      const res = await client.get('/products', { params });
      setProducts(res.data.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category, search]);

  useEffect(() => {
    client.get('/products/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    client
      .get('/cart')
      .then((res) => {
        setCart(
          res.data.items.map((i) => ({
            ...i.product,
            quantity: i.quantity,
            cart_item_id: i.id,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setCartLoaded(true));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          notify(`Only ${product.stock} in stock.`, 'error');
          return prev;
        }
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (productId, amount) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === productId) {
          const next = i.quantity + amount;
          if (next < 1) return i;
          if (next > i.stock) {
            notify(`Only ${i.stock} in stock.`, 'error');
            return i;
          }
          return { ...i, quantity: next };
        }
        return i;
      }),
    );
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.id !== productId));

  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await client.post('/cart/sync', {
        cart: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });

      const payload = {
        fulfillment_type: fulfillment,
        referral_code: referralCode.trim() || null,
      };
      if (fulfillment === 'pickup') {
        payload.hub_id = hubId;
      } else {
        payload.delivery_address = deliveryAddress;
        payload.latitude = coords.lat;
        payload.longitude = coords.lng;
      }

      const res = await client.post('/checkout', payload);
      setLastOrder(res.data.order);
      setCart([]);
      notify('Suki! Order placed.');
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Checkout failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Local Marketplace</h2>
        <p className="text-white/75 text-sm mt-1">Support neighborhood merchants with direct same-day delivery.</p>
      </div>

      {/* Success panel */}
      {lastOrder && (
        <div className="card p-4 border-green-200 bg-green-50">
          <p className="font-bold text-green-800">Order #{lastOrder.id} confirmed 🎉</p>
          <p className="text-sm text-green-700 mt-1">
            Total ₱{Number(lastOrder.total_amount + lastOrder.shipping_amount).toLocaleString()} ·{' '}
            {lastOrder.fulfillment_type === 'pickup' ? 'Click & collect' : 'Doorstep delivery'}
          </p>
        </div>
      )}

      {/* Search + category filter */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search local goods…"
          className="w-full p-3 rounded-2xl border border-ink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bayan-500"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('')}
            className={`chip border shrink-0 ${category === '' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? '' : c)}
              className={`chip border shrink-0 ${category === c ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Product grid */}
        <div className="md:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-52 bg-ink-200 rounded-2xl animate-pulse-soft" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="🛍️" title="No products yet" hint="Merchants are adding fresh local goods." />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} className="card p-3 flex flex-col justify-between">
                  <div>
                    <div className="h-28 rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center text-4xl mb-2">
                      🛒
                    </div>
                    <span className="inline-block bg-bayan-50 text-bayan-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-ink-800 text-sm leading-snug">{p.name}</h3>
                    <p className="text-xs text-ink-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-lg font-black text-ink-900">₱{Number(p.price).toLocaleString()}</span>
                      <span className="text-[10px] text-ink-400">Stock: {p.stock}</span>
                    </div>
                    {Number(p.suki_points_award) > 0 && (
                      <span className="block text-[10px] font-semibold text-bayan-600 mb-1">🪙 Earn +{p.suki_points_award} Suki</span>
                    )}
                    {Number(p.affiliate_percentage) > 0 && (
                      <span className="block text-[10px] font-bold text-orange-600 mb-2">🔗 Share & earn {p.affiliate_percentage}%</span>
                    )}
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl transition"
                    >
                      {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart + checkout panel */}
        <div className="card p-4 self-start md:sticky md:top-20">
          <h2 className="font-extrabold text-ink-800 border-b pb-2 mb-4 flex items-center justify-between">
            <span>🛒 My Cart</span>
            <span className="bg-bayan-100 text-bayan-700 text-xs px-2 py-0.5 rounded-full">{cartCount} items</span>
          </h2>

          {!cartLoaded ? (
            <Spinner className="mx-auto" />
          ) : cart.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-6">Your cart is empty. Start supporting local sellers!</p>
          ) : (
            <div>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2 text-sm">
                    <div className="flex-1 pr-2 min-w-0">
                      <h4 className="font-bold text-ink-800 line-clamp-1">{item.name}</h4>
                      <span className="text-xs text-ink-400">₱{Number(item.price).toLocaleString()} each</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-ink-100 hover:bg-ink-200 rounded font-bold text-xs">
                        −
                      </button>
                      <span className="font-semibold w-4 text-center text-xs">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-ink-100 hover:bg-ink-200 rounded font-bold text-xs">
                        +
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs font-bold hover:underline pl-2">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-4">
                <div className="flex justify-between font-black text-ink-800 text-lg">
                  <span>Subtotal</span>
                  <span>₱{cartTotal.toLocaleString()}</span>
                </div>

                {/* Referral */}
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">🎫 Referral code (optional)</label>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="e.g., NENA01"
                    className="w-full p-2 border border-ink-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-bayan-500"
                  />
                </div>

                {/* Fulfillment */}
                <div>
                  <span className="block text-xs font-semibold text-ink-500 mb-2">🚚 Fulfillment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFulfillment('pickup')}
                      className={`p-2 rounded-xl border text-xs font-bold ${fulfillment === 'pickup' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
                    >
                      📦 Click & collect (₱10)
                    </button>
                    <button
                      onClick={() => setFulfillment('delivery')}
                      className={`p-2 rounded-xl border text-xs font-bold ${fulfillment === 'delivery' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
                    >
                      🛵 Doorstep delivery
                    </button>
                  </div>

                  {fulfillment === 'pickup' ? (
                    <select
                      value={hubId}
                      onChange={(e) => setHubId(Number(e.target.value))}
                      className="w-full mt-2 p-2 border border-ink-200 rounded-lg text-xs bg-white"
                    >
                      <option value={1}>Nena San Jose Sari-Sari</option>
                    </select>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Delivery address"
                        className="w-full p-2 border border-ink-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-bayan-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={coords.lat}
                          onChange={(e) => setCoords({ ...coords, lat: Number(e.target.value) })}
                          placeholder="Latitude"
                          className="p-2 border border-ink-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-bayan-500"
                        />
                        <input
                          value={coords.lng}
                          onChange={(e) => setCoords({ ...coords, lng: Number(e.target.value) })}
                          placeholder="Longitude"
                          className="p-2 border border-ink-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-bayan-500"
                        />
                      </div>
                      <button
                        onClick={() =>
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            () => notify('Could not get location.', 'error'),
                          )
                        }
                        className="w-full py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg"
                      >
                        📍 Use my location
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition"
                >
                  {submitting ? 'Processing…' : 'Checkout via GCash/Maya'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}