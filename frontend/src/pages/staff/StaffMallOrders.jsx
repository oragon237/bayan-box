import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATE_STEPS = [
  { key: 'pending_merchant', label: 'New order' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'raider_assigned', label: 'Rider assigned' },
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

function timelineStep(state) {
  if (state === 'pending_merchant') return 0;
  if (state === 'preparing') return 1;
  if (state === 'ready_for_pickup') return 2;
  if (['raider_assigned', 'raider_en_route_to_merchant', 'at_merchant'].includes(state)) return 3;
  if (['in_transit', 'arrived'].includes(state)) return 4;
  if (state === 'delivered') return 5;
  return -1;
}

export default function StaffMallOrders() {
  const notify = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/ops/mall-orders');
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
      notify('Could not load Mall orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const transition = async (id, action, extra = {}) => {
    try {
      const res = await client.post(`/orders/${id}/state/${action}`, extra);
      notify(res.data.message);
      await load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not update the Mall order.', 'error');
    }
  };

  const reject = (order) => {
    const reason = prompt('Rejection reason (optional):');
    if (reason !== null) transition(order.id, 'reject', { reason: reason || 'Rejected by Mall staff' });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Mall Orders</h2>
        <p className="text-white/75 text-sm mt-1">Manage official Mall orders through the same fulfillment flow as merchant products.</p>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : orders.length === 0 ? (
        <EmptyState icon="🏪" title="No Mall orders" hint="Orders for official Mall products will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const state = order.delivery_state || 'pending_merchant';
            const isCancelled = state === 'cancelled';
            const stepIndex = timelineStep(state);
            return (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-400">Mall order #{order.id}</p>
                    <h3 className="font-bold text-ink-800">{order.customer?.name}</h3>
                    <p className="text-xs text-ink-500">📱 {order.customer?.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-ink-900">₱{Number(order.total_amount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-ink-400">💳 {String(order.payment_method || 'gcash').toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-ink-500">
                  {order.items?.map((item) => (
                    <span key={item.id} className="inline-block bg-ink-50 px-2 py-0.5 rounded-full mr-1 mt-1">
                      {item.product?.name} ×{item.quantity}
                    </span>
                  ))}
                </div>

                <span className={`chip border mt-2 ${STATE_STYLES[state] || 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                  {state.replace('raider', 'rider').replace(/_/g, ' ')}
                </span>

                {!isCancelled && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold overflow-x-auto no-scrollbar">
                    {STATE_STEPS.map((step, index) => {
                      const done = index <= stepIndex;
                      return (
                        <div key={step.key} className="flex items-center gap-1 shrink-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>{done ? '✓' : '·'}</span>
                          <span className={done ? 'text-ink-700' : 'text-ink-400'}>{step.label}</span>
                          {index < STATE_STEPS.length - 1 && <span className="w-4 h-0.5 bg-ink-200" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isCancelled && order.cancel_reason && <p className="text-xs text-red-600 mt-2">Reason: {order.cancel_reason}</p>}

                <div className="mt-3 flex gap-2">
                  {state === 'pending_merchant' && <>
                    <button onClick={() => transition(order.id, 'accept')} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">✅ Accept order</button>
                    <button onClick={() => reject(order)} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">✕ Reject</button>
                  </>}
                  {state === 'preparing' && <button onClick={() => transition(order.id, 'mark_ready')} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">📦 Mark ready for pickup</button>}
                  {state === 'ready_for_pickup' && order.fulfillment_type === 'pickup' && <button onClick={() => transition(order.id, 'confirm_collection')} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">✓ Mark collected</button>}
                  {(['raider_assigned', 'raider_en_route_to_merchant', 'at_merchant', 'in_transit', 'arrived'].includes(state) || (state === 'ready_for_pickup' && order.fulfillment_type !== 'pickup')) && <span className="flex-1 py-2.5 bg-ink-50 text-ink-500 text-sm font-bold rounded-xl text-center">{state === 'ready_for_pickup' ? 'Waiting for rider assignment' : 'In fulfillment — customer notified'}</span>}
                  {state === 'delivered' && <span className="flex-1 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl text-center">✅ Delivered</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
