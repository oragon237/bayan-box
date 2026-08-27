<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminMerchantController;
use App\Http\Controllers\Api\AdminMallController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\HubController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\MarketplaceController;
use App\Http\Controllers\Api\MerchantProductController;
use App\Http\Controllers\Api\OfflineSyncController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\StaffMallController;
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
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/track/{tracking}', [TrackingController::class, 'show']);

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

    // Offline sync queue (FR-OFF-001/002)
    Route::post('/sync/offline-queue', [OfflineSyncController::class, 'sync']);

    // Bookings (PRD 2.6)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);

    // Image upload (Phase A)
    Route::post('/upload', [UploadController::class, 'store']);

    // Marketplace storefront + cart + checkout (PRD v4 §3.7)
    Route::get('/products', [MarketplaceController::class, 'index']);
    Route::get('/products/categories', [MarketplaceController::class, 'categories']);
    Route::get('/products/{id}', [MarketplaceController::class, 'show'])->whereNumber('id');
    Route::get('/products/{id}/reviews', [ProductReviewController::class, 'index'])->whereNumber('id');
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

// ---- Rider (Rider PWA) ----
Route::middleware(['auth:sanctum', 'role:rider,admin'])->prefix('rider')->group(function () {
    Route::post('/telemetry', [RiderController::class, 'telemetry']);
    Route::get('/batches', [RiderController::class, 'batches']);
    Route::post('/batches/{batchCode}/parcels/{parcelId}/deliver', [RiderController::class, 'markDelivered']);
    Route::get('/wallet', [RiderController::class, 'wallet']);
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

    // Any role's referral poster
    Route::get('/affiliate/referral-qr/poster', [AffiliateController::class, 'poster']);
});
