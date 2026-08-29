import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import {
  HomeIcon, MapPinIcon, StarIcon, WalletIcon, ScanIcon,
  PackageIcon, RouteIcon, ShareIcon, TagIcon, LogoutIcon, BellIcon, CartIcon,
} from './icons.jsx';
import { useToast } from './ui.jsx';
import NotificationsBell from './NotificationsBell.jsx';

const BUYER_ROLES = ['customer', 'merchant', 'admin'];

function tabsFor(role) {
  const base = [{ to: '/', label: 'Shop', icon: HomeIcon }];
  const dash = { to: '/', label: 'Dashboard', icon: HomeIcon };
  const cart = { to: '/cart', label: 'Cart', icon: CartIcon, cart: true };
  const onSale = { to: '/?on_sale=1', label: 'Deals', icon: TagIcon };
  const affiliate = { to: '/affiliate', label: 'Affiliate', icon: ShareIcon };
  const map = {
    guest: [base[0]],
    admin: [
      dash,
      { to: '/admin/merchant-list', label: 'Merchants', icon: PackageIcon },
      { to: '/admin/riders', label: 'Riders', icon: RouteIcon },
      { to: '/admin/settings', label: 'Settings', icon: StarIcon },
      { to: '/admin/ads', label: 'Ads', icon: TagIcon },
      { to: '/admin/finance', label: 'Finance', icon: WalletIcon },
    ],
    staff: [
      dash,
      { to: '/hub', label: 'Scan', icon: ScanIcon },
      { to: '/hub/inventory', label: 'Inventory', icon: PackageIcon },
      { to: '/staff/dispatch', label: 'Dispatch', icon: RouteIcon },
      { to: '/staff/mall', label: 'Mall', icon: TagIcon },
      { to: '/staff/finance', label: 'Finance', icon: WalletIcon },
    ],
    rider: [
      dash,
      { to: '/rider', label: 'Route', icon: RouteIcon },
      { to: '/rider/deliveries', label: 'Deliveries', icon: PackageIcon },
      { to: '/rider/wallet', label: 'Wallet', icon: WalletIcon },
      affiliate,
    ],
    merchant: [
      dash,
      affiliate,
      cart,
      { to: '/merchant/ads', label: 'Ads', icon: ShareIcon },
      { to: '/merchant/orders', label: 'Orders', icon: PackageIcon },
    ],
    customer: [
      ...base,
      cart,
      affiliate,
      { to: '/orders', label: 'Orders', icon: PackageIcon },
      { to: '/points-shop', label: 'Points', icon: StarIcon },
      { to: '/bookings', label: 'Bookings', icon: StarIcon },
    ],
    provider: [
      ...base,
      { to: '/provider/profile', label: 'Profile', icon: StarIcon },
      { to: '/provider/jobs', label: 'Jobs', icon: PackageIcon },
      affiliate,
      { to: '/delivery-cost', label: 'Delivery', icon: TagIcon },
    ],
  };
  return (map[role] || base).slice(0, 6);
}

export default function Shell({ user, online, queueCount, demo, onRoleChange, children, onLogout }) {
  const notify = useToast();
  const navigate = useNavigate();
  const tabs = tabsFor(user?.role || 'guest');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user || !BUYER_ROLES.includes(user.role)) return;
    let active = true;
    const load = () =>
      client
        .get('/cart')
        .then((res) => {
          if (active) setCartCount(res.data.items.reduce((s, i) => s + Number(i.quantity), 0));
        })
        .catch(() => {});
    load();
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const logout = () => {
    onLogout();
    notify('Signed out.');
  };

  return (
    <div className="min-h-screen bg-ink-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-ink-900 text-white shadow-lift-dark">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/beboolbox-logo.png"
                alt="BayanBox"
                className="h-8 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="hidden sm:block text-white/80 font-semibold text-sm">{user.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-bayan-600 text-white text-[10px] font-bold uppercase tracking-wide">
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
                  {demo && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-full bg-amber-400 text-amber-950">
                      Demo
                    </span>
                  )}
                  <NotificationsBell user={user} />
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${
                      online ? 'bg-white/15' : 'bg-amber-500/90 text-amber-950'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse-soft' : 'bg-amber-900'}`} />
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
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-2xl transition"
                >
                  Login / Signup
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 pt-4 pb-28 animate-fade-up">{children}</main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
        <div className="max-w-5xl mx-auto grid grid-cols-6">
          {tabs.map(({ to, label, icon: Icon, cart }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${
                  isActive ? 'text-bayan-600' : 'text-ink-400 hover:text-ink-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                    {cart && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-bayan-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
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
