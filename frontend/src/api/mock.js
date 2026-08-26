/**
 * BayanBox demo mode — in-memory mock API.
 *
 * Lets you explore the full UI/UX locally without the Laravel backend
 * (which needs PHP 8.2+ and is not installed on this machine). Activated via
 * the "Explore demo" button on the Auth screen; toggled in client.js.
 *
 * Swap real API calls by simply clearing localStorage: bayanbox_demo.
 */

const NAGA = { lat: 13.6288, lng: 123.186 };
const SAN_JOSE = { lat: 13.62, lng: 123.183 };

const DEMO_USER = {
  id: 1,
  name: 'Nena Sari-Sari',
  phone: '09170000002',
  role: 'staff',
  affiliate_code: 'NENA01',
  barangay: 'San Jose',
  municipality: 'Naga City',
  status: 'active',
  hub: {
    id: 1,
    name: 'Nena San Jose Sari-Sari',
    address: 'Block 12, San Jose, Naga City',
    barangay: 'San Jose',
    municipality: 'Naga City',
    latitude: NAGA.lat,
    longitude: NAGA.lng,
    referral_code: 'NENA01',
    current_parcel_count: 12,
    capacity_limit: 500,
  },
};

const PARCELS = [
  { id: 1, tracking_number: 'BB-2026-100001', shipper_name: 'J&T Express', recipient_name: 'Juan Dela Cruz', recipient_phone: '09171234567', hub_id: 1, status: 'received_at_hub', otp_code: '482913', cod_amount: 0, delivery_distance_km: 0, calculated_delivery_fee: 0, arrived_at_hub_at: new Date(Date.now() - 2 * 3600e3).toISOString(), updated_at: new Date(Date.now() - 30e3).toISOString() },
  { id: 2, tracking_number: 'BB-2026-100002', shipper_name: 'Flash Express', recipient_name: 'Aling Maria', recipient_phone: '09179876543', hub_id: 1, status: 'received_at_hub', otp_code: '550184', cod_amount: 350, delivery_distance_km: 0, calculated_delivery_fee: 0, arrived_at_hub_at: new Date(Date.now() - 5 * 3600e3).toISOString(), updated_at: new Date(Date.now() - 60e3).toISOString() },
  { id: 3, tracking_number: 'BB-2026-100003', shipper_name: 'Ninja Van', recipient_name: 'Boyet Santos', recipient_phone: '09173334444', hub_id: 1, status: 'out_for_delivery', otp_code: '901277', cod_amount: 0, delivery_distance_km: 2.6, calculated_delivery_fee: 41, arrived_at_hub_at: new Date(Date.now() - 26 * 3600e3).toISOString(), updated_at: new Date(Date.now() - 15 * 60e3).toISOString() },
  { id: 4, tracking_number: 'BB-2026-100004', shipper_name: 'J&T Express', recipient_name: 'Mang Kardo', recipient_phone: '09175556666', hub_id: 1, status: 'delivered', otp_code: '228410', cod_amount: 120, delivery_distance_km: 1.2, calculated_delivery_fee: 35, arrived_at_hub_at: new Date(Date.now() - 50 * 3600e3).toISOString(), picked_up_at: new Date(Date.now() - 6 * 3600e3).toISOString(), delivered_at: new Date(Date.now() - 6 * 3600e3).toISOString(), updated_at: new Date(Date.now() - 6 * 3600e3).toISOString() },
];

const BATCHES = [
  {
    id: 1,
    batch_code: 'BATCH-NGA-041',
    hub_id: 1,
    rider_id: 3,
    barangay: 'San Jose',
    status: 'in_transit',
    created_at: new Date(Date.now() - 3 * 3600e3).toISOString(),
    hub: { id: 1, name: 'Nena San Jose Sari-Sari', address: 'Block 12, San Jose' },
    batch_parcels: [
      { id: 1, delivery_batch_id: 1, parcel_id: 3, sequence: 1, dropoff_status: 'delivered', parcel: { id: 3, tracking_number: 'BB-2026-100003', recipient_name: 'Boyet Santos', recipient_phone: '09173334444', status: 'delivered', destination_address: 'San Jose, Naga City', cod_amount: 0 } },
      { id: 2, delivery_batch_id: 1, parcel_id: 5, sequence: 2, dropoff_status: 'pending', parcel: { id: 5, tracking_number: 'BB-2026-100005', recipient_name: 'Cora Bautista', recipient_phone: '09176667777', status: 'out_for_delivery', destination_address: 'Sta. Cruz, Naga City', cod_amount: 240 } },
      { id: 3, delivery_batch_id: 1, parcel_id: 6, sequence: 3, dropoff_status: 'pending', parcel: { id: 6, tracking_number: 'BB-2026-100006', recipient_name: 'Dindo Ramos', recipient_phone: '09178889999', status: 'out_for_delivery', destination_address: 'Panganiban, Naga City', cod_amount: 0 } },
    ],
  },
];

