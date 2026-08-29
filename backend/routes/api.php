<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminAdController;
use App\Http\Controllers\Api\AdminAffiliateController;
use App\Http\Controllers\Api\AdminMallController;
use App\Http\Controllers\Api\AdminMerchantController;
use App\Http\Controllers\Api\AdminRiderController;
use App\Http\Controllers\Api\AdminSettingsController;
use App\Http\Controllers\Api\AdTrackingController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\HubController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\MarketplaceController;
use App\Http\Controllers\Api\MerchantProductController;
use App\Http\Controllers\Api\MerchantOrderController;
use App\Http\Controllers\Api\MerchantPayoutController;
use App\Http\Controllers\Api\MerchantDashboardController;
use App\Http\Controllers\Api\MerchantAdController;
use App\Http\Controllers\Api\MerchantProfileController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OfflineSyncController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\RiderDeliveryController;
use App\Http\Controllers\Api\StaffDeliveryController;
use App\Http\Controllers\Api\StaffDashboardController;
use App\Http\Controllers\Api\StaffMallController;
use App\Http\Controllers\Api\StaffOpsController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| BayanBox API Routes
|--------------------------------------------------------------------------
| Multi-role RBAC enforced per route group (PRD section 2).
*/

// ---- Public ----
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:3,60');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('/track/{tracking}', [TrackingController::class, 'show']);

// Public storefront — browse products without login (item 1, homepage)
Route::get('/products', [MarketplaceController::class, 'index']);
Route::get('/products/categories', [MarketplaceController::class, 'categories']);
Route::get('/products/{id}', [MarketplaceController::class, 'show'])->whereNumber('id');
Route::get('/products/{id}/related', [MarketplaceController::class, 'related'])->whereNumber('id');
Route::get('/products/{id}/reviews', [ProductReviewController::class, 'index'])->whereNumber('id');

// Public banners
Route::get('/banners', [BannerController::class, 'index']);

// Ad impression/click tracking (public)
Route::post('/ads/{id}/impression', [AdTrackingController::class, 'impression'])->whereNumber('id');
Route::post('/ads/{id}/click', [AdTrackingController::class, 'click'])->whereNumber('id');

// Public provider directory — browse workers without login (item 7)
Route::get('/providers', [ProviderController::class, 'index']);
Route::get('/providers/{id}', [ProviderController::class, 'show'])->whereNumber('id');
Route::get('/providers/{id}/reviews', [ProviderController::class, 'reviews'])->whereNumber('id');
Route::get('/services', [BookingController::class, 'services']);

// ---- Authenticated (any role) ----
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dynamic per-km delivery calculator (FR-CALC-001..006)
    Route::post('/delivery/calculate', [DeliveryController::class, 'calculate']);

    // Wallets (PRD 2.3)
    Route::get('/wallets', [WalletController::class, 'index']);
    Route::post('/wallets/{type}/topup', [WalletController::class, 'topup']);
    Route::get('/wallets/{type}/ledger', [WalletController::class, 'ledger']);
    Route::post('/wallets/{type}/withdraw', [WalletController::class, 'withdraw']);

    // Suki Points (FR-LOY-001..004)
    Route::get('/loyalty', [LoyaltyController::class, 'index']);
    Route::get('/loyalty/packaging', [LoyaltyController::class, 'packagingCatalog']);
    Route::post('/loyalty/packaging/redeem', [LoyaltyController::class, 'redeemPackaging']);
    Route::post('/loyalty/doorstep-upgrade', [LoyaltyController::class, 'doorstepUpgrade']);

    // Promos (FR-PROMO-002/003 apply side)
    Route::post('/promos/apply', [PromoController::class, 'apply']);

    // Affiliate (FR-AFF-001..003)
    Route::post('/affiliate/register-referral', [AffiliateController::class, 'registerReferral']);
    Route::get('/affiliate/earnings', [AffiliateController::class, 'earnings']);
    Route::get('/affiliate/qr', [AffiliateController::class, 'qr']);
    Route::post('/affiliate/cash-out', [AffiliateController::class, 'requestCashOut']);
    Route::get('/affiliate/cash-outs', [AffiliateController::class, 'cashOutHistory']);
    Route::post('/affiliate/upload-document', [AffiliateController::class, 'uploadDocument']);

    // Notifications (item 11)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->whereNumber('id');

    // Offline sync queue (FR-OFF-001/002)
    Route::post('/sync/offline-queue', [OfflineSyncController::class, 'sync']);

    // Bookings (PRD 2.6)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::post('/bookings/{id}/confirm', [BookingController::class, 'confirm'])->whereNumber('id');
    Route::post('/bookings/{id}/rework', [BookingController::class, 'rework'])->whereNumber('id');

    // Customer order tracking
    Route::get('/orders', [MerchantOrderController::class, 'customerOrders']);

    // Image upload (Phase A)
    Route::post('/upload', [UploadController::class, 'store']);

    // Providers (item 7)
    Route::post('/providers/{id}/review', [ProviderController::class, 'review'])->whereNumber('id');
    Route::get('/provider/profile', [ProviderController::class, 'myProfile']);
    Route::put('/provider/profile', [ProviderController::class, 'updateProfile']);

    // Marketplace storefront + cart + checkout (PRD v4 §3.7)
    Route::post('/products/{id}/review', [ProductReviewController::class, 'store'])->whereNumber('id');
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/sync', [CartController::class, 'sync']);
    Route::delete('/cart/items/{productId}', [CartController::class, 'remove']);
    Route::post('/checkout', [CheckoutController::class, 'processPurchase']);
});

