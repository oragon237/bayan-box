import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState } from '../../components/ui.jsx';

const FULFILL_LABELS = {
  pending: 'Order placed',
  accepted: 'Accepted by merchant',
  packaging: 'Packaging',
  sending_to_courier: 'Sent to courier',
  accepted_by_courier: 'Accepted by courier',
};

const FULFILL_STEPS = ['pending', 'accepted', 'packaging', 'sending_to_courier', 'accepted_by_courier'];

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
            const step = FULFILL_STEPS.indexOf(o.fulfillment_status || 'pending');
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
                  <span className="chip border bg-ink-50 text-ink-600 shrink-0">
                    {FULFILL_LABELS[o.fulfillment_status] || 'Order placed'}
                  </span>
                </div>

                <div className="mt-2 text-xs text-ink-500">
                  {o.items?.map((i) => (
                    <span key={i.id} className="inline-block bg-ink-50 px-2 py-0.5 rounded-full mr-1 mt-1">
                      {i.product?.name} ×{i.quantity}
                    </span>
                  ))}
                </div>

                {/* Fulfillment timeline */}
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold overflow-x-auto pb-1">
                  {FULFILL_STEPS.map((s, i) => {
                    const done = i <= step;
                    return (
                      <div key={s} className="flex items-center gap-1 shrink-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                          {done ? '✓' : '·'}
                        </span>
                        <span className={done ? 'text-ink-700' : 'text-ink-400'}>{FULFILL_LABELS[s]}</span>
                        {i < FULFILL_STEPS.length - 1 && <span className="w-4 h-0.5 bg-ink-200" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}