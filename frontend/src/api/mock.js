/**
 * HABI demo mode — in-memory mock API.
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

const PRODUCTS = [
  { id: 1, merchant_id: 4, name: 'Fresh Sili (250g)', description: 'Local fresh chili from Bicol farms.', price: '40.00', stock: 100, suki_points_award: 2, affiliate_percentage: '5.00', image_url: null, category: 'Fresh Produce', status: 'active', merchant: { id: 4, name: 'Aling Maria Merch' } },
  { id: 2, merchant_id: 4, name: 'Home-baked Pan de Sal', description: 'Warm pandesal, fresh daily.', price: '25.00', stock: 60, suki_points_award: 1, affiliate_percentage: '3.00', image_url: null, category: 'Home Cooks', status: 'active', merchant: { id: 4, name: 'Aling Maria Merch' } },
  { id: 3, merchant_id: 4, name: 'Abaca Tote Bag', description: 'Handwoven abaca tote from local artisans.', price: '180.00', stock: 30, suki_points_award: 5, affiliate_percentage: '10.00', image_url: null, category: 'Local Crafts', status: 'active', merchant: { id: 4, name: 'Aling Maria Merch' } },
  { id: 4, merchant_id: 4, name: 'Bicol Express Bagoong', description: 'Fiery bagoong for authentic Bicol express.', price: '95.00', stock: 45, suki_points_award: 3, affiliate_percentage: '0.00', image_url: null, category: 'Fresh Produce', status: 'active', merchant: { id: 4, name: 'Aling Maria Merch' } },
  { id: 11, merchant_id: 1, name: 'Official HABI Tumbler', description: 'Exclusive tumbler — redeem with Suki Points only.', price: '0.00', points_price: 300, points_only: true, stock: 25, suki_points_award: 0, affiliate_percentage: '0.00', image_url: null, category: 'Points Shop', status: 'active', is_official_mall: true, merchant: { id: 1, name: 'HABI Admin' } },
];

// Keep Mall stock outside mockRequest so additions survive subsequent admin,
// staff, and customer requests during a demo session.
const MALL_PRODUCTS = [
  { id: 201, merchant_id: 1, name: 'Bulk Bubble Wrap (50m)', description: 'Official HABI Mall item', price: '350.00', stock: 40, suki_points_award: 8, affiliate_percentage: '3.00', image_url: null, images: [], category: 'Packaging', status: 'active', availability: 'available', is_official_mall: true, merchant: { id: 1, name: 'HABI Mall' } },
  { id: 202, merchant_id: 1, name: 'Thermal Label Rolls (x100)', description: 'Official HABI Mall item', price: '220.00', stock: 80, suki_points_award: 5, affiliate_percentage: '0.00', image_url: null, images: [], category: 'Packaging', status: 'active', availability: 'available', is_official_mall: true, merchant: { id: 1, name: 'HABI Mall' } },
  { id: 203, merchant_id: 1, name: 'Cardboard Mailers (x50)', description: 'Official HABI Mall item', price: '480.00', stock: 25, suki_points_award: 10, affiliate_percentage: '5.00', image_url: null, images: [], category: 'Packaging', status: 'active', availability: 'available', is_official_mall: true, merchant: { id: 1, name: 'HABI Mall' } },
  { id: 204, merchant_id: 1, name: 'Bicol Pili Nuts (Official)', description: 'Official HABI Mall item', price: '145.00', stock: 60, suki_points_award: 4, affiliate_percentage: '8.00', image_url: null, images: [], category: 'Provincial Goods', status: 'active', availability: 'available', is_official_mall: true, merchant: { id: 1, name: 'HABI Mall' } },
];

const MALL_ORDERS = [
  { id: 16, total_amount: '495.00', payment_method: 'gcash', delivery_state: 'pending_merchant', customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, items: [{ id: 16, quantity: 1, product: { id: 201, name: 'Bulk Bubble Wrap (50m)', merchant_id: 1, is_official_mall: true } }, { id: 17, quantity: 1, product: { id: 204, name: 'Bicol Pili Nuts (Official)', merchant_id: 1, is_official_mall: true } }] },
  { id: 17, total_amount: '220.00', payment_method: 'cod', fulfillment_type: 'pickup', delivery_state: 'ready_for_pickup', customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, items: [{ id: 18, quantity: 1, product: { id: 202, name: 'Thermal Label Rolls (x100)', merchant_id: 1, is_official_mall: true } }] },
];

let MOCK_CART = [];

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
export function mockRequest(url, method, data, params = {}) {
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
  if (path === '/rider/wallet' && lower === 'get') return Promise.resolve(mockResponse({ wallet: WALLET, balance: WALLET.balance, recent_transactions: WALLET.ledger_transactions, parcel_wallet: { balance: 102.55, ledger: [
    { id: 21, description: 'Delivery fee rider share — BB-2026-100004', amount: 42.5, direction: 'credit', type: 'delivery_split', created_at: new Date(Date.now() - 2 * 3600e3).toISOString() },
    { id: 20, description: 'Delivery fee rider share — BB-2026-100003', amount: 34.85, direction: 'credit', type: 'delivery_split', created_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
    { id: 19, description: 'Delivery fee rider share — BB-2026-100001', amount: 25.2, direction: 'credit', type: 'delivery_split', created_at: new Date(Date.now() - 50 * 3600e3).toISOString() },
  ] } }));
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

  // Marketplace (FR-MKT)
  if (path === '/products' && lower === 'get') {
    const q = (params?.q || '').toLowerCase();
    const cat = params?.category;
    const pointsOnly = params?.points_only;
    const onSale = params?.on_sale;
    let list = [...MALL_PRODUCTS, ...PRODUCTS].filter((p) => p.status === 'active' && p.stock > 0);
    if (params?.official_mall) list = list.filter((p) => p.is_official_mall);
    if (pointsOnly) list = list.filter((p) => p.points_only);
    if (onSale) list = list.filter((p) => p.sale_price);
    if (cat) list = list.filter((p) => p.category === cat);
    if (q) list = list.filter((p) => (p.name + ' ' + (p.description || '')).toLowerCase().includes(q));
    if (params?.sort === 'reviews') list = [...list].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
    if (params?.sort === 'sales') list = [...list].sort((a, b) => (b.units_sold || 0) - (a.units_sold || 0));
    if (params?.sort === 'price_asc') list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (params?.sort === 'price_desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    return Promise.resolve(mockResponse({ data: list, total: list.length }));
  }
  if (/^\/products\/\d+$/.test(path) && lower === 'get') {
    const pid = Number(path.match(/products\/(\d+)/)[1]);
    const product = [...MALL_PRODUCTS, ...PRODUCTS].find((p) => p.id === pid);
    if (!product) return Promise.resolve(mockResponse({ data: null }, 404));
    return Promise.resolve(mockResponse({
      data: {
        ...product,
        merchant: { id: product.merchant_id, name: 'Aling Maria Merch' },
        average_rating: 4.5,
        review_count: 2,
        can_review: true,
        reviews: [
          { id: 1, user: { id: 5, name: 'Juan Dela Cruz' }, rating: 5, review: 'Fresh and delicious!', created_at: new Date().toISOString() },
          { id: 2, user: { id: 8, name: 'Maria Santos' }, rating: 4, review: 'Good quality.', created_at: new Date(Date.now() - 864e5).toISOString() },
        ],
      },
    }));
  }
  if (/^\/products\/\d+\/reviews$/.test(path) && lower === 'get') {
    return Promise.resolve(mockResponse({ data: [
      { id: 1, user: { id: 5, name: 'Juan Dela Cruz' }, rating: 5, review: 'Fresh and delicious!', created_at: new Date().toISOString() },
      { id: 2, user: { id: 8, name: 'Maria Santos' }, rating: 4, review: 'Good quality.', created_at: new Date(Date.now() - 864e5).toISOString() },
    ], total: 2 }));
  }
  if (/^\/products\/\d+\/review$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ id: 99, rating: data?.rating, review: data?.review || null }, 201));
  }
  if (/^\/products\/\d+\/related$/.test(path) && lower === 'get') {
    const pid = Number(path.match(/products\/(\d+)/)[1]);
    const others = PRODUCTS.filter((p) => p.id !== pid && p.status === 'active');
    return Promise.resolve(mockResponse({ related: others.slice(0, 4) }));
  }

  // Public merchant / official Mall storefront.
  if (/^\/merchants\/\d+\/store$/.test(path) && lower === 'get') {
    const merchantId = Number(path.match(/merchants\/(\d+)\/store/)[1]);
    const isMall = merchantId === 1;
    const catalogue = (isMall ? MALL_PRODUCTS : PRODUCTS)
      .filter((product) => product.merchant_id === merchantId && product.status === 'active');
    if (!catalogue.length && !isMall) return undefined;
    const categories = [...new Set(catalogue.map((product) => product.category))];
    return Promise.resolve(mockResponse({
      merchant: {
        id: merchantId,
        name: isMall ? 'HABI Mall' : catalogue[0]?.merchant?.name || 'Local Store',
        verified: true,
        barangay: isMall ? 'San Jose' : '—',
        municipality: 'Naga City',
        is_official_mall: isMall,
      },
      stats: { rating: 4.7, review_count: 0, product_count: catalogue.length, units_sold: 0, response_time: '~2h', fulfillment_rate: 98 },
      categories,
      products: { data: catalogue, current_page: 1, last_page: 1, total: catalogue.length },
    }));
  }
  if (/^\/merchants\/\d+\/reviews$/.test(path) && lower === 'get') return Promise.resolve(mockResponse({ data: [] }));
  if (path === '/products/categories' && lower === 'get') {
    return Promise.resolve(mockResponse([...new Set(PRODUCTS.filter((p) => p.status === 'active').map((p) => p.category))]));
  }
  if (path === '/products/category-images' && lower === 'get') {
    const map = {};
    (PRODUCTS.filter((p) => p.status === 'active' && p.image_url)).forEach((p) => {
      if (!map[p.category]) map[p.category] = p.image_url;
    });
    return Promise.resolve(mockResponse(Object.entries(map).map(([c, u]) => ({ category: c, image_url: u }))));
  }
  if (path === '/cart' && lower === 'get') {
    const items = MOCK_CART.map((i) => {
      const product = PRODUCTS.find((p) => p.id === i.product_id);
      return { ...i, product, merchant: { id: 4, name: 'Aling Maria Merch', latitude: 13.6218, longitude: 123.1948 } };
    });
    return Promise.resolve(mockResponse({ items, count: items.length }));
  }
  if (path === '/cart/sync' && lower === 'post') {
    MOCK_CART = (data?.cart || []).map((c) => ({ id: c.product_id, customer_id: 5, product_id: c.product_id, quantity: c.quantity }));
    return Promise.resolve(mockResponse({ message: 'Cart synced.' }));
  }
  if (/^\/cart\/items\/\d+$/.test(path) && lower === 'delete') {
    const pid = Number(path.match(/items\/(\d+)/)[1]);
    MOCK_CART = MOCK_CART.filter((i) => i.product_id !== pid);
    return Promise.resolve(mockResponse({ message: 'Removed from cart.' }));
  }
  if (path === '/checkout' && lower === 'post') {
    const items = MOCK_CART.map((i) => ({ ...i, product: PRODUCTS.find((p) => p.id === i.product_id) }));
    const productTotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    const shipping = data?.fulfillment_type === 'pickup' ? 10 : 0;
    MOCK_CART = [];
    return Promise.resolve(mockResponse({
      status: 'purchase_completed',
      order: {
        id: Math.floor(Math.random() * 900) + 100,
        total_amount: productTotal.toFixed(2),
        shipping_amount: shipping.toFixed(2),
        fulfillment_type: data?.fulfillment_type,
        payment_method: data?.payment_method || 'gcash',
        status: data?.payment_method === 'cod' ? 'pending_payment' : 'paid',
      },
    }));
  }

  // Rider doorstep deliveries (item 3)
  if (path === '/rider/deliveries' && lower === 'get') {
    return Promise.resolve(mockResponse({
      deliveries: [
        { id: 201, customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, total_amount: '160.00', shipping_amount: '10.00', delivery_address: 'San Jose, Naga City', payment_method: 'cod', status: 'assigned', latitude: 13.6218, longitude: 123.1948, merchant: { id: 4, name: 'Mang Juan Store', latitude: 13.7689, longitude: 122.9764, barangay: 'Tara', municipality: 'Sipocot' }, items: [{ id: 1, product: { id: 10, name: 'Bulk Thermal Paper' }, quantity: 1 }] },
        { id: 202, customer: { id: 8, name: 'Maria Santos', phone: '09173334444' }, total_amount: '95.00', shipping_amount: '12.00', delivery_address: 'Sta. Cruz, Naga City', payment_method: 'gcash', status: 'assigned', latitude: 13.6100, longitude: 123.1800, merchant: { id: 4, name: 'Mang Juan Store', latitude: 13.7689, longitude: 122.9764, barangay: 'Tara', municipality: 'Sipocot' }, items: [{ id: 2, product: { id: 4, name: 'Bicol Express Bagoong' }, quantity: 1 }] },
      ],
    }));
  }
  if (/^\/rider\/deliveries\/\d+\/(refuse|out-for-delivery|deliver)$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Action completed.' }));
  }

  // Staff dispatch (item 4)
  if (path === '/staff/deliveries/unassigned' && lower === 'get') {
    return Promise.resolve(mockResponse({
      data: [
        { id: 203, customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, total_amount: '80.00', payment_method: 'cod', delivery_address: 'San Jose, Naga City' },
      ],
      total: 1,
    }));
  }
  if (/^\/staff\/deliveries\/\d+\/assign$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Assigned to Rico the Rider.', rider: { id: 3, name: 'Rico the Rider' } }));
  }
  if (path === '/staff/sales/today' && lower === 'get') {
    return Promise.resolve(mockResponse({ date: new Date().toISOString().slice(0, 10), order_count: 8, gross_sales: 965.0, delivery_fees: 252.0, total_revenue: 1217.0 }));
  }

  // Providers list (item 7)
  if (path === '/providers' && lower === 'get') {
    return Promise.resolve(mockResponse({
      providers: [
        { id: 6, name: 'Mang Cardo Pro', municipality: 'Naga City', is_verified: true, is_official: true, picture_url: null, skills: ['General Handyman', 'Aircon Cleaning'], average_rating: 5, review_count: 1 },
        { id: 7, name: 'Ate Belen Aircon', municipality: 'Naga City', is_verified: true, is_official: false, picture_url: null, skills: ['Aircon Cleaning'], average_rating: 0, review_count: 0 },
        { id: 8, name: 'Kuya Dom Plumber', municipality: 'Naga City', is_verified: true, is_official: false, picture_url: null, skills: ['Plumbing'], average_rating: 0, review_count: 0 },
      ],
    }));
  }

  // Public services + bookings (hire flow)
  if (path === '/services' && lower === 'get') {
    return Promise.resolve(mockResponse([
      { id: 1, name: 'Aircon Cleaning', base_pakyaw_rate: '900.00', global_commission_percentage: '15.00' },
      { id: 2, name: 'Plumbing', base_pakyaw_rate: '500.00', global_commission_percentage: '15.00' },
      { id: 3, name: 'Electrical Repair', base_pakyaw_rate: '450.00', global_commission_percentage: '15.00' },
      { id: 4, name: 'General Handyman', base_pakyaw_rate: '350.00', global_commission_percentage: '10.00' },
    ]));
  }
  if (path === '/bookings' && lower === 'post') {
    return Promise.resolve(mockResponse({ id: Math.floor(Math.random() * 900) + 100, service: { name: 'General Handyman' }, provider: { name: 'Mang Cardo Pro' }, status: 'pending' }, 201));
  }
  if (path === '/bookings' && lower === 'get') {
    return Promise.resolve(mockResponse({
      data: [
        { id: 2, service: { id: 1, name: 'Aircon Cleaning' }, provider: { id: 6, name: 'Mang Cardo Pro' }, customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, status: 'pending', address: 'Block 12, San Jose, Naga City', quoted_amount: '900.00', provider_payout: '765.00', booking_date: new Date(Date.now() + 864e5).toISOString() },
        { id: 1, service: { id: 4, name: 'General Handyman' }, provider: { id: 6, name: 'Mang Cardo Pro' }, customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, status: 'completed', address: 'San Jose, Naga City', quoted_amount: '350.00', provider_payout: '315.00', booking_date: new Date(Date.now() - 864e5).toISOString() },
      ],
      total: 2,
    }));
  }
  if (/^\/bookings\/\d+\/(accept|complete|confirm|rework)$/.test(path) && lower === 'post') {
    const action = path.split('/').pop();
    const statusMap = { accept: 'accepted', complete: 'provider_completed', confirm: 'completed', rework: 'rework' };
    return Promise.resolve(mockResponse({
      message: action === 'confirm' ? 'Completion confirmed. Provider payout released.' : action === 'rework' ? 'Re-work requested.' : 'OK.',
      booking: { id: Number(path.match(/bookings\/(\d+)/)[1]), status: statusMap[action] },
      payout: action === 'confirm' ? '765.00' : undefined,
    }));
  }

  // Provider profile (item 7)
  if (path === '/provider/profile' && lower === 'get') {
    return Promise.resolve(mockResponse({
      provider: { id: 6, name: 'Mang Cardo Pro', phone: '09170000006', municipality: 'Naga City', is_verified: true, is_official: true, picture_url: null, skills: ['General Handyman', 'Aircon Cleaning'], average_rating: 5, review_count: 1 },
      profile: { id: 1, user_id: 6, is_verified: true, is_official: true, skills: ['General Handyman', 'Aircon Cleaning'], picture_url: null, custom_rate_enabled: true },
    }));
  }
  if (path === '/provider/profile' && lower === 'put') return Promise.resolve(mockResponse({ profile: { ...data, id: 1, user_id: 6 } }));

  // Shared profile (customer / rider / provider) — info + fixed lat/lng
  if (path === '/profile' && lower === 'get') {
    return Promise.resolve(mockResponse({ user: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005', email: 'customer1@bayanbox.ph', role: 'customer', barangay: 'San Jose', municipality: 'Naga City', latitude: 13.6218, longitude: 123.1948, status: 'active' } }));
  }
  if (path === '/profile' && lower === 'put') {
    return Promise.resolve(mockResponse({ message: 'Profile updated.', user: { ...data, id: 5, role: 'customer', phone: '09170000005' } }));
  }
  if (/^\/providers\/\d+\/reviews$/.test(path) && lower === 'get') {
    return Promise.resolve(mockResponse({ data: [{ id: 1, customer: { id: 5, name: 'Juan Dela Cruz' }, rating: 5, review: 'Excellent work!', created_at: new Date().toISOString() }], total: 1 }));
  }
  if (/^\/providers\/\d+\/review$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ id: 1, rating: data?.rating, review: data?.review || null }, 201));

  // Image upload (Phase A)
  if (path === '/upload' && lower === 'post') {
    return Promise.resolve(mockResponse({ image_url: 'https://placehold.co/600x400/673de6/ffffff?text=Uploaded' }));
  }

  // Merchant profile (item 8)
  if (path === '/merchant/profile' && lower === 'get') {
    return Promise.resolve(mockResponse({
      merchant: { id: 4, name: 'Aling Maria Merch', phone: '09170000004', email: 'merchant@bayanbox.ph', barangay: 'San Jose', municipality: 'Naga City', latitude: 13.6218, longitude: 123.1948, status: 'active' },
      documents: { dti_sec_number: 'DTI-2026-12345', government_id_url: null, business_permit_url: null, picture_url: null, verification_message: 'I am a registered local seller.', submitted_at: new Date().toISOString() },
    }));
  }
  if (path === '/merchant/profile' && lower === 'put') return Promise.resolve(mockResponse({ message: 'Profile updated.', merchant: {}, documents: {} }));

  // Affiliate earnings + cash-out
  if (path === '/affiliate/earnings' && lower === 'get') {
    return Promise.resolve(mockResponse({ balance: 500.0, pending: 72.5, referral_code: 'JUAN01', referral_url: 'http://localhost:3000/login?ref=JUAN01', min_cashout: 200, income_sources: { affiliate_commission: 572.5 }, ledger: [{ id: 1, description: 'Commission from sale', amount: 500, direction: 'credit', created_at: new Date().toISOString() }] }));
  }
  if (path === '/affiliate/qr' && lower === 'get') {
    return Promise.resolve(mockResponse({ referral_code: 'JUAN01', url: 'http://localhost:3000/login?ref=JUAN01', qr_data_url: '' }));
  }
  if (path === '/affiliate/cash-out' && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Cash-out requested.', cash_out: { id: 1, amount: data?.amount, status: 'pending' } }, 201));
  }
  if (path === '/affiliate/cash-outs' && lower === 'get') {
    return Promise.resolve(mockResponse({ data: [{ id: 1, amount: 250, status: 'pending', requested_at: new Date().toISOString() }], total: 1 }));
  }

  // Admin affiliate management
  if (path === '/admin/affiliates' && lower === 'get') {
    const list = [
      { id: 5, name: 'Juan Dela Cruz', phone: '09170000005', role: 'customer', municipality: 'Naga City', barangay: 'San Jose', affiliate_code: 'JUAN01', affiliate_status: 'active', affiliate_documents: [], affiliate_activated_at: new Date().toISOString(), status: 'active', created_at: new Date().toISOString(), earnings: 500 },
      { id: 4, name: 'Aling Maria', phone: '09170000004', role: 'merchant', municipality: 'Naga City', barangay: 'Poblacion', affiliate_code: 'MARIA01', affiliate_status: 'pending', affiliate_documents: [{ document_type: 'government_id', id_url: 'https://placehold.co/400x300/673de6/ffffff?text=ID' }], affiliate_activated_at: null, status: 'active', created_at: new Date().toISOString(), earnings: 250 },
    ];
    return Promise.resolve(mockResponse({ data: list, total: list.length, current_page: 1, last_page: 1, per_page: 20 }));
  }
  if (path === '/admin/affiliates/cash-outs' && lower === 'get') {
    return Promise.resolve(mockResponse({ data: [{ id: 1, user: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, amount: 250, status: 'pending', requested_at: new Date().toISOString() }], total: 1 }));
  }
  if (/^\/admin\/affiliates\/cash-outs\/\d+\/(approve|decline)$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Cash-out ' + (path.endsWith('approve') ? 'approved and paid.' : 'declined.') }));
  }

  // Merchant orders + customer order tracking
  if (path === '/merchant/orders' && lower === 'get') {
    return Promise.resolve(mockResponse({
      data: [
        { id: 11, customer: { id: 20, name: 'Referred User 2', phone: '09179990001' }, total_amount: '80.00', payment_method: 'gcash', fulfillment_status: 'packaging', items: [{ id: 1, product: { id: 1, name: 'Fresh Sili (250g)', merchant_id: 4 }, quantity: 2 }] },
        { id: 10, customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, total_amount: '160.00', payment_method: 'affiliate', fulfillment_status: 'pending', items: [{ id: 2, product: { id: 4, name: 'Bicol Express Bagoong', merchant_id: 4 }, quantity: 2 }] },
      ],
      total: 2,
    }));
  }
  if (/^\/merchant\/orders\/\d+\/status$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Order marked as ' + data?.fulfillment_status + '.', order: {} }));
  }
  if (path === '/orders' && lower === 'get') {
    return Promise.resolve(mockResponse({
      data: [
        { id: 11, total_amount: '80.00', payment_method: 'gcash', fulfillment_type: 'delivery', fulfillment_status: 'packaging', items: [{ id: 1, product: { id: 1, name: 'Fresh Sili (250g)' }, quantity: 2 }] },
        { id: 10, total_amount: '160.00', payment_method: 'affiliate', fulfillment_type: 'pickup', fulfillment_status: 'pending', items: [{ id: 2, product: { id: 4, name: 'Bicol Express Bagoong' }, quantity: 2 }] },
      ],
      total: 2,
    }));
  }

    // Notifications (item 11)
  if (path === '/notifications/unread-count' && lower === 'get') return Promise.resolve(mockResponse({ unread: 2 }));
  if (path === '/notifications' && lower === 'get') {
    return Promise.resolve(mockResponse({ data: [
      { id: 1, title: 'New order received', body: 'You have a new order (#12) to fulfill.', type: 'merchant_order', icon: '📦', read_at: null, created_at: new Date().toISOString() },
      { id: 2, title: 'Affiliate activated', body: 'You can now withdraw your earnings.', type: 'affiliate_status', icon: '✅', read_at: null, created_at: new Date().toISOString() },
    ], total: 2 }));
  }
  if (path === '/notifications/read-all' && lower === 'post') return Promise.resolve(mockResponse({ message: 'All read.' }));
  if (/^\/notifications\/\d+\/read$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Marked read.' }));

  // Banners (public + admin)
  if (path === '/banners' && lower === 'get') {
    return Promise.resolve(mockResponse([
      { id: 1, title: 'Summer Sale', image_url: 'https://placehold.co/800x300/673de6/ffffff?text=Summer+Sale', link_url: '/?on_sale=1', link_type: 'internal', sort_order: 0, is_active: true },
      { id: 2, title: 'Points Shop', image_url: 'https://placehold.co/800x300/f59e0b/ffffff?text=Points+Shop', link_url: '/points-shop', link_type: 'internal', sort_order: 1, is_active: true },
    ]));
  }
  if (path === '/staff/dashboard' && lower === 'get') {
    return Promise.resolve(mockResponse({ pending_merchant_approvals: 2, pending_cashouts: 1, disputed_orders: 0, low_stock_items: 3 }));
  }

    // Merchant ads
  if (path === '/merchant/ads/rates' && lower === 'get') {
    return Promise.resolve(mockResponse({ rates: [{ type: 'sponsored', label: 'Top Placement / Sponsored Search', daily_rate: 50 }, { type: 'homepage_featured', label: 'Homepage Featured Carousel', daily_rate: 100 }, { type: 'flash_deal', label: 'Flash Deal / On Sale Booster', daily_rate: 30 }] }));
  }
  if (path === '/merchant/ads' && lower === 'get') {
    return Promise.resolve(mockResponse({ campaigns: [{ id: 1, product: { id: 1, name: 'Fresh Sili (250g)', image_url: null, price: '40.00' }, ad_type: 'sponsored', daily_rate: '50.00', duration_days: 3, total_cost: '150.00', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 3 * 864e5).toISOString(), status: 'active', payment_method: 'wallet', impressions: 120, clicks: 18, conversions: 3, days_remaining: 2 }] }));
  }
  if (path === '/merchant/ads' && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Ad campaign launched!', campaign: {} }, 201));
  }
  if (/^\/merchant\/ads\/\d+\/pause$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Paused.', campaign: {} }));

  // Admin ads
  if (path === '/admin/ads' && lower === 'get') {
    if (params?.type === 'home_slide') {
      return Promise.resolve(mockResponse({ data: [{ id: 1, type: 'home_slide', title: 'Summer Sale', image_url: 'https://placehold.co/800x300/673de6/ffffff?text=Summer', link_url: '/?on_sale=1', display_order: 0, status: 'active', impressions: 0, clicks: 0, start_date: new Date().toISOString(), end_date: null }], total: 1, active: 1, paused: 0, expired: 0 }));
    }
    return Promise.resolve(mockResponse({ data: [{ id: 1, type: 'product', title: 'Fresh Sili Ad', product: { id: 1, name: 'Fresh Sili (250g)', image_url: null, price: '40.00' }, merchant: { id: 4, name: 'Aling Maria' }, ad_type: 'sponsored', daily_rate: '50.00', display_order: 0, keywords: 'chili, sili', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 2 * 864e5).toISOString(), status: 'active', impressions: 120, clicks: 18, conversions: 3 }], total: 1, active: 1, paused: 0, expired: 0 }));
  }
  if (/^\/admin\/ads\/\d+$/.test(path) && (lower === 'put' || lower === 'delete')) return Promise.resolve(mockResponse({ message: 'Ad ' + (lower === 'put' ? 'updated.' : 'deleted.') }));

    // Merchant dashboard + reports
  if (path === '/merchant/dashboard' && lower === 'get') {
    return Promise.resolve(mockResponse({
      store: { name: 'Mang Juan Store', status: 'active', verified: true },
      kpis: { revenue_this_month: 630, revenue_lifetime: 1890, pending_orders: 2, units_sold: 12, wallet_balance: 1200 },
      pending_orders: [{ id: 14, total_amount: '150.00', customer: { id: 5, name: 'Juan Dela Cruz' }, items: [{ product: { name: 'Fresh Sili' } }] }],
      low_stock: [{ id: 4, name: 'Gabi (1kg)', stock: 3, low_stock_threshold: 5, price: 55 }],
    }));
  }
  if (path === '/merchant/reports' && lower === 'get') {
    return Promise.resolve(mockResponse({
      summary: { orders: 6, revenue: 630, units: 12 },
      trend: [{ date: '2026-08-26', revenue: 120, orders: 2 }, { date: '2026-08-27', revenue: 300, orders: 3 }, { date: '2026-08-28', revenue: 210, orders: 1 }],
      best_sellers: [{ product_id: 1, name: 'Fresh Sili (250g)', category: 'Fresh Produce', units_sold: 12, revenue: 480, current_stock: 100, conversion_rate: 10.7 }],
      wallet: { balance: 1200, history: [], withdrawals: [] },
    }));
  }
  if (path === '/merchant/cash-out' && lower === 'post') {
    return Promise.resolve(mockResponse({ message: 'Withdrawal requested.', cash_out: { id: 5, amount: data?.amount, status: 'pending' } }, 201));
  }

    // Admin settings
  if (path === '/admin/settings' && lower === 'get') {
    return Promise.resolve(mockResponse({
      settings: {
        fees: { base_fee: 40, base_distance_km: 2, per_km_rate: 10, merchant_commission_percent: 5, min_cashout: 500 },
        ads: { homepage_featured_rate: 100, sponsored_rate: 50, max_featured_slots: 5 },
        toggles: { maintenance_mode: false, allow_merchant_registration: true },
        locations: { default_lat: 13.6218, default_lng: 123.1948, service_zones: [{ name: 'Naga City', barangays: ['San Jose', 'Poblacion'], active: true }] },
      },
      categories: [
        { id: 1, name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬', sort_order: 0, is_active: true, product_count: 6 },
        { id: 2, name: 'Local Crafts', slug: 'local-crafts', icon: '🧶', sort_order: 1, is_active: true, product_count: 6 },
        { id: 3, name: 'Packaging', slug: 'packaging', icon: '📦', sort_order: 2, is_active: true, product_count: 5 },
      ],
    }));
  }
  if (path === '/admin/settings' && lower === 'put') return Promise.resolve(mockResponse({ message: 'Settings saved.', settings: {} }));
  if (path === '/admin/categories' && lower === 'post') return Promise.resolve(mockResponse({ id: 99, ...data }, 201));
  if (/^\/admin\/categories\/\d+$/.test(path) && (lower === 'put' || lower === 'delete')) return Promise.resolve(mockResponse({ message: 'Category ' + (lower === 'put' ? 'updated.' : 'deleted.') }));

    // Merchant payout accounts
  if (path === '/merchant/payouts' && lower === 'get') {
    return Promise.resolve(mockResponse({ accounts: [{ id: 1, account_type: 'gcash', account_name: 'Mang Juan Store', mobile_number: '09171234567', bank_name: null, account_number: null, branch: null, is_default: true, masked_account: '0917••••••67', display_label: '💙 GCash — Mang Juan Store (0917••••••67)' }] }));
  }
  if (path === '/merchant/payouts' && lower === 'post') return Promise.resolve(mockResponse({ id: 1, ...data }, 201));
  if (/^\/merchant\/payouts\/\d+$/.test(path) && (lower === 'put' || lower === 'delete')) return Promise.resolve(mockResponse({ message: 'Payout account ' + (lower === 'put' ? 'updated.' : 'deleted.') }));
  if (/^\/merchant\/payouts\/\d+\/default$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Default payout account set.' }));
  if (path === '/merchant/cash-out' && lower === 'post') return Promise.resolve(mockResponse({ message: 'Withdrawal requested.', cash_out: {} }, 201));

    // Staff ops
  if (path === '/staff/ops/overview' && lower === 'get') return Promise.resolve(mockResponse({ active_riders: 2, deliveries_in_transit: 1, emergency_alerts: 1, unassigned_orders: 2, mall_orders_waiting: MALL_ORDERS.filter((order) => ['pending_merchant', 'preparing'].includes(order.delivery_state)).length }));
  if (path === '/staff/ops/mall-orders' && lower === 'get') return Promise.resolve(mockResponse({ orders: MALL_ORDERS }));
  if (path === '/staff/ops/incidents' && lower === 'get') return Promise.resolve(mockResponse([{ id: 1, rider: { id: 3, name: 'Rico the Rider', phone: '09170000003' }, order_id: 8, type: 'accident', description: 'Minor accident near San Jose', created_at: new Date().toISOString(), status: 'open' }]));
  if (/^\/staff\/ops\/incidents\/\d+\/resolve$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Incident resolved.', incident: {} }));
  if (/^\/orders\/\d+\/state\/(accept|reject|mark_ready|confirm_collection)$/.test(path) && lower === 'post') {
    const [, orderId, action] = path.match(/^\/orders\/(\d+)\/state\/(accept|reject|mark_ready|confirm_collection)$/) || [];
    const order = MALL_ORDERS.find((item) => item.id === Number(orderId));
    if (order) {
      order.delivery_state = { accept: 'preparing', mark_ready: 'ready_for_pickup', confirm_collection: 'delivered', reject: 'cancelled' }[action];
    }
    return Promise.resolve(mockResponse({ message: 'Mall order status updated.', order }));
  }
  if (path === '/staff/ops/dispatch' && lower === 'get') return Promise.resolve(mockResponse({ ready_orders: [{ id: 15, total_amount: '150.00', customer: { id: 5, name: 'Juan Dela Cruz', phone: '09170000005' }, items: [{ product: { name: 'Fresh Sili' } }], delivery_address: 'San Jose, Naga', latitude: 13.62, longitude: 123.18 }], riders: [{ id: 3, name: 'Rico the Rider', active_orders: 1 }, { id: 18, name: 'Berto', active_orders: 0 }] }));
  if (/^\/staff\/ops\/dispatch\/\d+\/assign$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Assigned to Rico the Rider.' }));
  if (path === '/staff/ops/status-board' && lower === 'get') return Promise.resolve(mockResponse({ ready_for_pickup: [], in_transit: [{ id: 8, total_amount: '80.00', customer: { name: 'Juan' }, items: [], status: 'out_for_delivery', elapsed_minutes: 60, estimated_delivery_minutes: 45 }], delivered: [{ id: 4, total_amount: '160.00', customer: { name: 'Maria' }, items: [], status: 'delivered' }], failed_returned: [] }));
  if (/^\/staff\/ops\/orders\/\d+\/status$/.test(path) && lower === 'put') return Promise.resolve(mockResponse({ message: 'Order status updated.' }));
  if (path === '/staff/ops/history' && lower === 'get') {
    const transactions = [
      { id: 18, display_id: 'ORD-00018', created_at: new Date().toISOString(), status: 'assigned', delivery_state: 'raider_en_route_to_merchant', customer: { name: 'Juan Dela Cruz' }, merchant: { name: 'HABI Mall', barangay: 'San Jose', municipality: 'Naga City' }, rider: { id: 3, name: 'Rico the Rider' }, delivery_address: 'San Jose, Naga', dispatch_method: 'auto', total_amount: '495.00', trip_duration_min: null },
      { id: 15, display_id: 'ORD-00015', created_at: new Date(Date.now() - 45 * 60e3).toISOString(), status: 'out_for_delivery', delivery_state: 'in_transit', customer: { name: 'Maria Santos' }, merchant: { name: 'Aling Maria Merch', barangay: 'Poblacion', municipality: 'Naga City' }, rider: { id: 18, name: 'Berto' }, delivery_address: 'Concepcion Grande, Naga', dispatch_method: 'manual', total_amount: '150.00', trip_duration_min: 26 },
      { id: 8, display_id: 'ORD-00008', created_at: new Date(Date.now() - 864e5).toISOString(), status: 'delivered', delivery_state: 'delivered', customer: { name: 'Cora Bautista' }, merchant: { name: 'HABI Mall', barangay: 'San Jose', municipality: 'Naga City' }, rider: { id: 3, name: 'Rico the Rider' }, delivery_address: 'Sta. Cruz, Naga', dispatch_method: 'auto', total_amount: '320.00', trip_duration_min: 41 },
    ];
    const filtered = params?.status && params.status !== 'all' ? transactions.filter((transaction) => transaction.status === params.status) : transactions;
    return Promise.resolve(mockResponse({ data: filtered, current_page: 1, last_page: 1, total: filtered.length }));
  }
  if (path === '/staff/ops/tickets' && lower === 'get') return Promise.resolve(mockResponse([{ id: 1, subject: 'Damaged item', reporter_role: 'customer', user: { name: 'Juan' }, order_id: 4, description: 'Received dented can', proof_url: null, status: 'open' }]));
  if (/^\/staff\/ops\/tickets\/\d+\/resolve$/.test(path) && lower === 'post') return Promise.resolve(mockResponse({ message: 'Ticket resolved.' }));
  if (path === '/staff/ops/hazards' && lower === 'get') return Promise.resolve(mockResponse({ zones: [{ name: 'San Jose', impassable: false }, { name: 'Sta. Cruz', impassable: false }] }));
  if (path === '/staff/ops/hazards' && lower === 'post') return Promise.resolve(mockResponse({ message: 'Hazard zones updated.' }));

  // Merchant product management (FR-MKT-001)
  if (path === '/merchant/products' && lower === 'get') {
    return Promise.resolve(mockResponse({ data: PRODUCTS, total: PRODUCTS.length }));
  }
  if (path === '/merchant/products' && lower === 'post') {
    const p = { ...data, id: PRODUCTS.length + 1, merchant_id: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    PRODUCTS.push(p);
    return Promise.resolve(mockResponse(p, 201));
  }
  if (/^\/merchant\/products\/\d+$/.test(path) && lower === 'put') {
    const pid = Number(path.match(/products\/(\d+)/)[1]);
    const idx = PRODUCTS.findIndex((p) => p.id === pid);
    if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], ...data, updated_at: new Date().toISOString() };
    return Promise.resolve(mockResponse(PRODUCTS[idx]));
  }
  if (/^\/merchant\/products\/\d+$/.test(path) && lower === 'delete') {
    const pid = Number(path.match(/products\/(\d+)/)[1]);
    const idx = PRODUCTS.findIndex((p) => p.id === pid);
    if (idx >= 0) PRODUCTS[idx] = { ...PRODUCTS[idx], status: 'archived' };
    return Promise.resolve(mockResponse({ message: 'Product archived.' }));
  }

  // Module 1: Admin merchant verification
  if (path === '/admin/merchants/pending' && lower === 'get') {
    const PENDING = [
      { id: 101, name: 'Rosie Bakes', phone: '09171234567', municipality: 'Naga City', status: 'pending_verification', verification_notes: '{"dti_sec_number":"DTI-2026-0001","government_id_url":null}', created_at: new Date().toISOString() },
      { id: 102, name: 'Karding Appliances', phone: '09179876543', municipality: 'Naga City', status: 'pending_verification', verification_notes: '{"dti_sec_number":"SEC-2026-88","government_id_url":null}', created_at: new Date(Date.now() - 864e5).toISOString() },
    ];
    return Promise.resolve(mockResponse({ data: PENDING, total: PENDING.length }));
  }
  if (/^\/admin\/merchants\/\d+\/(approve|reject)$/.test(path) && lower === 'post') {
    const action = path.split('/').pop();
    const id = Number(path.match(/merchants\/(\d+)/)[1]);
    return Promise.resolve(mockResponse({
      message: action === 'approve' ? 'Merchant approved.' : 'Merchant rejected.',
      merchant: { id, name: 'Rosie Bakes', status: action === 'approve' ? 'active' : 'rejected', verified_at: action === 'approve' ? new Date().toISOString() : null },
    }));
  }

  // Item 5: Admin rider + merchant management
  const ADMIN_RIDERS = [
    { id: 3, name: 'Rico the Rider', phone: '09170000003', email: 'rider@bayanbox.ph', municipality: 'Naga City', status: 'active', active_deliveries: 2 },
    { id: 18, name: 'Berto the Rider', phone: '09175550000', email: 'rider18@bayanbox.ph', municipality: 'Naga City', status: 'active', active_deliveries: 2 },
  ];
  const ADMIN_MERCHANTS = [
    { id: 4, name: 'Aling Maria Merch', phone: '09170000004', municipality: 'Naga City', status: 'active' },
    { id: 14, name: 'New Seller', phone: '09179999999', municipality: 'Naga City', status: 'active' },
    { id: 101, name: 'Rosie Bakes', phone: '09171234567', municipality: 'Naga City', status: 'pending_verification' },
  ];
  if (path === '/admin/riders' && lower === 'get') return Promise.resolve(mockResponse({ data: ADMIN_RIDERS, total: ADMIN_RIDERS.length }));
  if (/^\/admin\/riders\/\d+$/.test(path) && lower === 'put') return Promise.resolve(mockResponse({ ...data, id: Number(path.match(/riders\/(\d+)/)[1]) }));
  if (/^\/admin\/riders\/\d+$/.test(path) && lower === 'delete') return Promise.resolve(mockResponse({ message: 'Rider deactivated.' }));
  if (path === '/admin/merchants' && lower === 'get') return Promise.resolve(mockResponse({ data: ADMIN_MERCHANTS, total: ADMIN_MERCHANTS.length }));
  if (/^\/admin\/merchants\/\d+\/(activate|deactivate)$/.test(path) && lower === 'post') {
    return Promise.resolve(mockResponse({ message: path.endsWith('activate') ? 'Merchant activated.' : 'Merchant deactivated.' }));
  }

  // Module 2: HABI Mall
  if (path === '/admin/mall/products' && lower === 'get') return Promise.resolve(mockResponse({ data: MALL_PRODUCTS, total: MALL_PRODUCTS.length }));
  if (path === '/admin/mall/products' && lower === 'post') {
    const p = {
      ...data,
      id: Math.max(200, ...MALL_PRODUCTS.map((product) => product.id)) + 1,
      merchant_id: 1,
      merchant: { id: 1, name: 'HABI Mall' },
      images: (data?.gallery || []).map((image, index) => ({ id: index + 1, image_url: image.image_url, sort_order: index })),
      is_official_mall: true,
      status: 'active',
      availability: data?.availability || 'available',
    };
    MALL_PRODUCTS.push(p);
    return Promise.resolve(mockResponse(p, 201));
  }
  if (/^\/admin\/mall\/products\/\d+$/.test(path) && (lower === 'put' || lower === 'delete')) {
    const pid = Number(path.match(/products\/(\d+)/)[1]);
    const idx = MALL_PRODUCTS.findIndex((p) => p.id === pid);
    if (lower === 'put' && idx >= 0) MALL_PRODUCTS[idx] = {
      ...MALL_PRODUCTS[idx],
      ...data,
      images: data?.gallery ? data.gallery.map((image, index) => ({ id: index + 1, image_url: image.image_url, sort_order: index })) : MALL_PRODUCTS[idx].images,
    };
    if (lower === 'delete' && idx >= 0) MALL_PRODUCTS[idx] = { ...MALL_PRODUCTS[idx], status: 'archived' };
    return Promise.resolve(mockResponse(lower === 'put' ? MALL_PRODUCTS[idx] : { message: 'Mall product archived.' }));
  }
  if (path === '/staff/mall/inventory' && lower === 'get') return Promise.resolve(mockResponse({ data: MALL_PRODUCTS, total: MALL_PRODUCTS.length }));
  if (path === '/staff/mall/products' && lower === 'post') {
    const product = {
      ...data,
      id: Math.max(200, ...MALL_PRODUCTS.map((item) => item.id)) + 1,
      merchant_id: 1,
      merchant: { id: 1, name: 'HABI Mall' },
      images: (data?.gallery || []).map((image, index) => ({ id: index + 1, image_url: image.image_url, sort_order: index })),
      is_official_mall: true,
      status: 'active',
      availability: data?.availability || 'available',
    };
    MALL_PRODUCTS.push(product);
    return Promise.resolve(mockResponse(product, 201));
  }

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

  // Admin finance
  if (path === '/admin/finance' && lower === 'get') {
    return Promise.resolve(mockResponse({
      collected: { total: 4850, today: 320, cod: 2100, cod_pending: 450, gcash_maya: 2750 },
      wallets: { escrow: 0, platform: 385.5, admin: 1250, platform_commission_earned: 1024.5, mall_revenue: 1250, affiliate_paid: 480 },
      riders: [
        { id: 3, name: 'Rider Juan', phone: '09181234567', cod_collected: 1200, remitted: 800, outstanding: 400 },
        { id: 8, name: 'Rider Maria', phone: '09185678901', cod_collected: 900, remitted: 900, outstanding: 0 },
      ],
      merchants: [
        { id: 2, name: 'Mang Juan Store', earned: 3200, withdrawn: 1000, balance: 2200 },
        { id: 4, name: 'Aling Maria Handicrafts', earned: 1800, withdrawn: 500, balance: 1300 },
      ],
      pending_cashouts: [
        { id: 1, user_name: 'Mang Juan', wallet_type: 'merchant_earnings', amount: 500, requested_at: new Date().toISOString() },
      ],
      transaction_register: [
        { id: 'ledger-1', recorded_at: new Date().toISOString(), source: 'ledger', type: 'sales_receipt', description: 'Customer payment received Order #17', amount: 220, direction: 'credit', account: 'System · sales escrow', counterparty: '—', order_id: 17 },
        { id: 'ledger-2', recorded_at: new Date(Date.now() - 60000).toISOString(), source: 'ledger', type: 'mall_sale', description: 'HABI Mall sale Order #17', amount: 220, direction: 'credit', account: 'HABI Admin · admin earnings', counterparty: 'System · sales escrow', order_id: 17 },
      ],
    }));
  }

  // Staff finance
  if (path === '/staff/finance' && lower === 'get') {
    return Promise.resolve(mockResponse({
      riders: [
        { id: 3, name: 'Rider Juan', phone: '09181234567', cod_collected: 1200, remitted: 800, outstanding: 400 },
        { id: 8, name: 'Rider Maria', phone: '09185678901', cod_collected: 900, remitted: 900, outstanding: 0 },
      ],
      recent: [
        { id: 1, rider_name: 'Rider Juan', amount: 500, notes: 'Batch #12', recorded_by: 'Admin', created_at: new Date().toISOString() },
        { id: 2, rider_name: 'Rider Maria', amount: 300, notes: null, recorded_by: 'Admin', created_at: new Date(Date.now() - 864e5).toISOString() },
      ],
      pickup_collections: [
        { id: 17, display_id: 'ORD-00017', hub_name: 'Nena San Jose Sari-Sari', collected_by: 'Nena Sari-Sari', amount: 220, collected_at: new Date().toISOString() },
      ],
      pickup_cod_collected: 220,
      collection_transactions: [
        { id: 'pickup-order-17', recorded_at: new Date().toISOString(), type: 'hub_cod_collection', reference: 'ORD-00017', collected_by: 'Nena Sari-Sari', amount: 220 },
        { id: 'remittance-1', recorded_at: new Date(Date.now() - 864e5).toISOString(), type: 'rider_cod_remittance', reference: 'REM-00001', collected_by: 'Rider Juan', amount: 500 },
      ],
      total_outstanding: 400,
    }));
  }

  return null;
}