// ---- Merchant (Local Seller / MSME) ----
Route::middleware(['auth:sanctum', 'role:merchant,admin'])->prefix('merchant/products')->group(function () {
    Route::get('/', [MerchantProductController::class, 'index']);
    Route::post('/', [MerchantProductController::class, 'store']);
    Route::put('/{id}', [MerchantProductController::class, 'update']);
    Route::delete('/{id}', [MerchantProductController::class, 'destroy']);
});

// ---- Merchant profile & verification documents (item 8) ----
Route::middleware(['auth:sanctum', 'role:merchant,admin'])->prefix('merchant')->group(function () {
    Route::get('/profile', [MerchantProfileController::class, 'show']);
    Route::put('/profile', [MerchantProfileController::class, 'update']);

    // Merchant order fulfillment
    Route::get('/orders', [MerchantOrderController::class, 'index']);
    Route::post('/orders/{id}/status', [MerchantOrderController::class, 'updateStatus'])->whereNumber('id');

    // Merchant ads
    Route::get('/ads', [MerchantAdController::class, 'index']);
    Route::get('/ads/rates', [MerchantAdController::class, 'rates']);
    Route::post('/ads', [MerchantAdController::class, 'store']);
    Route::post('/ads/{id}/pause', [MerchantAdController::class, 'togglePause'])->whereNumber('id');

    // Merchant dashboard, reports, cash-out
    Route::get('/dashboard', [MerchantDashboardController::class, 'dashboard']);
    Route::get('/reports', [MerchantDashboardController::class, 'reports']);
    Route::post('/cash-out', [MerchantDashboardController::class, 'requestCashOut']);

    // Merchant payout accounts
    Route::get('/payouts', [MerchantPayoutController::class, 'index']);
    Route::post('/payouts', [MerchantPayoutController::class, 'store']);
    Route::put('/payouts/{id}', [MerchantPayoutController::class, 'update'])->whereNumber('id');
    Route::post('/payouts/{id}/default', [MerchantPayoutController::class, 'setDefault'])->whereNumber('id');
    Route::delete('/payouts/{id}', [MerchantPayoutController::class, 'destroy'])->whereNumber('id');
});

// ---- Staff (Hub PWA) ----
Route::middleware(['auth:sanctum', 'role:staff,admin'])->prefix('hub')->group(function () {
    Route::get('/inventory', [HubController::class, 'inventory']);
    Route::post('/intake', [HubController::class, 'intake']);
    Route::post('/parcels/{tracking}/reconcile', [HubController::class, 'reconcile']);
    Route::post('/parcels/{tracking}/release', [HubController::class, 'release']);
    Route::post('/parcels/{tracking}/return', [HubController::class, 'markReturned']);

    // Referral poster (FR-AFF-001)
    Route::get('/affiliate/referral-qr', [AffiliateController::class, 'referralQr']);
    Route::get('/affiliate/referral-qr/poster', [AffiliateController::class, 'poster']);
});

