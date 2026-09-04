import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState } from '../../components/ui.jsx';

// Keep the customer-visible tracker aligned with Merchant Orders and Mall
// Orders. The detailed rider-only states below are collapsed into their
// matching customer milestones.
const ORDER_STEPS = [
  { key: 'pending_merchant', label: 'New order' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'raider_assigned', label: 'Rider assigned' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
];

const CHIP_STYLES = {
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

function customerStatus(order) {
  const state = order.delivery_state || 'pending_merchant';
  const step = state === 'pending_merchant' ? 0
    : state === 'preparing' ? 1
      : state === 'ready_for_pickup' ? 2
        : ['raider_assigned', 'raider_en_route_to_merchant', 'at_merchant'].includes(state) ? 3
          : ['in_transit', 'arrived'].includes(state) ? 4
            : state === 'delivered' ? 5 : 0;
  const label = ORDER_STEPS[step].label;

  return { state, steps: ORDER_STEPS, step, label };
}

export default function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/orders', { params: { per_page: 50 } });
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

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Orders</h2>
        <p className="text-white/75 text-sm mt-1">Track the status of your marketplace purchases.</p>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" hint="Your marketplace purchases will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
              const state = o.delivery_state || 'pending_merchant';
              const isCancelled = state === 'cancelled';
              const isDelivered = state === 'delivered';
              const trackable = o.fulfillment_type !== 'pickup' && !isCancelled && !isDelivered;
              const progress = customerStatus(o);
            return (
              <div key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-400">Order #{o.id}</p>
                    <h3 className="font-bold text-ink-800">₱{Number(o.total_amount).toLocaleString()}</h3>
                    <p className="text-xs text-ink-500">
                      💳 {String(o.payment_method || 'gcash').toUpperCase()} · {o.fulfillment_type === 'pickup' ? 'Click & collect' : 'Doorstep delivery'}
                    </p>
                  </div>
                  <span className={`chip border shrink-0 ${CHIP_STYLES[state] || 'bg-ink-50 text-ink-600 border-ink-100'}`}>
                    {progress.label}
                  </span>
                </div>

                <div className="mt-2 text-xs text-ink-500">
                  {o.items?.map((i) => (
                    <span key={i.id} className="inline-block bg-ink-50 px-2 py-0.5 rounded-full mr-1 mt-1">
                      {i.product?.name} ×{i.quantity}
                    </span>
                  ))}
                </div>

                {/* Lifecycle timeline */}
                {isCancelled ? (
                  <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 font-semibold">
                    ✕ This order was cancelled{o.cancel_reason ? ` — ${o.cancel_reason}` : ''}.
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold overflow-x-auto pb-1">
                    {progress.steps.map((s, i) => {
                      const done = i <= progress.step;
                      return (
                        <div key={s.label} className="flex items-center gap-1 shrink-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                            {done ? '✓' : '·'}
                          </span>
                          <span className={done ? 'text-ink-700' : 'text-ink-400'}>{s.label}</span>
                          {i < progress.steps.length - 1 && <span className="w-4 h-0.5 bg-ink-200" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {trackable && (
                  <Link
                    to={`/orders/${o.id}/track`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-bayan-50 border border-bayan-200 px-3 py-1.5 text-xs font-bold text-bayan-700 hover:bg-bayan-100 transition"
                  >
                    🛰 Live track {o.rider?.name ? `· ${o.rider.name}` : ''}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
