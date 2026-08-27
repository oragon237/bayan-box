import { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import client from './api/client.js';
import { flushQueue, queueCount } from './services/offlineQueue.js';
import { ToastProvider } from './components/ui.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Shell from './components/Shell.jsx';
import Auth from './pages/Auth.jsx';

import HubScanner from './pages/hub/HubScanner.jsx';
import HubInventory from './pages/hub/HubInventory.jsx';
import RiderBatches from './pages/rider/RiderBatches.jsx';
import RiderWallet from './pages/rider/RiderWallet.jsx';
import CustomerTracking from './pages/customer/CustomerTracking.jsx';
import CustomerBookings from './pages/customer/CustomerBookings.jsx';
import MyOrders from './pages/customer/MyOrders.jsx';
import SukiPoints from './pages/customer/SukiPoints.jsx';
import DeliveryCostPreview from './components/DeliveryCostPreview.jsx';
import ReferralQR from './pages/affiliate/ReferralQR.jsx';
import AffiliateDashboard from './pages/affiliate/AffiliateDashboard.jsx';
import Marketplace from './pages/marketplace/Marketplace.jsx';
import ProductDetail from './pages/marketplace/ProductDetail.jsx';
import ProvidersList from './pages/marketplace/ProvidersList.jsx';
import HireProvider from './pages/marketplace/HireProvider.jsx';
import MerchantProducts from './pages/merchant/MerchantProducts.jsx';
import MerchantOrders from './pages/merchant/MerchantOrders.jsx';
import MerchantProfile from './pages/merchant/MerchantProfile.jsx';
import AdminMerchants from './pages/admin/AdminMerchants.jsx';
import AdminMerchantList from './pages/admin/AdminMerchantList.jsx';
import AdminMall from './pages/admin/AdminMall.jsx';
import AdminRiders from './pages/admin/AdminRiders.jsx';
import AdminAffiliates from './pages/admin/AdminAffiliates.jsx';
import StaffMall from './pages/staff/StaffMall.jsx';
import StaffDispatch from './pages/staff/StaffDispatch.jsx';
import RiderDeliveries from './pages/rider/RiderDeliveries.jsx';
import ProviderProfile from './pages/provider/ProviderProfile.jsx';
import ProviderJobs from './pages/provider/ProviderJobs.jsx';

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bayanbox_user'));
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  // Verify stored token with the backend (skip in demo mode)
  useEffect(() => {
    const demo = localStorage.getItem('bayanbox_demo') === '1';
    const token = localStorage.getItem('bayanbox_token');
    if (demo) {
      try {
        setUser(JSON.parse(localStorage.getItem('bayanbox_user')));
      } catch {
        setUser(null);
      }
      setBooting(false);
      return;
    }
    if (!token) {
      setBooting(false);
      return;
    }
    client
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('bayanbox_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('bayanbox_token');
        localStorage.removeItem('bayanbox_user');
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  // Connectivity + offline queue flush (FR-OFF-002)
  useEffect(() => {
    const sync = async () => {
      const pending = await flushQueue(client);
      if (pending) {
        const remaining = await queueCount();
        setQueueSize(remaining);
      }
    };
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen bg-ink-100 flex items-center justify-center">
        <div className="text-center text-ink-400 animate-pulse-soft">Loading BayanBox…</div>
      </div>
    );
  }

  const logout = () => {
    client.post('/auth/logout').catch(() => {});
    localStorage.removeItem('bayanbox_token');
    localStorage.removeItem('bayanbox_user');
    localStorage.removeItem('bayanbox_demo');
    setUser(null);
  };

  return (
    <ToastProvider>
      <Shell
        user={user}
        online={online}
        queueCount={queueSize}
        demo={localStorage.getItem('bayanbox_demo') === '1'}
        onRoleChange={(u) => setUser({ ...u })}
        onLogout={logout}
      >
        <Routes>
          <Route
            path="*"
            element={
              <ErrorBoundary>
                <MainRoutes user={user} onAuth={(u) => { setUser(u); navigate('/'); }} />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Shell>
    </ToastProvider>
  );
}

function MainRoutes({ user, onAuth }) {
  return (
    <Routes>
      <Route path="/" element={<Marketplace user={user} />} />
      <Route path="/product/:id" element={<ProductDetail user={user} />} />
      <Route path="/providers" element={<ProvidersList user={user} />} />
      <Route path="/hire/:id" element={<HireProvider user={user} />} />
      <Route path="/login" element={<Auth onAuth={onAuth} />} />

      {user && (
        <>
          <Route path="/hub" element={<HubScanner user={user} />} />
          <Route path="/hub/inventory" element={<HubInventory user={user} />} />
          <Route path="/rider" element={<RiderBatches user={user} />} />
          <Route path="/rider/wallet" element={<RiderWallet user={user} />} />
          <Route path="/rider/deliveries" element={<RiderDeliveries user={user} />} />
          <Route path="/track" element={<CustomerTracking />} />
          <Route path="/track/:tracking" element={<CustomerTracking />} />
          <Route path="/bookings" element={<CustomerBookings user={user} />} />
          <Route path="/suki" element={<SukiPoints user={user} />} />
          <Route path="/delivery-cost" element={<DeliveryCostPreview user={user} />} />
          <Route path="/referral" element={<ReferralQR user={user} />} />
          <Route path="/merchant/products" element={<MerchantProducts user={user} />} />
          <Route path="/merchant/orders" element={<MerchantOrders user={user} />} />
          <Route path="/merchant/profile" element={<MerchantProfile user={user} />} />
          <Route path="/admin/merchants" element={<AdminMerchants user={user} />} />
          <Route path="/admin/merchant-list" element={<AdminMerchantList user={user} />} />
          <Route path="/admin/mall" element={<AdminMall user={user} />} />
          <Route path="/admin/riders" element={<AdminRiders user={user} />} />
          <Route path="/staff/mall" element={<StaffMall user={user} />} />
          <Route path="/staff/dispatch" element={<StaffDispatch user={user} />} />
          <Route path="/provider/profile" element={<ProviderProfile user={user} />} />
          <Route path="/provider/jobs" element={<ProviderJobs user={user} />} />
          <Route path="/affiliate" element={<AffiliateDashboard user={user} />} />
          <Route path="/admin/affiliates" element={<AdminAffiliates user={user} />} />
          <Route path="/orders" element={<MyOrders user={user} />} />
        </>
      )}

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
