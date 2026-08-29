import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATE_STEPS = [
  { key: 'pending_merchant', label: 'New order' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'raider_assigned', label: 'Raider assigned' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
];

const STATE_STYLES = {
  pending_merchant: 'bg-amber-50 text-amber-700 border-amber-200',
  preparing: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  ready_for_pickup: 'bg-blue-50 text-blue-700 border-blue-200',
  raider_assigned: 'bg-purple-50 text-purple-700 border-purple-200',
  raider_en_route_to_merchant: 'bg-purple-50 text-purple-700 border-purple-200',
  at_merchant: 'bg-purple-50 text-purple-700 border-purple-200',
  in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
  arrived: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function MerchantOrders({ user }) {
  const notify = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/merchant/orders', { params: { per_page: 50 } });
      setOrders(res.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const transition = async (id, action, extra = {}) => {
    try {
      const res = await client.post(`/orders/${id}/state/${action}`, extra);
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not update status.', 'error');
    }
  };

  const reject = async (o) => {
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;
    await transition(o.id, 'reject', { reason: reason || 'Rejected by merchant' });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Orders</h2>
        <p className="text-white/75 text-sm mt-1">Accept orders, prepare, and mark ready for raider pickup.</p>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders" hint="Orders containing your products will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const state = o.delivery_state || 'pending_merchant';
            const isCancelled = state === 'cancelled';
            const stepIdx = STATE_STEPS.findIndex((s) => s.key === state);
            return (
              <div key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-400">Order #{o.id}</p>
                    <h3 className="font-bold text-ink-800">{o.customer?.name}</h3>
                    <p className="text-xs text-ink-500">📱 {o.customer?.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-ink-900">₱{Number(o.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-ink-400">💳 {String(o.payment_method || 'gcash').toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-ink-500">
                  {o.items?.filter((i) => i.product?.merchant_id === user?.id).map((i) => (
                    <span key={i.id} className="inline-block bg-ink-50 px-2 py-0.5 rounded-full mr-1 mt-1">
                      {i.product?.name} ×{i.quantity}
                    </span>
                  ))}
                </div>

                {/* Status badge */}
                <span className={`chip border mt-2 ${STATE_STYLES[state] || 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                  {(state || 'pending_merchant').replace(/_/g, ' ')}
                </span>

                {/* State machine timeline */}
                {!isCancelled && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold overflow-x-auto no-scrollbar">
                    {STATE_STEPS.map((s, i) => {
                      const done = i <= stepIdx;
                      return (
                        <div key={s.key} className="flex items-center gap-1 shrink-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                            {done ? '✓' : '·'}
                          </span>
                          <span className={done ? 'text-ink-700' : 'text-ink-400'}>{s.label}</span>
                          {i < STATE_STEPS.length - 1 && <span className="w-4 h-0.5 bg-ink-200" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isCancelled && o.cancel_reason && <p className="text-xs text-red-600 mt-2">Reason: {o.cancel_reason}</p>}

                {/* Merchant actions */}
                <div className="mt-3 flex gap-2">
                  {state === 'pending_merchant' && (
                    <>
                      <button onClick={() => transition(o.id, 'accept')} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">
                        ✅ Accept order
                      </button>
                      <button onClick={() => reject(o)} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">
                        ✕ Reject
                      </button>
                    </>
                  )}
                  {state === 'preparing' && (
                    <button onClick={() => transition(o.id, 'mark_ready')} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">
                      📦 Mark ready for pickup
                    </button>
                  )}
                  {['ready_for_pickup', 'raider_assigned', 'raider_en_route_to_merchant', 'at_merchant', 'in_transit', 'arrived'].includes(state) && (
                    <span className="flex-1 py-2.5 bg-ink-50 text-ink-500 text-sm font-bold rounded-xl text-center">
                      {state === 'ready_for_pickup' ? 'Waiting for raider assignment' : 'In fulfillment — customer notified'}
                    </span>
                  )}
                  {state === 'delivered' && (
                    <span className="flex-1 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl text-center">
                      ✅ Delivered
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}