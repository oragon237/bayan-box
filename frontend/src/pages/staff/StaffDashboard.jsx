import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner } from '../../components/ui.jsx';

export default function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/staff/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tasks = data ? [
    { label: 'Pending Merchant Approvals', count: data.pending_merchant_approvals, to: '/admin/merchants?status=pending', icon: '🏪', color: 'bayan' },
    { label: 'Cash-Out Request Reviews', count: data.pending_cashouts, to: '/admin/affiliates?tab=cashouts', icon: '💸', color: 'amber' },
    { label: 'Order Escalations / Issues', count: data.disputed_orders, to: '/staff/orders?status=disputed', icon: '⚠️', color: 'red' },
    { label: 'Low Stock Alerts', count: data.low_stock_items, to: '/admin/mall?filter=low_stock', icon: '📦', color: 'orange' },
  ] : [];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">Staff Dashboard</h2>
          <p className="text-white/75 text-sm mt-1">Welcome, {user?.name}. Here's what needs your attention.</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Things to Do</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tasks.map((t) => (
            <button key={t.label} onClick={() => navigate(t.to)} className="card p-4 text-left flex items-center gap-3 hover:shadow-lift transition">
              <span className="text-3xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-800 text-sm">{t.label}</p>
                <p className="text-xs text-ink-400">Tap to review</p>
              </div>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black ${t.count > 0 ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}