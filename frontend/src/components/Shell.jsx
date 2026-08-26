import { NavLink } from 'react-router-dom';
import {
  HomeIcon, MapPinIcon, StarIcon, WalletIcon, ScanIcon,
  PackageIcon, RouteIcon, ShareIcon, TagIcon, LogoutIcon, BellIcon,
} from './icons.jsx';
import { useToast } from './ui.jsx';

const ROLE_LABEL = {
  admin: 'Platform Admin',
  staff: 'Hub Agent',
  rider: 'Rider',
  merchant: 'Merchant',
  customer: 'Customer',
  provider: 'Skilled Worker',
};

function tabsFor(role) {
  const base = [{ to: '/', label: 'Home', icon: HomeIcon }];
  const map = {
    staff: [
      ...base,
      { to: '/hub', label: 'Scan', icon: ScanIcon },
      { to: '/hub/inventory', label: 'Inventory', icon: PackageIcon },
      { to: '/referral', label: 'Referral', icon: ShareIcon },
      { to: '/suki', label: 'Suki', icon: StarIcon },
    ],
    rider: [
      ...base,
      { to: '/rider', label: 'Route', icon: RouteIcon },
      { to: '/rider/wallet', label: 'Wallet', icon: WalletIcon },
      { to: '/track', label: 'Track', icon: MapPinIcon },
    ],
    merchant: [
      ...base,
      { to: '/delivery-cost', label: 'Delivery', icon: TagIcon },
      { to: '/track', label: 'Track', icon: MapPinIcon },
      { to: '/suki', label: 'Suki', icon: StarIcon },
    ],
    customer: [
      ...base,
      { to: '/track', label: 'Track', icon: MapPinIcon },
      { to: '/delivery-cost', label: 'Delivery', icon: TagIcon },
      { to: '/suki', label: 'Suki', icon: StarIcon },
    ],
    provider: [
      ...base,
      { to: '/track', label: 'Track', icon: MapPinIcon },
      { to: '/delivery-cost', label: 'Delivery', icon: TagIcon },
    ],
  };
  return (map[role] || base).slice(0, 5);
}

export default function Shell({ user, online, queueCount, demo, onRoleChange, children, onLogout }) {
  const notify = useToast();
  const tabs = tabsFor(user?.role || 'customer');

  const logout = () => {
    onLogout();
    notify('Signed out.');
  };

  return (
    <div className="min-h-screen bg-ink-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gradient-to-br from-bayan-700 via-bayan-600 to-bayan-500 text-white shadow-lg">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-black text-lg">
                B
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none">
                  Bayan<span className="text-amber-400">Box</span>
                </h1>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {user ? `${ROLE_LABEL[user.role] || user.role}` : 'Provincial Last-Mile OS'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {demo && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-full bg-amber-400 text-amber-950">
                  Demo
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${
                  online ? 'bg-white/15' : 'bg-amber-500/90 text-amber-950'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-300 animate-pulse-soft' : 'bg-amber-900'}`} />
                {online ? 'Online' : 'Offline'}
                {queueCount > 0 && <span className="px-1 bg-white text-bayan-700 rounded-full text-[9px]">{queueCount}</span>}
              </span>
              <button
                onClick={logout}
                title="Sign out"
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {user && (
            <div className="mt-2.5 flex items-center gap-2 text-xs">
              <span className="text-white/80 font-semibold">{user.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wide">
                {user.role}
              </span>
              {demo && (
                <select
                  value={user.role}
                  onChange={(e) => {
                    const updated = { ...user, role: e.target.value };
                    localStorage.setItem('bayanbox_user', JSON.stringify(updated));
                    onRoleChange?.(updated);
                  }}
                  className="bg-white/20 text-white text-[10px] font-bold rounded-lg px-2 py-1 border border-white/20 outline-none cursor-pointer"
                >
                  <option value="staff" className="text-ink-800">staff</option>
                  <option value="rider" className="text-ink-800">rider</option>
                  <option value="customer" className="text-ink-800">customer</option>
                  <option value="merchant" className="text-ink-800">merchant</option>
                  <option value="provider" className="text-ink-800">provider</option>
                </select>
              )}
              <button
                className="ml-auto flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white transition"
                onClick={() => notify('Notifications coming soon.')}
              >
                <BellIcon className="w-3.5 h-3.5" /> Alerts
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 animate-fade-up">{children}</main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
        <div className="max-w-5xl mx-auto grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${
                  isActive ? 'text-bayan-600' : 'text-ink-400 hover:text-ink-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