// ---- Staff: BeCoolBox Mall inventory (Module 2) ----
Route::middleware(['auth:sanctum', 'role:staff,admin'])->prefix('staff/mall')->group(function () {
    Route::get('/inventory', [StaffMallController::class, 'inventory']);
});

// ---- Staff: delivery dispatch + today's sales (item 4) ----
Route::middleware(['auth:sanctum', 'role:staff,admin'])->prefix('staff')->group(function () {
    Route::get('/deliveries/unassigned', [StaffDeliveryController::class, 'unassigned']);
    Route::post('/deliveries/{id}/assign', [StaffDeliveryController::class, 'assign']);
    Route::get('/sales/today', [StaffDeliveryController::class, 'todaySales']);
    Route::get('/dashboard', [StaffDashboardController::class, 'index']);

    // Staff operations: dispatch, incidents, status board, tickets
    Route::get('/ops/overview', [StaffOpsController::class, 'overview']);
    Route::get('/ops/incidents', [StaffOpsController::class, 'incidents']);
    Route::post('/ops/incidents/{id}/resolve', [StaffOpsController::class, 'resolveIncident'])->whereNumber('id');
    Route::get('/ops/dispatch', [StaffOpsController::class, 'dispatch']);
    Route::post('/ops/dispatch/{orderId}/assign', [StaffOpsController::class, 'assign'])->whereNumber('orderId');
    Route::get('/ops/status-board', [StaffOpsController::class, 'statusBoard']);
    Route::put('/ops/orders/{id}/status', [StaffOpsController::class, 'forceStatus'])->whereNumber('id');
    Route::get('/ops/tickets', [StaffOpsController::class, 'tickets']);
    Route::post('/ops/tickets/{id}/resolve', [StaffOpsController::class, 'resolveTicket'])->whereNumber('id');
    Route::get('/ops/hazards', [StaffOpsController::class, 'hazards']);
    Route::post('/ops/hazards', [StaffOpsController::class, 'setHazards']);
});

// ---- Admin: banner management ----
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/banners', [BannerController::class, 'adminIndex']);
    Route::post('/banners', [BannerController::class, 'store']);
    Route::put('/banners/{id}', [BannerController::class, 'update'])->whereNumber('id');
    Route::delete('/banners/{id}', [BannerController::class, 'destroy'])->whereNumber('id');

    // Admin settings
    Route::get('/settings', [AdminSettingsController::class, 'index']);
    Route::put('/settings', [AdminSettingsController::class, 'update']);

    // Admin categories
    Route::post('/categories', [AdminSettingsController::class, 'storeCategory']);
    Route::put('/categories/{id}', [AdminSettingsController::class, 'updateCategory'])->whereNumber('id');
    Route::delete('/categories/{id}', [AdminSettingsController::class, 'destroyCategory'])->whereNumber('id');

    // Admin ad oversight
    Route::get('/ads', [AdminAdController::class, 'index']);
    Route::put('/ads/{id}', [AdminAdController::class, 'update'])->whereNumber('id');
    Route::delete('/ads/{id}', [AdminAdController::class, 'destroy'])->whereNumber('id');
    Route::put('/ads/{id}/status', [AdminAdController::class, 'setStatus'])->whereNumber('id');
    Route::put('/ad-rates', [AdminAdController::class, 'updateRates']);
    Route::post('/merchants/{id}/grant-credits', [AdminAdController::class, 'grantCredits'])->whereNumber('id');
});

// ---- Rider (Rider PWA) ----
Route::middleware(['auth:sanctum', 'role:rider,admin'])->prefix('rider')->group(function () {
    Route::post('/telemetry', [RiderController::class, 'telemetry']);
    Route::get('/batches', [RiderController::class, 'batches']);
    Route::post('/batches/{batchCode}/parcels/{parcelId}/deliver', [RiderController::class, 'markDelivered']);
    Route::get('/wallet', [RiderController::class, 'wallet']);

    // Doorstep delivery assignments (item 3)
    Route::get('/deliveries/history', [RiderDeliveryController::class, 'history']);
    Route::get('/deliveries', [RiderDeliveryController::class, 'index']);
    Route::post('/deliveries/{id}/refuse', [RiderDeliveryController::class, 'refuse']);
    Route::post('/deliveries/{id}/out-for-delivery', [RiderDeliveryController::class, 'outForDelivery']);
    Route::post('/deliveries/{id}/deliver', [RiderDeliveryController::class, 'deliver']);

    // Emergency report (item 11)
    Route::post('/emergency', [RiderController::class, 'emergency']);
});

