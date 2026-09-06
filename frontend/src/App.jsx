import { safeReturnTo } from './lib/purchaseJourney.js';
import { track, conversionContext } from './services/conversion.js';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import client from './api/client.js';
import { flushQueue, queueCount } from './services/offlineQueue.js';
import { Spinner, ToastProvider } from './components/ui.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Shell from './components/Shell.jsx';
const Auth = lazy(() => import('./pages/Auth.jsx'));

const HubScanner = lazy(() => import('./pages/hub/HubScanner.jsx'));
const HubInventory = lazy(() => import('./pages/hub/HubInventory.jsx'));
const RiderBatches = lazy(() => import('./pages/rider/RiderBatches.jsx'));
const RiderWallet = lazy(() => import('./pages/rider/RiderWallet.jsx'));
const CustomerTracking = lazy(() => import('./pages/customer/CustomerTracking.jsx'));
const OrderTracking = lazy(() => import('./pages/customer/OrderTracking.jsx'));
const CustomerBookings = lazy(() => import('./pages/customer/CustomerBookings.jsx'));
const PointsShop = lazy(() => import('./pages/customer/PointsShop.jsx'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders.jsx'));
const CartPage = lazy(() => import('./pages/cart/CartPage.jsx'));
const SukiPoints = lazy(() => import('./pages/customer/SukiPoints.jsx'));
const DeliveryCostPreview = lazy(() => import('./components/DeliveryCostPreview.jsx'));
const ReferralQR = lazy(() => import('./pages/affiliate/ReferralQR.jsx'));
const AffiliateDashboard = lazy(() => import('./pages/affiliate/AffiliateDashboard.jsx'));
const HomepageV2 = lazy(() => import('./pages/marketplace/HomepageV2.jsx'));
const Pabili = lazy(() => import('./pages/customer/Pabili.jsx'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage.jsx'));
const SearchPage = lazy(() => import('./pages/marketplace/SearchPage.jsx'));
const MerchantStorefront = lazy(() => import('./pages/marketplace/MerchantStorefront.jsx'));
const ProductDetail = lazy(() => import('./pages/marketplace/ProductDetail.jsx'));
const ProviderDirectory = lazy(() => import('./pages/marketplace/ProviderDirectory.jsx'));
const HireProvider = lazy(() => import('./pages/marketplace/HireProvider.jsx'));
const MerchantProducts = lazy(() => import('./pages/merchant/MerchantProducts.jsx'));
const MerchantDashboard = lazy(() => import('./pages/merchant/MerchantDashboard.jsx'));
const MerchantReports = lazy(() => import('./pages/merchant/MerchantReports.jsx'));
const MerchantPayouts = lazy(() => import('./pages/merchant/MerchantPayouts.jsx'));
const MerchantAds = lazy(() => import('./pages/merchant/MerchantAds.jsx'));
const MerchantOrders = lazy(() => import('./pages/merchant/MerchantOrders.jsx'));
const MerchantProfile = lazy(() => import('./pages/merchant/MerchantProfile.jsx'));
const AdminMerchants = lazy(() => import('./pages/admin/AdminMerchants.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminMerchantList = lazy(() => import('./pages/admin/AdminMerchantList.jsx'));
const AdminMall = lazy(() => import('./pages/admin/AdminMall.jsx'));
const AdminRiders = lazy(() => import('./pages/admin/AdminRiders.jsx'));
const AdminAffiliates = lazy(() => import('./pages/admin/AdminAffiliates.jsx'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners.jsx'));
const AdminAds = lazy(() => import('./pages/admin/AdminAds.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance.jsx'));
const StaffMall = lazy(() => import('./pages/staff/StaffMall.jsx'));
const StaffMallOrders = lazy(() => import('./pages/staff/StaffMallOrders.jsx'));
const StaffFinance = lazy(() => import('./pages/staff/StaffFinance.jsx'));
const StaffDispatch = lazy(() => import('./pages/staff/StaffDispatch.jsx'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard.jsx'));
const RiderDeliveries = lazy(() => import('./pages/rider/RiderDeliveries.jsx'));
const RiderProfile = lazy(() => import('./pages/rider/RiderProfile.jsx'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile.jsx'));
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard.jsx'));
const ProviderProfile = lazy(() => import('./pages/provider/ProviderProfile.jsx'));
const ProviderJobs = lazy(() => import('./pages/provider/ProviderJobs.jsx'));

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    const context = conversionContext();
    if (!/^\/(?:$|search$|mall$|product\/|store\/)/.test(location.pathname)) return;
    if (user && !['customer', 'provider'].includes(user.role)) return;
    try {
      if (context && !sessionStorage.getItem('habi_visit_' + context.session_id)) {
        track('visit');
        sessionStorage.setItem('habi_visit_' + context.session_id, '1');
      }
    } catch { /* Measurement is optional when browser storage is unavailable. */ }
  }, [location.pathname, user?.role]);

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
        <div className="text-center text-ink-400 animate-pulse-soft">Loading HABI…</div>
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
                <Suspense fallback={<div role="status" aria-label="Loading page" className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
                <MainRoutes user={user} onAuth={(u) => { setUser(u); navigate(safeReturnTo(new URLSearchParams(location.search).get('return_to')), { replace: true }); }} />
                </Suspense>
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
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/pabili" element={<Pabili user={user} />} />
      <Route path="/" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : user?.role === 'staff' ? <StaffDashboard user={user} /> : user?.role === 'merchant' ? <MerchantDashboard user={user} /> : user?.role === 'rider' ? <RiderDashboard user={user} /> : <HomepageV2 user={user} />} />
      <Route path="/rider/dashboard" element={<RiderDashboard user={user} />} />
      <Route path="/search" element={<SearchPage user={user} />} />
      <Route path="/mall" element={<SearchPage user={user} />} />
      <Route path="/store/:id" element={<MerchantStorefront user={user} />} />
      <Route path="/marketplace/category/:slug" element={<SearchPage user={user} />} />
      <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
      <Route path="/staff/dashboard" element={<StaffDashboard user={user} />} />
      <Route path="/product/:id" element={<ProductDetail user={user} />} />
<Route path="/providers" element={<ProviderDirectory user={user} />} />
          <Route path="/hire/:id" element={<HireProvider user={user} />} />
      <Route path="/login" element={<Auth onAuth={onAuth} />} />
      {/* QR referral short-link — /r/{code} → /login?ref={code} */}
      <Route path="/r/:code" element={<ReferralRedirect />} />

      {user && (
        <>
          <Route path="/hub" element={<HubScanner user={user} />} />
          <Route path="/hub/inventory" element={<HubInventory user={user} />} />
          <Route path="/rider" element={<RiderBatches user={user} />} />
          <Route path="/rider/wallet" element={<RiderWallet user={user} />} />
          <Route path="/rider/deliveries" element={<RiderDeliveries user={user} />} />
          <Route path="/rider/profile" element={<RiderProfile user={user} />} />
          <Route path="/customer/profile" element={<CustomerProfile user={user} />} />
          <Route path="/track" element={<CustomerTracking />} />
          <Route path="/track/:tracking" element={<CustomerTracking />} />
          <Route path="/orders/:id/track" element={<OrderTracking />} />
          <Route path="/bookings" element={<CustomerBookings user={user} />} />
          <Route path="/suki" element={<SukiPoints user={user} />} />
          <Route path="/delivery-cost" element={<DeliveryCostPreview user={user} />} />
          <Route path="/referral" element={<ReferralQR user={user} />} />
          <Route path="/merchant/products" element={<MerchantProducts user={user} />} />
          <Route path="/merchant/orders" element={<MerchantOrders user={user} />} />
          <Route path="/merchant/ads" element={<MerchantAds user={user} />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard user={user} />} />
          <Route path="/merchant/reports" element={<MerchantReports user={user} />} />
          <Route path="/merchant/settings/payouts" element={<MerchantPayouts user={user} />} />
          <Route path="/merchant/profile" element={<MerchantProfile user={user} />} />
          <Route path="/admin/merchants" element={<AdminMerchants user={user} />} />
          <Route path="/admin/merchant-list" element={<AdminMerchantList user={user} />} />
          <Route path="/admin/mall" element={<AdminMall user={user} />} />
          <Route path="/admin/riders" element={<AdminRiders user={user} />} />
          <Route path="/staff/mall" element={<StaffMall user={user} />} />
          <Route path="/staff/mall/orders" element={<StaffMallOrders user={user} />} />
          <Route path="/staff/dispatch" element={<StaffDispatch user={user} />} />
          <Route path="/provider/profile" element={<ProviderProfile user={user} />} />
          <Route path="/provider/jobs" element={<ProviderJobs user={user} />} />
          <Route path="/affiliate" element={<AffiliateDashboard user={user} />} />
          <Route path="/admin/affiliates" element={<AdminAffiliates user={user} />} />
          <Route path="/admin/banners" element={<AdminBanners user={user} />} />
          <Route path="/admin/ads" element={<AdminAds user={user} />} />
          <Route path="/admin/settings" element={<AdminSettings user={user} />} />
          <Route path="/admin/finance" element={<AdminFinance user={user} />} />
          <Route path="/staff/finance" element={<StaffFinance user={user} />} />
          <Route path="/orders" element={<MyOrders user={user} />} />
          <Route path="/points-shop" element={<PointsShop user={user} />} />
          <Route path="/cart" element={<CartPage user={user} />} />
        </>
      )}

      <Route path="*" element={<LoginRedirect user={user} />} />
    </Routes>
  );
}

/**
 * Referral short-link handler — /r/{code} → /login?ref={code}
 * (the same payload encoded on hub poster QR codes).
 */
function ReferralRedirect() {
  const { code } = useParams();
  return <Navigate to={`/login?ref=${code}`} replace />;
}

function LoginRedirect({ user }) {
  const location = useLocation();
  const destination = safeReturnTo(location.pathname + location.search);
  return <Navigate to={user ? '/' : `/login?return_to=${encodeURIComponent(destination)}`} replace />;
}