const WALLET = {
  id: 1,
  user_id: 3,
  wallet_type: 'rider_prepaid',
  balance: '425.00',
  currency: 'PHP',
  ledger_transactions: [
    { id: 9, description: 'COD collected on BB-2026-100003 (replenishes prepaid lock)', amount: 240, direction: 'credit', type: 'cod_settlement', created_at: new Date(Date.now() - 40 * 60e3).toISOString() },
    { id: 8, description: 'Delivery fee rider share — BB-2026-100003', amount: 34.85, direction: 'credit', type: 'delivery_split', created_at: new Date(Date.now() - 40 * 60e3).toISOString() },
    { id: 7, description: 'Wallet top-up via gcash', amount: 150, direction: 'credit', type: 'topup', created_at: new Date(Date.now() - 4 * 3600e3).toISOString() },
    { id: 6, description: 'COD lock for BB-2026-100002', amount: 350, direction: 'debit', type: 'cod_lock', created_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
  ],
};

const LOYALTY = {
  balance: 150,
  ledger: [
    { id: 5, points: 1, type: 'pickup_reward', description: 'Fast pickup reward — BB-2026-100004', balance_after: 150, created_at: new Date(Date.now() - 6 * 3600e3).toISOString() },
    { id: 4, points: 1, type: 'pickup_reward', description: 'Fast pickup reward — BB-2026-100002', balance_after: 149, created_at: new Date(Date.now() - 9 * 3600e3).toISOString() },
    { id: 3, points: -50, type: 'doorstep_upgrade', description: 'Doorstep delivery upgrade — BB-2026-100001 (≤3km)', balance_after: 148, created_at: new Date(Date.now() - 2 * 24 * 3600e3).toISOString() },
    { id: 2, points: 100, type: 'seed', description: 'Welcome Suki points', balance_after: 198, created_at: new Date(Date.now() - 7 * 24 * 3600e3).toISOString() },
  ],
};

const REFERRAL = {
  hub: { id: 1, name: 'Nena San Jose Sari-Sari', address: 'Block 12, San Jose, Naga City', referral_code: 'NENA01' },
  qr_payload: 'http://localhost:3000/r/NENA01',
};

const TRACKING = {
  parcel: {
    id: 3, tracking_number: 'BB-2026-100003', status: 'out_for_delivery', recipient_name: 'Boyet Santos',
    shipper_name: 'Ninja Van', cod_amount: 0, delivery_distance_km: 2.6, calculated_delivery_fee: 41,
    arrived_at_hub_at: new Date(Date.now() - 26 * 3600e3).toISOString(), picked_up_at: null, delivered_at: null,
    destination_address: 'San Jose, Naga City', destination_latitude: SAN_JOSE.lat, destination_longitude: SAN_JOSE.lng,
  },
  origin_hub: { id: 1, name: 'Nena San Jose Sari-Sari', address: 'Block 12, San Jose', latitude: NAGA.lat, longitude: NAGA.lng },
  destination: { address: 'San Jose, Naga City', latitude: SAN_JOSE.lat, longitude: SAN_JOSE.lng },
  rider: { latitude: 13.6252, longitude: 123.1841, is_stale: false, last_seen_label: null, last_seen_at: new Date(Date.now() - 2 * 60e3).toISOString() },
  status_history: [
    { id: 6, status: 'out_for_delivery', note: 'Assigned to batch BATCH-NGA-041', created_at: new Date(Date.now() - 15 * 60e3).toISOString() },
    { id: 5, status: 'received_at_hub', note: 'Receipt confirmed by hub staff.', created_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
    { id: 4, status: 'received_at_hub', note: 'Parcel intake scanned at hub.', created_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
  ],
  eta: { min: 9, max: 16 },
};

function mockResponse(data, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config: {}, isDemo: true };
}

export function isDemoMode() {
  return localStorage.getItem('bayanbox_demo') === '1';
}

export function enterDemoMode() {
  localStorage.setItem('bayanbox_demo', '1');
  localStorage.setItem('bayanbox_user', JSON.stringify(DEMO_USER));
}

export function exitDemoMode() {
  localStorage.removeItem('bayanbox_demo');
  localStorage.removeItem('bayanbox_user');
}

/**
 * Handle a demo request. Returns a promise resolving to a mock axios response,
 * or null if this endpoint has no mock (falls through to the real API).
 */
export function mockRequest(url, method, data) {
  const path = url.replace(/^\/api/, '');
  const lower = method.toLowerCase();

  // Auth
  if (path === '/auth/me' && lower === 'get') return Promise.resolve(mockResponse({ user: DEMO_USER, loyalty_balance: 150 }));
  if (path === '/auth/logout' && lower === 'post') return Promise.resolve(mockResponse({ message: 'Logged out.' }));

  // Hub
  if (path === '/hub/inventory' && lower === 'get') {
    return Promise.resolve(mockResponse({
      hub: DEMO_USER.hub,
      parcels: { data: PARCELS, total: PARCELS.length, per_page: 20, current_page: 1 },
      current_parcel_count: DEMO_USER.hub.current_parcel_count,
      capacity_limit: DEMO_USER.hub.capacity_limit,
    }));
  }
  if (path === '/hub/intake' && lower === 'post') {
    const p = { ...data, id: 99, status: 'received_at_hub', otp_code: '111222', arrived_at_hub_at: new Date().toISOString() };
    return Promise.resolve(mockResponse({ message: 'Parcel intake registered.', parcel: p }, 201));
  }
  if (/^\/hub\/parcels\/[^/]+\/reconcile$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Receipt confirmed. OTP SMS dispatched.' }));
  }
  if (/^\/hub\/parcels\/[^/]+\/release$/.test(path) && lower === 'post') {
    if (data?.otp_code === '482913' || data?.otp_code === '550184') {
      return Promise.resolve(mockResponse({ message: 'Parcel released to customer.' }));
    }
    return Promise.resolve(mockResponse({ message: 'Invalid or expired OTP.' }, 422));
  }
  if (/^\/hub\/parcels\/[^/]+\/return$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Parcel marked as returned.' }));
  }
  if (path === '/hub/affiliate/referral-qr' && lower === 'get') {
    return Promise.resolve(mockResponse(REFERRAL));
  }

  // Rider
  if (path === '/rider/batches' && lower === 'get') return Promise.resolve(mockResponse({ data: BATCHES }));
  if (path === '/rider/telemetry' && lower === 'post') return Promise.resolve(mockResponse({ message: 'Telemetry recorded.', count: data?.points?.length || 1 }));
  if (path === '/rider/wallet' && lower === 'get') return Promise.resolve(mockResponse({ wallet: WALLET, balance: WALLET.balance, recent_transactions: WALLET.ledger_transactions }));
  if (/^\/rider\/batches\/[^/]+\/parcels\/\d+\/deliver$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Marked as delivered.' }));
  }
  if (/^\/wallets\/[^/]+\/topup$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Wallet credited.', transaction: { id: 999 } }));
  }
  if (/^\/wallets\/[^/]+\/ledger$/.test(path) && lower === 'get') {
    return Promise.resolve(mockResponse({ wallet_id: 1, balance: WALLET.balance, ledger: { data: WALLET.ledger_transactions } }));
  }

  // Customer
  if (/^\/track\//.test(path) && lower === 'get') return Promise.resolve(mockResponse(TRACKING));
  if (path === '/loyalty' && lower === 'get') return Promise.resolve(mockResponse(LOYALTY));
  if (path === '/delivery/calculate' && lower === 'post') {
    const a = data?.dest_lat ?? SAN_JOSE.lat;
    const b = data?.dest_lng ?? SAN_JOSE.lng;
    const dist = Number((Math.hypot((a - NAGA.lat) * 110.9, (b - NAGA.lng) * 100) / 1.42).toFixed(2));
    const excess = Math.max(0, dist - 2);
    const total = Math.round((35 + excess * 10) * 1);
    return Promise.resolve(mockResponse({
      distance_km: dist,
      duration_seconds: dist / 25 * 3600,
      total_delivery_fee: total,
      platform_share: Math.round(total * 0.15 * 100) / 100,
      rider_share: Math.round(total * 0.85 * 100) / 100,
      applied_surge: 1,
      base_fare: 35,
      per_km_surcharge: Math.round(excess * 10 * 100) / 100,
      eta_minutes: Math.max(1, Math.round(dist / 25 * 60 * 1.3)),
      eta_max_minutes: Math.max(4, Math.round(dist / 25 * 60 * 1.3) + 7),
      provider: 'demo',
      cached: false,
    }));
  }

  // Sync
  if (path === '/sync/offline-queue' && lower === 'post') {
    return Promise.resolve(mockResponse({ results: (data?.actions || []).map((a) => ({ action_id: a.action_id, status: 'replayed' })) }));
  }

  return null;
}
