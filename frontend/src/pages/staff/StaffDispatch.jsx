import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function StaffDispatch({ user }) {
  const notify = useToast();
  const [ready, setReady] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [mapOrders, setMapOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/ops/dispatch');
      setReady(res.data.ready_orders || []);
      setRiders(res.data.riders || []);
      // Build map pins: merchants/origins + customers
      const pins = (res.data.ready_orders || []).map((o) => ({
        orderId: o.id,
        origin: [123.1948, 13.6218],
        destination: [o.longitude ?? 123.1948, o.latitude ?? 13.6218],
        label: o.customer?.name || 'Customer',
      }));
      setMapOrders(pins);
    } catch {
      setReady([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const assignAuto = async (orderId) => {
    setAssigning(`auto-${orderId}`);
    try {
      const res = await client.post(`/staff/ops/dispatch/${orderId}/assign`, {});
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not assign.', 'error');
    } finally {
      setAssigning(null);
    }
  };

  const assignManual = async (orderId, riderId) => {
    if (!riderId) return;
    setAssigning(`manual-${orderId}`);
    try {
      const res = await client.post(`/staff/ops/dispatch/${orderId}/assign`, { rider_id: riderId });
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not assign.', 'error');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Dispatch Center</h2>
        <p className="text-white/75 text-sm mt-1">Assign ready deliveries to riders.</p>
      </div>

      {/* Riders summary */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {riders.map((r) => (
          <div key={r.id} className="card px-3 py-2 shrink-0">
            <p className="font-bold text-ink-800 text-sm">🛵 {r.name}</p>
            <p className="text-[10px] text-ink-400">{r.active_orders} active order(s)</p>
          </div>
        ))}
      </div>

      {/* Map */}
      {mapOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Delivery Map</h3>
          <div className="card !p-0 overflow-hidden" style={{ height: 260 }}>
            <DeliveryMap
              origin={mapOrders[0]?.origin}
              destination={mapOrders[0]?.destination}
              className="w-full h-full"
            />
          </div>
          <p className="text-[11px] text-ink-400 mt-1">🏪 Hub origin · 🏠 customer destinations for {mapOrders.length} ready order(s).</p>
        </div>
      )}

      {/* Dispatch list */}
      {loading ? (
        <div className="space-y-3" />
      ) : ready.length === 0 ? (
        <EmptyState icon="✅" title="All dispatched" hint="No orders awaiting rider assignment." />
      ) : (
        <div className="space-y-3">
          {ready.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink-800">Order #{o.id} — ₱{Number(o.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-ink-400">Customer: {o.customer?.name} · {o.customer?.phone}</p>
                  <p className="text-xs text-ink-500 mt-0.5">📦 {o.items?.map((i) => i.product?.name).join(', ') || '—'}</p>
                  <p className="text-[11px] text-ink-400">📍 {o.delivery_address || 'Address on record'}</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <button
                  onClick={() => assignAuto(o.id)}
                  disabled={assigning === `auto-${o.id}`}
                  className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl"
                >
                  {assigning === `auto-${o.id}` ? 'Assigning…' : '⚡ Auto-assign (nearest rider)'}
                </button>
                <div className="flex gap-2">
                  <select
                    value={selectedRider[o.id] || ''}
                    onChange={(e) => setSelectedRider((p) => ({ ...p, [o.id]: e.target.value }))}
                    className="field flex-1 bg-white"
                  >
                    <option value="">Manual assign…</option>
                    {riders.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.active_orders} active</option>)}
                  </select>
                  <button
                    onClick={() => assignManual(o.id, selectedRider[o.id])}
                    disabled={!selectedRider[o.id] || assigning === `manual-${o.id}`}
                    className="px-4 py-2 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-xl"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}