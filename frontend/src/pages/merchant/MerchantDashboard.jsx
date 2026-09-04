import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

export default function MerchantDashboard({ user }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    client.get('/merchant/dashboard').then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>;
  if (!data) return <p className="text-center text-ink-400 py-10">Could not load dashboard.</p>;

  const { store, kpis, pending_orders, low_stock } = data;

  const acceptOrder = (id) => {
    client.post(`/merchant/orders/${id}/status`, { fulfillment_status: 'accepted' }).then(() => { notify('Order accepted.'); load(); }).catch((e) => notify(e.response?.data?.message || 'Failed.', 'error'));
  };
  const cancelOrder = (id) => {
    notify('Order cancellation is handled by support.', 'info');
  };

  const KPI = ({ label, value, color = 'text-ink-800' }) => (
    <div className="card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`text-xl font-black mt-0.5 ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight flex flex-wrap items-center gap-2">
              <span className="truncate max-w-full">{store.name}</span>
              {store.verified && <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">✓ Verified</span>}
            </h2>
            <p className="text-white/75 text-sm mt-1">{store.status === 'active' ? 'Store open' : 'Store closed'} — accepting orders</p>
          </div>
          <span className={`chip border shrink-0 whitespace-nowrap ${store.status === 'active' ? 'bg-green-500 text-white border-green-500' : 'bg-ink-600 text-white border-ink-600'}`}>
            {store.status === 'active' ? '● Open' : '● Closed'}
          </span>
        </div>
        <div className="relative flex gap-2 mt-4">
          <button onClick={() => navigate('/merchant/products')} className="flex-1 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl">🛍️ My Products</button>
          <button onClick={() => navigate('/merchant/profile')} className="flex-1 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl">👤 Profile</button>
          <button onClick={() => navigate('/merchant/reports')} className="flex-1 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl">📊 Reports</button>
          <button onClick={() => navigate('/merchant/settings/payouts')} className="flex-1 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl">💳 Payout Methods</button>
          <button onClick={() => navigate('/affiliate')} className="flex-1 py-2 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold rounded-xl">🤝 Affiliate</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="💰 Revenue (month)" value={`₱${Number(kpis.revenue_this_month).toLocaleString()}`} color="text-bayan-700" />
        <KPI label="📦 Pending orders" value={kpis.pending_orders} color={kpis.pending_orders > 0 ? 'text-red-600' : 'text-ink-800'} />
        <KPI label="🛍️ Units sold" value={kpis.units_sold} />
        <KPI label="💳 Wallet balance" value={`₱${Number(kpis.wallet_balance).toLocaleString()}`} color="text-bayan-700" />
      </div>

      {/* Pending orders queue */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Pending orders ({pending_orders.length})</h3>
        {pending_orders.length === 0 ? (
          <div className="card p-6 text-center"><p className="text-ink-400 text-sm">No pending orders. Great!</p></div>
        ) : (
          <div className="space-y-2">
            {pending_orders.map((o) => (
              <div key={o.id} className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-lg shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-800 text-sm">Order #{o.id} — ₱{Number(o.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-ink-400 truncate">{o.customer?.name} · {o.items?.map((i) => i.product?.name).join(', ') || ''}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => acceptOrder(o.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg">Accept</button>
                  <button onClick={() => cancelOrder(o.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low stock banner */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">⚠️ Low stock alerts ({low_stock.length})</h3>
        {low_stock.length === 0 ? (
          <div className="card p-6 text-center"><p className="text-ink-400 text-sm">All inventory levels healthy.</p></div>
        ) : (
          <div className="card overflow-hidden">
            {low_stock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b border-ink-50 last:border-0">
                <div>
                  <p className="font-bold text-ink-800 text-sm">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.stock} left (threshold {p.low_stock_threshold})</p>
                </div>
                <button onClick={() => navigate('/merchant/products')} className="px-3 py-1.5 bg-bayan-600 hover:bg-bayan-700 text-white text-[11px] font-bold rounded-lg">+ Restock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}