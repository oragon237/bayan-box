import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import { Spinner, useToast } from '../../components/ui.jsx';

const INCIDENT_ICON = { accident: '🚨', breakdown: '🔧', weather: '🌧️', customer_unreachable: '📴', other: '⚠️' };

export default function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [overview, setOverview] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [board, setBoard] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [mallOrders, setMallOrders] = useState([]);
  const [fulfillingOrder, setFulfillingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hazardModal, setHazardModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, i, b, t, h, m] = await Promise.all([
        client.get('/staff/ops/overview'), client.get('/staff/ops/incidents'), client.get('/staff/ops/status-board'),
        client.get('/staff/ops/tickets'), client.get('/staff/ops/hazards'), client.get('/staff/ops/mall-orders'),
      ]);
      setOverview(o.data); setIncidents(i.data); setBoard(b.data); setTickets(t.data);
      setHazards(h.data.zones || []);
      setMallOrders((m.data.orders || []).filter((order) => ['pending_merchant', 'preparing'].includes(order.delivery_state) || (order.fulfillment_type === 'pickup' && order.delivery_state === 'ready_for_pickup')));
    } catch {
      notify('Could not load dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resolveIncident = async (id) => {
    await client.post(`/staff/ops/incidents/${id}/resolve`, { notes: 'Resolved by staff' }).catch(() => {});
    notify('Incident resolved.');
    load();
  };

  const resolveTicket = async (t, action) => {
    await client.post(`/staff/ops/tickets/${t.id}/resolve`, { action, note: `Marked as ${action} by staff` }).catch(() => {});
    notify(`Ticket ${action}.`);
    load();
  };

  const saveHazards = async () => {
    await client.post('/staff/ops/hazards', { zones: hazards }).catch(() => {});
    notify('Hazard zones updated.');
    setHazardModal(false);
  };

  const fulfillMallOrder = async (id, action) => {
    setFulfillingOrder(`${id}-${action}`);
    try {
      const res = await client.post(`/orders/${id}/state/${action}`);
      notify(res.data.message);
      await load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not update the Mall order.', 'error');
    } finally {
      setFulfillingOrder(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>;

  const KPI = ({ label, value, color = 'text-ink-800' }) => (
    <div className="card p-3 text-center">
      <p className="text-xl font-black mt-0.5">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Staff Operations</h2>
            <p className="text-white/75 text-sm mt-1">Dispatch, monitor, and resolve.</p>
          </div>
          <button onClick={() => setHazardModal(true)} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">⚠️ Hazard Toggle</button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-black text-bayan-700">{overview.active_riders}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">🛵 Active Riders</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-black">{overview.deliveries_in_transit}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">📦 In-Transit</p>
        </div>
        <div className="card p-3 text-center">
          <p className={`text-xl font-black ${overview.emergency_alerts > 0 ? 'text-red-600' : ''}`}>{overview.emergency_alerts}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">🚨 Emergencies</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-black">{overview.unassigned_orders}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">⏳ Unassigned</p>
        </div>
        <div className="card p-3 text-center">
          <p className={`text-xl font-black ${overview.mall_orders_waiting > 0 ? 'text-amber-600' : ''}`}>{overview.mall_orders_waiting || 0}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">🏪 Mall orders</p>
        </div>
      </div>

      {/* Official Mall fulfillment queue */}
      <div>
        <div className="flex items-center justify-between gap-3 px-1 mb-2">
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">🏪 Official Mall orders ({mallOrders.length})</h3>
            <p className="text-xs text-ink-400 mt-0.5">Accept and prepare orders for admin-owned Mall products.</p>
          </div>
          <button onClick={() => navigate('/staff/mall/orders')} className="text-xs font-bold text-bayan-700 hover:underline shrink-0">View all orders →</button>
        </div>
        {mallOrders.length === 0 ? (
          <div className="card p-5 text-center"><p className="text-ink-400 text-sm">No Mall orders need fulfillment.</p></div>
        ) : (
          <div className="space-y-2">
            {mallOrders.map((order) => {
              const isNew = order.delivery_state === 'pending_merchant';
              const isCollection = order.fulfillment_type === 'pickup' && order.delivery_state === 'ready_for_pickup';
              const action = isNew ? 'accept' : isCollection ? 'confirm_collection' : 'mark_ready';
              const isWorking = fulfillingOrder === `${order.id}-${action}`;
              return (
                <div key={order.id} className="card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bayan-50 flex items-center justify-center text-lg shrink-0">🏪</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-800 text-sm">Order #{order.id} — ₱{Number(order.total_amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-ink-400 truncate">{order.customer?.name} · {order.items?.map((item) => item.product?.name).join(', ')}</p>
                    <p className="text-[11px] font-semibold text-amber-700 mt-1">{isNew ? 'New — awaiting acceptance' : isCollection ? 'Ready — awaiting customer collection' : 'Accepted — prepare for handoff'}</p>
                  </div>
                  <button
                    onClick={() => fulfillMallOrder(order.id, action)}
                    disabled={isWorking}
                    className={`w-full sm:w-auto px-4 py-2.5 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl ${isNew ? 'bg-green-600 hover:bg-green-700' : 'bg-bayan-600 hover:bg-bayan-700'}`}
                  >
                    {isWorking ? 'Updating…' : isNew ? '✓ Accept order' : isCollection ? '✓ Mark collected' : '📦 Mark ready'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency queue */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">🚨 High Priority — Emergency Reports ({incidents.length})</h3>
        {incidents.length === 0 ? (
          <div className="card p-6 text-center"><p className="text-ink-400 text-sm">No active emergencies.</p></div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="card p-4 border-l-4 border-l-red-500">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{INCIDENT_ICON[inc.type] || '⚠️'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-ink-800">{inc.rider?.name}</p>
                      <p className="text-xs text-ink-400">📱 {inc.rider?.phone} · Order #{inc.order_id || '—'}</p>
                      <p className="text-sm text-ink-600 mt-1">{inc.description}</p>
                      <p className="text-[11px] text-ink-400">{new Date(inc.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="chip border bg-red-50 text-red-600 border-red-200 shrink-0">{inc.type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${inc.rider?.phone}`} className="flex-1 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl text-center">📞 Call rider</a>
                  {inc.order_id && <button onClick={() => navigate('/staff/dispatch')} className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl">↔ Reassign order</button>}
                  <button onClick={() => resolveIncident(inc.id)} className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-xl">✓ Resolve</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status board */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Delivery Status Board</h3>
        {board && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(board).map(([state, orders]) => (
              <div key={state} className="card p-3">
                <p className="text-[10px] font-bold uppercase text-ink-400">{state.replace('_', ' ')} ({orders.length})</p>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {orders.length === 0 ? <p className="text-xs text-ink-300">—</p> : orders.map((o) => {
                    const delayed = state === 'in_transit' && o.elapsed_minutes > o.estimated_delivery_minutes;
                    return (
                      <div key={o.id} className={`rounded-lg p-2 text-xs ${delayed ? 'bg-red-50 border border-red-200' : 'bg-ink-50'}`}>
                        <p className="font-bold text-ink-800">Order #{o.id} · ₱{Number(o.total_amount || 0).toLocaleString()}</p>
                        <p className="text-ink-400">{o.customer?.name} · {o.items?.map((i) => i.product?.name).join(', ')}</p>
                        {delayed && <p className="text-red-600 font-bold mt-0.5">⚠️ Delayed ({o.elapsed_minutes}min)</p>}
                        {state === 'in_transit' && <p className="mt-1 text-[10px] font-semibold text-bayan-700">Rider is completing the delivery flow.</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute queue */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Reports & Disputes ({tickets.length})</h3>
        {tickets.length === 0 ? (
          <div className="card p-6 text-center"><p className="text-ink-400 text-sm">No open tickets.</p></div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink-800">{t.subject} <span className="text-[10px] text-ink-400">({t.reporter_role})</span></p>
                    <p className="text-xs text-ink-400">{t.user?.name} · Order #{t.order_id || '—'}</p>
                    <p className="text-sm text-ink-600 mt-1">{t.description}</p>
                  </div>
                  <span className={`chip border ${t.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{t.status}</span>
                </div>
                {t.proof_url && <button onClick={() => window.open(t.proof_url)} className="mt-2 text-xs font-bold text-bayan-700 hover:underline">📎 View proof photo</button>}
                {t.status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => resolveTicket(t, 'refunded')} className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-xl">💵 Refund / credit</button>
                    <button onClick={() => resolveTicket(t, 'redelivery')} className="flex-1 py-2 bg-bayan-50 hover:bg-bayan-100 text-bayan-700 text-xs font-bold rounded-xl">🔄 Redelivery</button>
                    <button onClick={() => resolveTicket(t, 'dismissed')} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl">✕ Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hazard modal */}
      {hazardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setHazardModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-ink-800">Barangay Hazard Zones</h3>
            <p className="text-xs text-ink-500">Flag zones as temporarily impassable (floods, roadwork).</p>
            <div className="space-y-2">
              {hazards.map((z, i) => (
                <div key={i} className="flex items-center justify-between bg-ink-50 rounded-xl px-3 py-2">
                  <span className="font-bold text-ink-800 text-sm">{z.name}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-ink-600">{z.impassable ? 'Impassable' : 'Open'}</span>
                    <input type="checkbox" checked={z.impassable} onChange={() => setHazards((prev) => prev.map((x, j) => j === i ? { ...x, impassable: !x.impassable } : x))} className="w-4 h-4 text-red-600" />
                  </label>
                </div>
              ))}
            </div>
            <button onClick={saveHazards} className="w-full py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">Save hazard zones</button>
          </div>
        </div>
      )}
    </div>
  );
}