// ---- Merchant ----
Route::middleware(['auth:sanctum', 'role:merchant,admin'])->group(function () {
    Route::get('/merchant/returns', function (Illuminate\Http\Request $request) {
        $parcels = \App\Models\Parcel::where('shipper_name', $request->user()->name)
            ->where('status', 'returned')
            ->latest()
            ->paginate(20);

        return response()->json($parcels);
    });
});

// ---- Provider (Skilled Worker) ----
Route::middleware(['auth:sanctum', 'role:provider,admin'])->prefix('bookings')->group(function () {
    Route::post('/{id}/accept', [BookingController::class, 'accept']);
    Route::post('/{id}/complete', [BookingController::class, 'complete']);
});

// ---- Admin (Platform) ----
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/overview', [AdminController::class, 'overview']);
    Route::get('/delivery-rate-settings', [AdminController::class, 'rateSettings']);
    Route::put('/delivery-rate-settings/{id}', [AdminController::class, 'updateRateSetting']);
    Route::post('/hubs', [AdminController::class, 'createHub']);
    Route::get('/users', [AdminController::class, 'users']);

    // Promo CRUD (FR-PROMO-001..003)
    Route::get('/promos', [PromoController::class, 'index']);
    Route::post('/promos', [PromoController::class, 'store']);
    Route::post('/promos/{id}/toggle', [PromoController::class, 'toggle']);

    // Module 1: Merchant verification workflow
    Route::get('/merchants/pending', [AdminMerchantController::class, 'pending']);
    Route::post('/merchants/{id}/approve', [AdminMerchantController::class, 'approve']);
    Route::post('/merchants/{id}/reject', [AdminMerchantController::class, 'reject']);

    // Module 2: BeCoolBox Mall product CRUD
    Route::get('/mall/products', [AdminMallController::class, 'index']);
    Route::post('/mall/products', [AdminMallController::class, 'store']);
    Route::put('/mall/products/{id}', [AdminMallController::class, 'update']);
    Route::delete('/mall/products/{id}', [AdminMallController::class, 'destroy']);

    // Item 5: Rider management
    Route::get('/riders', [AdminRiderController::class, 'index']);
    Route::get('/riders/{id}', [AdminRiderController::class, 'show']);
    Route::put('/riders/{id}', [AdminRiderController::class, 'update']);
    Route::delete('/riders/{id}', [AdminRiderController::class, 'destroy']);

    // Item 5: Merchant management
    Route::get('/merchants', [AdminMerchantController::class, 'index']);
    Route::get('/merchants/{id}', [AdminMerchantController::class, 'show']);
    Route::put('/merchants/{id}', [AdminMerchantController::class, 'update']);
    Route::delete('/merchants/{id}', [AdminMerchantController::class, 'destroy']);
    Route::post('/merchants/{id}/activate', [AdminMerchantController::class, 'activate']);
    Route::post('/merchants/{id}/deactivate', [AdminMerchantController::class, 'deactivate']);

    // Any role's referral poster
    Route::get('/affiliate/referral-qr/poster', [AffiliateController::class, 'poster']);

    // Affiliate commission tracking + cash-out management
    Route::get('/affiliates', [AdminAffiliateController::class, 'index']);
    Route::get('/affiliates/cash-outs', [AdminAffiliateController::class, 'cashOuts']);
    Route::post('/affiliates/cash-outs/{id}/approve', [AdminAffiliateController::class, 'approveCashOut'])->whereNumber('id');
    Route::post('/affiliates/cash-outs/{id}/decline', [AdminAffiliateController::class, 'declineCashOut'])->whereNumber('id');
    Route::post('/affiliates/{id}/activate', [AdminAffiliateController::class, 'activate'])->whereNumber('id');
});
