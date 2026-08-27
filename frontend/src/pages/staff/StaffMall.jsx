import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState } from '../../components/ui.jsx';

export default function StaffMall({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/mall/inventory', { params: { per_page: 100 } });
      setItems(res.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalStock = items.reduce((s, i) => s + Number(i.stock), 0);
  const lowStock = items.filter((i) => Number(i.stock) <= 10);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">BeCoolBox Mall</h2>
        <p className="text-white/75 text-sm mt-1">Official inventory available for local hub pickup & over-the-counter.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-400 font-semibold uppercase">Total SKUs</p>
          <p className="text-2xl font-black text-ink-800">{items.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400 font-semibold uppercase">Units in stock</p>
          <p className="text-2xl font-black text-ink-800">{totalStock}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-bold text-amber-800">⚠️ Low stock ({lowStock.length})</p>
          <p className="text-xs text-amber-700 mt-1">
            {lowStock.map((i) => i.name).join(', ')}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" />
      ) : items.length === 0 ? (
        <EmptyState icon="🏬" title="No mall inventory" hint="Admin has not published any BeCoolBox Mall products." />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bayan-500 to-bayan-700 flex items-center justify-center text-xl text-white shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-ink-800 truncate">{p.name}</h4>
                <p className="text-xs text-ink-400">
                  ₱{Number(p.price).toLocaleString()} · {p.category}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`chip border ${Number(p.stock) <= 10 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}
                >
                  {p.stock} in stock
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}