import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { StatCard, Badge, Spinner } from '../components/ui.jsx';
import { PackageIcon, RouteIcon, MapPinIcon, StarIcon, ScanIcon, ShareIcon, TagIcon, ArrowRightIcon } from '../components/icons.jsx';

function Greeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Magandang umaga' : h < 18 ? 'Magandang hapon' : 'Magandang gabi';
  return g;
}

export default function Home({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'staff') {
          const { data: inv } = await client.get('/hub/inventory', { params: { per_page: 1 } });
          setData({
            hub: inv.hub,
            current: inv.current_parcel_count,
            capacity: inv.capacity_limit,
            recent: inv.parcels.data.slice(0, 3),
          });
        } else if (user?.role === 'rider') {
          const [batches, wallet] = await Promise.all([
            client.get('/rider/batches', { params: { per_page: 1 } }),
            client.get('/rider/wallet'),
          ]);
          const active = batches.data.data.filter((b) => b.status !== 'completed');
          setData({ batches: batches.data.data, activeCount: active.length, wallet: wallet.data.balance });
        } else {
          const { data: loyalty } = await client.get('/loyalty');
          setData({ loyalty: loyalty.balance, recent: loyalty.ledger.slice(0, 3) });
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const actions = {
    staff: [
      { to: '/hub', label: 'Scan Parcels', desc: 'Inbound intake with camera', icon: ScanIcon },
      { to: '/hub/inventory', label: 'Inventory', desc: 'Reconcile & OTP release', icon: PackageIcon },
      { to: '/staff/dispatch', label: 'Dispatch', desc: 'Assign deliveries + sales', icon: RouteIcon },
      { to: '/staff/mall', label: 'BeCoolBox Mall', desc: 'View official stock', icon: TagIcon },
      { to: '/referral', label: 'Referral Poster', desc: 'Print your QR poster', icon: ShareIcon },
    ],
    rider: [
      { to: '/rider', label: 'My Route', desc: 'Batch deliveries today', icon: RouteIcon },
      { to: '/rider/deliveries', label: 'Deliveries', desc: 'Assigned doorstep orders', icon: PackageIcon },
      { to: '/rider/wallet', label: 'Wallet', desc: 'COD & earnings', icon: MapPinIcon },
    ],
    customer: [
      { to: '/market', label: 'Shop Local', desc: 'Browse merchant goods', icon: TagIcon },
      { to: '/track', label: 'Track Parcel', desc: 'Live 3-marker map', icon: MapPinIcon },
      { to: '/delivery-cost', label: 'Delivery Fee', desc: 'Estimate doorstep rate', icon: MapPinIcon },
      { to: '/suki', label: 'Suki Points', desc: 'Balance & redeem', icon: StarIcon },
    ],
    merchant: [
      { to: '/merchant/products', label: 'My Products', desc: 'Upload & manage goods', icon: PackageIcon },
      { to: '/merchant/profile', label: 'My Profile', desc: 'Documents & address', icon: StarIcon },
      { to: '/market', label: 'Shop', desc: 'Browse the marketplace', icon: TagIcon },
      { to: '/suki', label: 'Suki Points', desc: 'Earn & redeem supplies', icon: StarIcon },
    ],
    provider: [
      { to: '/delivery-cost', label: 'Delivery Fee', desc: 'Estimate rates', icon: TagIcon },
      { to: '/track', label: 'Track', desc: 'Follow shipments', icon: MapPinIcon },
    ],
    admin: [
      { to: '/admin/merchants', label: 'Verify Merchants', desc: 'Approve & reject queue', icon: ScanIcon },
      { to: '/admin/merchant-list', label: 'All Merchants', desc: 'Manage & activate', icon: PackageIcon },
      { to: '/admin/riders', label: 'Riders', desc: 'Manage delivery riders', icon: RouteIcon },
      { to: '/admin/mall', label: 'BeCoolBox Mall', desc: 'Manage flagship store', icon: TagIcon },
      { to: '/staff/dispatch', label: 'Dispatch', desc: 'Assign deliveries + sales', icon: MapPinIcon },
    ],
  }[user?.role] || [];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-bayan-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-white/60 text-sm uppercase tracking-wider font-bold">{Greeting()},</p>
          <h2 className="text-3xl font-black tracking-tight mt-1 gradient-text">{user?.name?.split(' ')[0]}</h2>
          <p className="text-white/75 text-sm mt-1.5">
            {user?.role === 'staff' && 'Scan inbound parcels, reconcile inventory, and release with OTP.'}
            {user?.role === 'rider' && 'Your prepaid wallet locks COD. Follow your batch route.'}
            {user?.role === 'customer' && 'Track your parcels in real time and earn Suki points.'}
            {user?.role === 'merchant' && 'Ship consolidated returns and earn points for supplies.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 bg-ink-200 rounded-2xl animate-pulse-soft" />
          <div className="h-24 bg-ink-200 rounded-2xl animate-pulse-soft" />
          <div className="h-24 bg-ink-200 rounded-2xl animate-pulse-soft" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-3 gap-3">
          {user?.role === 'staff' && (
            <>
              <StatCard label="In hub" value={data.current} sub={data.hub?.name} accent />
              <StatCard label="Capacity" value={`${Math.round((data.current / data.capacity) * 100)}%`} />
              <StatCard label="Limit" value={data.capacity} />
            </>
          )}
          {user?.role === 'rider' && (
            <>
              <StatCard label="Active batches" value={data.activeCount} accent />
              <StatCard label="Total today" value={data.batches.length} />
              <StatCard label="Wallet" value={`₱${Number(data.wallet ?? 0).toLocaleString()}`} />
            </>
          )}
          {(user?.role === 'customer' || user?.role === 'merchant') && (
            <>
              <StatCard label="Suki balance" value={data.loyalty} accent />
              <StatCard label="Status" value="Active" />
              <StatCard label="Role" value={user.role} />
            </>
          )}
        </div>
      ) : (
        <div className="text-center text-sm text-ink-400 py-2">Connect to load your dashboard.</div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="card p-4 flex items-start gap-3 hover:shadow-lift transition group">
              <span className="w-10 h-10 rounded-2xl bg-bayan-50 text-bayan-600 flex items-center justify-center shrink-0">
                <a.icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-ink-800 group-hover:text-bayan-700 transition">{a.label}</span>
                <span className="block text-xs text-ink-400 mt-0.5">{a.desc}</span>
              </span>
              <ArrowRightIcon className="w-4 h-4 text-ink-300 mt-1 group-hover:translate-x-0.5 group-hover:text-bayan-500 transition" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity for staff */}
      {user?.role === 'staff' && data?.recent?.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3">Recently scanned</h3>
          <div className="space-y-2.5">
            {data.recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-bayan-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{p.tracking_number}</div>
                  <div className="text-xs text-ink-400 truncate">{p.recipient_name} · {p.recipient_phone}</div>
                </div>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
