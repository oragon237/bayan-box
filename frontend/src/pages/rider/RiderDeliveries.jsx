import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function RiderDeliveries({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('active');
  const [deliveries, setDeliveries] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, h] = await Promise.all([
        client.get('/rider/deliveries'),
        client.get('/rider/deliveries/history'),
      ]);
      setDeliveries(a.data.deliveries || []);
      setHistory(h.data.data || []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const action = async (id, endpoint, successMsg) => {
    try {
      const res = await client.post(`/rider/deliveries/${id}/${endpoint}`);
      notify(res.data?.message || successMsg);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  const statusStyle = (s) =>
    s === 'delivered' ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'disputed' ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-ink-100 text-ink-500 border-ink-200';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Deliveries</h2>
        <p className="text-white/75 text-sm mt-1">Assigned doorstep orders and your delivery history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')} className={`chip border ${tab === 'active' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>🛵 Active ({deliveries.length})</button>
        <button onClick={() => setTab('history')} className={`chip border ${tab === 'history' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>📜 History ({history.length})</button>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : tab === 'active' ? (
        deliveries.length === 0 ? (
          <EmptyState icon="🛵" title="No assigned deliveries" hint="New orders will appear here when staff dispatches them." />
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <div key={d.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink-400">Order #{d.id}</p>
                    <h3 className="font-bold text-ink-800">{d.customer?.name}</h3>
                    <p className="text-xs text-ink-500">📱 {d.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-ink-900">₱{Number(d.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-ink-400">+ ₱{Number(d.shipping_amount).toLocaleString()} delivery</p>
                  </div>
                </div>

                <div className="bg-ink-50 rounded-xl p-3 text-xs space-y-1">
                  <p className="text-ink-500">📍 {d.delivery_address || 'Address provided'}</p>
                  <p className="text-ink-400">{d.items?.map((i) => `${i.product?.name} ×${i.quantity}`).join(', ') || '—'}</p>
                  <p className="text-ink-400">💳 {String(d.payment_method || 'gcash').toUpperCase()}</p>
                </div>

                <div className="flex gap-2">
                  {d.status === 'assigned' && (
                    <button onClick={() => action(d.id, 'out-for-delivery', 'Marked out for delivery.')} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">🚚 Start delivery</button>
                  )}
                  {(d.status === 'assigned' || d.status === 'out_for_delivery') && (
                    <button onClick={() => action(d.id, 'deliver', 'Delivery completed.')} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">✅ Delivered</button>
                  )}
                  <button onClick={() => action(d.id, 'refuse', 'Refused.')} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">✕ Refuse</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState icon="📜" title="No delivery history yet" hint="Completed deliveries will appear here." />
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-ink-100 flex items-center justify-center text-xl shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-800">Order #{h.id} — ₱{Number(h.total_amount).toLocaleString()}</p>
                <p className="text-xs text-ink-400 truncate">{h.customer?.name} · {h.customer?.phone}</p>
                <p className="text-[11px] text-ink-400">
                  {h.items?.map((i) => `${i.product?.name} ×${i.quantity}`).join(', ') || '—'}
                </p>
                <p className="text-[10px] text-ink-400 mt-0.5">{new Date(h.updated_at || h.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`chip border shrink-0 ${statusStyle(h.status)}`}>{h.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}