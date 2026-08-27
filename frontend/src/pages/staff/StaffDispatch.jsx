import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function StaffDispatch({ user }) {
  const notify = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        client.get('/staff/deliveries/unassigned', { params: { per_page: 50 } }),
        client.get('/staff/sales/today'),
      ]);
      setDeliveries(dRes.data.data || []);
      setSales(sRes.data);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assign = async (id) => {
    setAssigning(id);
    try {
      const res = await client.post(`/staff/deliveries/${id}/assign`);
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Assignment failed.', 'error');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Dispatch</h2>
        <p className="text-white/75 text-sm mt-1">Assign doorstep deliveries to riders (round-robin) and track today's sales.</p>
      </div>

      {/* Today's sales */}
      {sales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-3">
            <p className="text-[10px] text-ink-400 font-semibold uppercase">Orders today</p>
            <p className="text-xl font-black text-ink-800">{sales.order_count}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-ink-400 font-semibold uppercase">Gross sales</p>
            <p className="text-xl font-black text-ink-800">₱{Number(sales.gross_sales).toLocaleString()}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-ink-400 font-semibold uppercase">Delivery fees</p>
            <p className="text-xl font-black text-ink-800">₱{Number(sales.delivery_fees).toLocaleString()}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] text-ink-400 font-semibold uppercase">Total revenue</p>
            <p className="text-xl font-black text-ink-800">₱{Number(sales.total_revenue).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Unassigned deliveries */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">
          Unassigned ({deliveries.length})
        </h3>

        {loading ? (
          <div className="space-y-3" />
        ) : deliveries.length === 0 ? (
          <EmptyState icon="✅" title="All dispatched" hint="All doorstep orders have been assigned to riders." />
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <div key={d.id} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-lg shrink-0">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-800">Order #{d.id} — ₱{Number(d.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {d.customer?.name} · {d.customer?.phone} · 💳 {String(d.payment_method || 'gcash').toUpperCase()}
                  </p>
                  <p className="text-[11px] text-ink-400 truncate mt-0.5">📍 {d.delivery_address}</p>
                </div>
                <button
                  onClick={() => assign(d.id)}
                  disabled={assigning === d.id}
                  className="shrink-0 px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl"
                >
                  {assigning === d.id ? '…' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}