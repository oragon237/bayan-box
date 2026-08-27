import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function PointsShop({ user }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        client.get('/products', { params: { per_page: 50, points_only: true } }),
        user ? client.get('/loyalty') : Promise.resolve({ data: { balance: 0 } }),
      ]);
      setProducts(Array.isArray(pRes.data.data) ? pRes.data.data : []);
      setPointsBalance(Number(lRes.data?.balance || 0));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const addToCart = (p) => {
    if (!user) {
      notify('Please log in to redeem with points.', 'info');
      navigate('/login');
      return;
    }
    notify(`Added to cart — ${p.points_price} pts. Checkout to redeem.`, 'success');
    client
      .post('/cart/sync', {
        cart: [{
          product_id: p.id,
          quantity: (() => {
            let q = 1;
            const item = JSON.parse(localStorage.getItem('bayanbox_points_qty') || '{}');
            q = item[p.id] || 1;
            localStorage.setItem('bayanbox_points_qty', JSON.stringify({ ...item, [p.id]: q }));
            return q;
          })(),
        }],
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Points Shop</h2>
            <p className="text-white/75 text-sm mt-1">Exclusive items redeemable with Suki Points only.</p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-3xl font-black text-amber-400">🪙 {pointsBalance}</p>
              <p className="text-[11px] text-white/60">Your Suki Points</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-ink-200 rounded-2xl animate-pulse-soft" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon="🪙" title="No points items yet" hint="Points-redeemable items will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="card p-3 flex flex-col justify-between">
              <div>
                <button
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="w-full h-28 rounded-xl bg-gradient-to-br from-amber-100 to-ink-100 flex items-center justify-center text-4xl mb-2 overflow-hidden"
                >
                  {p.image_url || (p.images && p.images[0]?.image_url) ? (
                    <img src={p.image_url || p.images[0].image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    '🎁'
                  )}
                </button>
                <h3 className="font-bold text-ink-800 text-sm leading-snug">{p.name}</h3>
                <p className="text-xs text-ink-400 mt-1 line-clamp-2">{p.description}</p>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black text-amber-600">🪙 {p.points_price} pts</span>
                  <span className="text-[10px] text-ink-400">Stock: {p.stock}</span>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.stock <= 0 || (user && pointsBalance < p.points_price)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl transition"
                >
                  {p.stock <= 0 ? 'Out of Stock' : user && pointsBalance < p.points_price ? 'Not enough points' : 'Redeem with Points'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}