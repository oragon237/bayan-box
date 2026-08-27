import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const FULFILL_STEPS = [
  { key: 'accepted', label: 'Accepted by merchant' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'sending_to_courier', label: 'Sending to courier' },
  { key: 'accepted_by_courier', label: 'Accepted by courier' },
];

const FULFILL_STYLES = {
  accepted: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  packaging: 'bg-amber-50 text-amber-700 border-amber-200',
  sending_to_courier: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted_by_courier: 'bg-green-50 text-green-700 border-green-200',
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

  const advance = async (id, status) => {
    try {
      const res = await client.post(`/merchant/orders/${id}/status`, { fulfillment_status: status });
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not update status.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Orders</h2>
        <p className="text-white/75 text-sm mt-1">Update fulfillment status for your orders.</p>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders" hint="Orders containing your products will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const stepIdx = FULFILL_STEPS.findIndex((s) => s.key === o.fulfillment_status);
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

                <span className={`chip border mt-2 ${FULFILL_STYLES[o.fulfillment_status] || 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                  {(o.fulfillment_status || 'pending').replace('_', ' ')}
                </span>

                {/* Fulfillment steps */}
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold overflow-x-auto">
                  {FULFILL_STEPS.map((s, i) => {
                    const done = i <= stepIdx;
                    return (
                      <div key={s.key} className="flex items-center gap-1 shrink-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                          {done ? '✓' : '·'}
                        </span>
                        <span className={done ? 'text-ink-700' : 'text-ink-400'}>{s.label}</span>
                        {i < FULFILL_STEPS.length - 1 && <span className="w-4 h-0.5 bg-ink-200" />}
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex gap-2">
                  {o.fulfillment_status !== 'accepted_by_courier' && (
                    <>
                      {o.fulfillment_status === 'pending' && (
                        <button onClick={() => advance(o.id, 'accepted')} className="flex-1 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">
                          ✅ Accept order
                        </button>
                      )}
                      {o.fulfillment_status === 'accepted' && (
                        <button onClick={() => advance(o.id, 'packaging')} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl">
                          📦 Start packaging
                        </button>
                      )}
                      {o.fulfillment_status === 'packaging' && (
                        <button onClick={() => advance(o.id, 'sending_to_courier')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">
                          🚚 Send to courier
                        </button>
                      )}
                      {o.fulfillment_status === 'sending_to_courier' && (
                        <button onClick={() => advance(o.id, 'accepted_by_courier')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">
                          ✅ Courier accepted
                        </button>
                      )}
                    </>
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