import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import { useToast } from '../../components/ui.jsx';

const STATE_STYLE = {
  raider_assigned: 'bg-bayan-600 text-white',
  raider_en_route_to_merchant: 'bg-blue-600 text-white',
  at_merchant: 'bg-purple-600 text-white',
  in_transit: 'bg-orange-500 text-white',
  arrived: 'bg-orange-500 text-white',
};

const STATE_LABEL = {
  raider_assigned: 'Assigned to you',
  raider_en_route_to_merchant: 'Heading to merchant',
  at_merchant: 'At merchant',
  in_transit: 'Heading to customer',
  arrived: 'At customer',
};

function SkeletonCard() {
  return <div className="card p-4 space-y-3"><div className="h-3 bg-ink-200 rounded animate-pulse-soft w-1/2" /><div className="h-3 bg-ink-200 rounded animate-pulse-soft w-3/4" /><div className="h-3 bg-ink-200 rounded animate-pulse-soft w-2/3" /></div>;
}

function EarningsBarChart({ trend }) {
  const max = Math.max(...trend.map((t) => t.earnings), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {trend.map((t) => (
        <div key={t.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-bold text-ink-700">₱{t.earnings}</span>
          <div className="w-full bg-bayan-500 rounded-t" style={{ height: `${Math.max(8, (t.earnings / max) * 100)}px` }} />
          <span className="text-[9px] text-ink-400 truncate max-w-full">{t.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RiderDashboard({ user }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  const load = () => {
    client.get('/rider/dashboard').then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const loadEarnings = () => {
    setLoadingEarnings(true);
    const params = {};
    if (period === 'daily') { params.from = new Date().toISOString().slice(0, 10); }
    if (period === 'weekly') { params.from = new Date(Date.now() - 7 * 864e5).toISOString(); }
    if (period === 'monthly') { params.from = new Date(Date.now() - 30 * 864e5).toISOString(); }
    client.get('/rider/earnings', { params }).then((res) => setEarnings(res.data)).catch(() => {}).finally(() => setLoadingEarnings(false));
  };

  useEffect(() => { loadEarnings(); }, [period]);

  if (loading) {
    return <div className="space-y-4">{['a', 'b', 'c'].map((i) => <SkeletonCard key={i} />)}</div>;
  }

  const active = data.active_orders[0];
  const activeOrder = data.active_orders;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">Rider Dashboard</h2>
          <p className="text-white/75 text-sm mt-1">Active deliveries and your earnings at a glance.</p>
        </div>
      </div>

      {/* ── Priority 1: Active orders ── */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Active Orders</h3>
        {activeOrder.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-4xl">🛵</p>
            <p className="font-bold text-ink-800 mt-2">No active deliveries</p>
            <p className="text-sm text-ink-400 mt-1">New assignments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrder.map((o) => (
              <div key={o.id} className="card overflow-hidden border-l-4 border-l-bayan-600">
                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-ink-50">
                  <span className={`chip border ${STATE_STYLE[o.delivery_state] || 'bg-ink-100 text-ink-600'}`}>{STATE_LABEL[o.delivery_state] || o.delivery_state}</span>
                  <span className="text-xs font-bold text-ink-600">Order #{o.id} · 💳 {String(o.payment_method || 'gcash').toUpperCase()}</span>
                </div>

                <div className="p-4">
                  {/* Route map */}
                  {o.latitude && o.longitude && (
                    <DeliveryMap
                      origin={o.merchant?.latitude ? [o.merchant.longitude, o.merchant.latitude] : [123.1948, 13.6218]}
                      destination={[o.longitude, o.latitude]}
                      className="w-full h-36 rounded-xl mb-3"
                    />
                  )}

                  {/* Order details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-ink-50 rounded-xl p-3">
                      <p className="text-[10px] text-ink-400 uppercase font-bold">🏪 Merchant</p>
                      <p className="font-bold text-ink-800 mt-0.5">{o.merchant?.name || 'Hub'}</p>
                      <p className="text-xs text-ink-400">{o.merchant?.barangay ? `${o.merchant.barangay}, ${o.merchant.municipality}` : '—'}</p>
                    </div>
                    <div className="bg-ink-50 rounded-xl p-3">
                      <p className="text-[10px] text-ink-400 uppercase font-bold">📦 Customer</p>
                      <p className="font-bold text-ink-800 mt-0.5">{o.customer?.name}</p>
                      <p className="text-xs text-ink-400">{o.delivery_address || 'Address on record'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-ink-500">
                    <span>📏 {o.estimated_distance_km} km</span>
                    <span>⏱ ~{o.estimated_delivery_min} min</span>
                    <span>🛍 {o.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ') || '—'}</span>
                  </div>

                  {/* Earnings breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-xl p-2"><p className="text-sm font-black text-green-700">₱{o.base_fee}</p><p className="text-[10px] text-ink-400">Base fee</p></div>
                    <div className="bg-ink-50 rounded-xl p-2"><p className="text-sm font-black text-ink-700">₱{o.tip}</p><p className="text-[10px] text-ink-400">Tip</p></div>
                    <div className="bg-orange-50 rounded-xl p-2"><p className="text-sm font-black text-orange-600">₱{o.surge}</p><p className="text-[10px] text-ink-400">Surge</p></div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a href={`tel:${o.customer?.phone}`} className="flex-1 min-w-28 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl text-center">📞 Call</a>
                    <a href={`https://maps.google.com/?q=${o.latitude},${o.longitude}`} target="_blank" rel="noreferrer" className="flex-1 min-w-28 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl text-center">🧭 Navigate</a>
                    <button onClick={() => navigate('/rider/deliveries')} className="flex-1 min-w-36 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">
                      Open delivery controls →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue */}
      {data.queue.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Next in queue ({data.queue.length})</h3>
          <div className="space-y-2">
            {data.queue.map((q) => (
              <div key={q.id} className="card p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-ink-800 text-sm">Order #{q.id}</p>
                  <p className="text-xs text-ink-400 truncate">{q.customer?.name} · {q.items?.map((i) => i.name).join(', ')}</p>
                </div>
                <span className="text-sm font-black text-ink-800 shrink-0">₱{Number(q.shipping_amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Priority 2: Earnings ── */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Earnings</h3>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-[10px] text-ink-400 uppercase font-bold">Today</p>
            <p className="text-2xl font-black text-green-600">₱{Number(data.earnings.today).toLocaleString()}</p>
            <button onClick={() => navigate('/rider/wallet')} className="mt-2 w-full py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">Cash Out Now</button>
          </div>
          <div className="card p-4">
            <p className="text-[10px] text-ink-400 uppercase font-bold">Weekly</p>
            <p className="text-2xl font-black text-ink-800">₱{Number(data.earnings.weekly).toLocaleString()}</p>
            <p className="text-[10px] text-ink-400 mt-2">Wallet: ₱{Number(data.earnings.wallet_balance).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] text-ink-400 uppercase font-bold">Cash on Hand (COD)</p>
            <p className="text-2xl font-black text-orange-600">₱{Number(data.earnings.cash_on_hand).toLocaleString()}</p>
            <p className="text-[10px] text-ink-400 mt-2">
              {Number(data.earnings.cash_on_hand) > 0
                ? `₱${Number(data.earnings.cod_collected_total).toLocaleString()} collected · ₱${Number(data.earnings.cod_remitted_total).toLocaleString()} remitted — turn in to staff`
                : 'All collected COD handed to staff ✓'}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] text-ink-400 uppercase font-bold">Pending Payout</p>
            <p className="text-2xl font-black text-ink-800">₱{Number(data.earnings.wallet_balance).toLocaleString()}</p>
            <p className="text-[10px] text-ink-400 mt-2">Available to withdraw</p>
          </div>
        </div>

        {/* Period tabs + chart */}
        <div className="card p-4 mt-3">
          <div className="flex gap-2 mb-3">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`chip border ${period === p ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{p}</button>
            ))}
          </div>
          {loadingEarnings ? (
            <div className="h-28 bg-ink-200 rounded animate-pulse-soft" />
          ) : earnings && earnings.trend.length > 0 ? (
            <>
              <EarningsBarChart trend={earnings.trend} />
              {/* Itemization */}
              <div className="mt-4 space-y-1.5 text-sm border-t pt-3">
                <Row label="Base trip pay" value={earnings.summary.total_base} />
                <Row label="Customer tips" value={earnings.summary.total_tips} />
                <Row label="Distance / time bonuses" value={earnings.summary.total_bonuses} />
                <Row label="Incentive target rewards" value={earnings.summary.total_incentives} />
                <Row label="Platform fee deductions" value={-earnings.summary.total_fees} negative />
                <Row label="Net earnings" value={earnings.summary.net_earnings} bold />
              </div>
            </>
          ) : (
            <p className="text-center text-ink-400 text-sm py-8">No earnings in this period.</p>
          )}
        </div>

        {/* Transaction history */}
        <div className="card p-4 mt-3">
          <h4 className="font-bold text-ink-800 mb-2">Transaction history</h4>
          {earnings?.transactions?.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-4">No completed orders in this period.</p>
          ) : (
            <div className="space-y-1.5">
              {earnings?.transactions?.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-50 last:border-0">
                  <div>
                    <p className="font-bold text-ink-800">Order #{t.id} · {t.customer_name}</p>
                    <p className="text-[11px] text-ink-400">{new Date(t.date).toLocaleString()}</p>
                  </div>
                  <span className="font-black text-green-600">+₱{Number(t.net_earned).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold = false, negative = false }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-black text-lg border-t pt-2' : ''}`}>
      <span className={bold ? 'text-ink-900' : 'text-ink-500'}>{label}</span>
      <span className={negative ? 'text-red-600' : 'text-green-600'}>{value >= 0 && !negative ? '+' : ''}₱{Number(Math.abs(value)).toLocaleString()}</span>
    </div>
  );
}
