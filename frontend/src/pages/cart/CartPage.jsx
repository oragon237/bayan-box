import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import { calculateDeliveryFee, fetchDrivingDistance, formatFeeSummary } from '../../lib/distance.js';
import { EmptyState, Spinner, useToast } from '../../components/ui.jsx';

const DEFAULT_COORDS = { lat: 13.6218, lng: 123.1948 }; // Naga default (hub origin)

export default function CartPage({ user }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [fulfillment, setFulfillment] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [hubId, setHubId] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [useAffiliateBalance, setUseAffiliateBalance] = useState(false);
  const [affiliateBalance, setAffiliateBalance] = useState(0);

  // Delivery estimate
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);

  useEffect(() => {
    if (!user) {
      setCartLoaded(true);
      return;
    }
    client.get('/cart')
      .then((res) => setCart(res.data.items.map((i) => ({ ...i.product, quantity: i.quantity }))))
      .catch(() => {})
      .finally(() => setCartLoaded(true));
  }, [user]);

  // Auto-sync cart changes (persist across sessions)
  const syncTimer = useRef(null);
  useEffect(() => {
    if (!user || !cartLoaded) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      client.post('/cart/sync', { cart: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })) }).catch(() => {});
    }, 800);
    return () => clearTimeout(syncTimer.current);
  }, [cart, cartLoaded, user]);

  useEffect(() => {
    if (!user) return;
    client.get('/affiliate/earnings').then((res) => setAffiliateBalance(Number(res.data.balance || 0))).catch(() => {});
  }, [user]);

  // Fetch driving distance + fee when delivery coords are set (hub origin → customer)
  useEffect(() => {
    if (fulfillment !== 'delivery' || !coords.lat || !coords.lng) {
      setDeliveryEstimate(null);
      return;
    }
    let cancelled = false;
    const origin = [DEFAULT_COORDS.lng, DEFAULT_COORDS.lat]; // hub
    const destination = [coords.lng, coords.lat];
    fetchDrivingDistance(origin, destination).then((route) => {
      if (cancelled) return;
      setRouteGeometry(route.geometry);
      setDeliveryEstimate({
        distanceKm: route.distanceKm,
        durationMins: route.durationMins,
        fee: calculateDeliveryFee(route.distanceKm),
      });
    });
    return () => { cancelled = true; };
  }, [fulfillment, coords.lat, coords.lng]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { notify(`Only ${product.stock} in stock.`, 'error'); return prev; }
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (productId, amount) => {
    setCart((prev) => prev.map((i) => {
      if (i.id === productId) {
        const next = i.quantity + amount;
        if (next < 1) return i;
        if (next > i.stock) { notify(`Only ${i.stock} in stock.`, 'error'); return i; }
        return { ...i, quantity: next };
      }
      return i;
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
    client.delete(`/cart/items/${productId}`).catch(() => {});
  };

  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const pointsTotal = cart.filter((i) => i.points_only).reduce((s, i) => s + Number(i.points_price || 0) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await client.post('/cart/sync', { cart: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })) });
      const payload = { fulfillment_type: fulfillment, payment_method: paymentMethod, referral_code: referralCode.trim() || null, use_affiliate_balance: useAffiliateBalance };
      if (fulfillment === 'pickup') payload.hub_id = hubId;
      else { payload.delivery_address = deliveryAddress; payload.latitude = coords.lat; payload.longitude = coords.lng; }
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
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Cart</h2>
        <p className="text-white/75 text-sm mt-1">{cartCount} item(s) · review your order below.</p>
      </div>

      {lastOrder && (
        <div className="card p-4 border-green-200 bg-green-50">
          <p className="font-bold text-green-800">Order #{lastOrder.id} confirmed 🎉</p>
          <p className="text-sm text-green-700 mt-1">Total ₱{(Number(lastOrder.total_amount) + Number(lastOrder.shipping_amount)).toLocaleString()} · {lastOrder.fulfillment_type === 'pickup' ? 'Click & collect' : 'Doorstep delivery'}</p>
        </div>
      )}

      {!user ? (
        <div className="card p-6 text-center space-y-3">
          <p className="text-ink-400 text-sm">Log in to view your cart and checkout.</p>
          <button onClick={() => navigate('/login')} className="px-5 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">Login / Signup</button>
        </div>
      ) : !cartLoaded ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : cart.length === 0 ? (
        <EmptyState icon="🛒" title="Your cart is empty" hint="Browse the marketplace to add items." />
      ) : (
        <>
          {/* Cart items */}
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="card p-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : '🛒'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-ink-800 text-sm line-clamp-1">{item.name}</h4>
                  <span className="text-xs text-ink-400">{item.points_only ? `🪙 ${item.points_price} pts each` : `₱${Number(item.price).toLocaleString()} each`}</span>
                  {item.sale_price && <span className="text-[10px] text-red-500 ml-1">→ ₱{Number(item.sale_price).toLocaleString()}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-ink-100 hover:bg-ink-200 rounded font-bold text-sm">−</button>
                  <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-ink-100 hover:bg-ink-200 rounded font-bold text-sm">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="card p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span className="font-bold">₱{cartTotal.toLocaleString()}</span></div>
            {pointsTotal > 0 && <div className="flex justify-between text-sm"><span className="text-ink-500">Points items</span><span className="font-bold text-amber-600">🪙 {pointsTotal}</span></div>}
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">{fulfillment === 'pickup' ? 'Click & collect fee' : 'Delivery fee'}</span>
              <span className="font-bold">
                {fulfillment === 'pickup' ? '₱10' : deliveryEstimate ? `₱${deliveryEstimate.fee}` : 'Calculating…'}
              </span>
            </div>
            {fulfillment === 'delivery' && deliveryEstimate && (
              <p className="text-[11px] text-bayan-600 font-semibold">
                {formatFeeSummary(deliveryEstimate.distanceKm, deliveryEstimate.fee)} · ~{deliveryEstimate.durationMins} min
              </p>
            )}
            <div className="flex justify-between font-black text-lg border-t pt-2">
              <span>Total</span>
              <span>₱{(cartTotal + (fulfillment === 'delivery' ? deliveryEstimate?.fee || 0 : 10)).toLocaleString()}</span>
            </div>
          </div>

          {/* Checkout details */}
          <div className="card p-4 space-y-4">
            <h3 className="font-extrabold text-ink-800">Checkout details</h3>

            <div>
              <span className="block text-xs font-semibold text-ink-500 mb-2">🚚 Fulfillment</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFulfillment('pickup')} className={`p-2 rounded-xl border text-xs font-bold ${fulfillment === 'pickup' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>📦 Click & collect (₱10)</button>
                <button onClick={() => setFulfillment('delivery')} className={`p-2 rounded-xl border text-xs font-bold ${fulfillment === 'delivery' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>🛵 Doorstep delivery</button>
              </div>
              {fulfillment === 'pickup' ? (
                <select value={hubId} onChange={(e) => setHubId(Number(e.target.value))} className="field mt-2 bg-white"><option value={1}>Nena San Jose Sari-Sari</option></select>
              ) : (
                <div className="mt-2 space-y-2">
                  <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Delivery address" className="field" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: Number(e.target.value) })} placeholder="Latitude" className="field" />
                    <input value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: Number(e.target.value) })} placeholder="Longitude" className="field" />
                  </div>
                  <DeliveryMap
                    origin={[DEFAULT_COORDS.lng, DEFAULT_COORDS.lat]}
                    destination={[coords.lng, coords.lat]}
                    routeGeometry={routeGeometry}
                    className="w-full h-48 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold text-ink-500 mb-2">💳 Payment method</span>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: 'gcash', label: 'GCash', icon: '💚' }, { value: 'maya', label: 'Maya', icon: '💜' }, { value: 'cod', label: 'COD', icon: '💵' }].map((m) => (
                  <button key={m.value} onClick={() => setPaymentMethod(m.value)} className={`p-2 rounded-xl border text-xs font-bold ${paymentMethod === m.value ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{m.icon} {m.label}</button>
                ))}
              </div>
              {user && affiliateBalance > 0 && (
                <label className="flex items-center gap-2 mt-2 px-1 cursor-pointer">
                  <input type="checkbox" checked={useAffiliateBalance} onChange={(e) => setUseAffiliateBalance(e.target.checked)} className="w-4 h-4 rounded border-ink-300 text-bayan-600" />
                  <span className="text-xs text-ink-600">Pay with affiliate earnings <span className="font-bold text-bayan-700">(₱{affiliateBalance.toLocaleString()})</span></span>
                </label>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold text-ink-500 mb-2">🎫 Referral code (optional)</span>
              <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g., NENA01" className="field" />
            </div>

            <button onClick={handleCheckout} disabled={submitting} className="w-full py-3.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition">
              {submitting ? 'Processing…' : useAffiliateBalance ? 'Pay with affiliate earnings' : paymentMethod === 'cod' ? 'Place order (Cash on Delivery)' : 'Proceed to Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}