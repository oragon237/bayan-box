import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Spinner } from '../../components/ui.jsx';

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/overview')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-ink-400 py-10">Could not load dashboard.</p>;
  }

  const { financial, users, affiliate, orders, mall } = data;

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">Admin Dashboard</h2>
          <p className="text-white/75 text-sm mt-1">System overview across all modules.</p>
        </div>
      </div>

      {/* Financial & Sales */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Financial & Sales</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card label="Total Revenue" value={`₱${Number(financial.total_revenue).toLocaleString()}`} />
          <Card label="GMV" value={`₱${Number(financial.gmv).toLocaleString()}`} />
          <Card label="Total Orders" value={financial.total_orders} />
          <Card label="Avg Order Value" value={`₱${Number(financial.average_order_value).toLocaleString()}`} />
        </div>
      </div>

      {/* User Statistics */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Users</h3>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <Card label="Customers" value={users.customers} color="bayan" />
          <Card label="Merchants" value={users.merchants} color="bayan" />
          <Card label="Pending" value={users.pending_merchants} color="amber" />
          <Card label="Riders" value={users.riders} color="bayan" />
          <Card label="Providers" value={users.providers} color="bayan" />
          <Card label="Affiliates" value={users.affiliates} color="bayan" />
        </div>
      </div>

      {/* Affiliate */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Affiliate</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card label="Commissions paid" value={`₱${Number(affiliate.commissions_distributed).toLocaleString()}`} color="bayan" />
          <Card label="Pending cash-outs" value={affiliate.pending_cashouts} color={affiliate.pending_cashouts > 0 ? 'amber' : 'bayan'} />
        </div>
      </div>

      {/* Orders & Logistics */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Orders & Logistics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card label="In Transit" value={orders.in_transit} color="bayan" />
          <Card label="Delivered" value={orders.delivered} color="green" />
          <Card label="Paid" value={orders.status_breakdown?.paid || 0} color="bayan" />
          <Card label="COD Pending" value={orders.status_breakdown?.pending_payment || 0} color="amber" />
        </div>
      </div>

      {/* Mall & Inventory */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Mall & Inventory</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card label="Active Listings" value={mall.active_listings} color="bayan" />
          <Card label="Low Stock" value={mall.low_stock} color={mall.low_stock > 0 ? 'red' : 'green'} />
          <Card label="Points Items" value={mall.points_items} color="amber" />
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, color = 'ink' }) {
  const colors = {
    bayan: 'bg-bayan-50 text-bayan-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
    ink: 'bg-ink-50 text-ink-700',
  };
  return (
    <div className="card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`text-xl font-black mt-0.5 ${colors[color] || colors.ink}`}>{value}</p>
    </div>
  );
}