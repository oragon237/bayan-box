<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PabiliRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * "Pabili" (buy-for-me) — customer requests for items not in the catalog.
 * Flow: customer submits → staff confirms prices (quote) → customer approves
 * → a real Order is created from the quote and it continues exactly like a
 * normal official-Mall order (staff marks ready → dispatch assigns a rider →
 * rider delivery + tracking).
 */
class PabiliController extends Controller
{
    public const PABILI_PRODUCT_NAME = 'Pabili (Buy-For-Me item)';

    /**
     * GET /api/pabili — the caller's own pabili history, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = PabiliRequest::with(['items', 'quotedBy:id,name'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json(['data' => $requests]);
    }

    /**
     * POST /api/pabili — create one request carrying one or more items.
     */
    public function store(Request $request, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1|max:15',
            'items.*.product_name' => 'required|string|max:160',
            'items.*.details' => 'nullable|string|max:500',
            'items.*.quantity' => 'nullable|integer|min:1|max:50',
            'items.*.max_price' => 'nullable|numeric|min:0|max:100000',
        ]);

        $user = $request->user();

        $pabili = DB::transaction(function () use ($validated, $user) {
            $pabili = PabiliRequest::create([
                'customer_id' => $user->id,
                'status' => PabiliRequest::STATUS_PENDING,
                'delivery_address' => trim(collect([$user->barangay, $user->municipality])->filter()->implode(', ')) ?: null,
                'latitude' => $user->latitude,
                'longitude' => $user->longitude,
                'notes' => $validated['notes'] ?? null,
            ]);

            $pabili->items()->createMany(
                collect($validated['items'])
                    ->map(fn ($i) => [
                        'product_name' => trim($i['product_name']),
                        'details' => trim($i['details'] ?? '') ?: null,
                        'quantity' => $i['quantity'] ?? 1,
                        'max_price' => $i['max_price'] ?? null,
                    ])
                    ->all()
            );

            return $pabili;
        });

        $notifications->sendToRole(
            'staff',
            "New Pabili request #{$pabili->id} from {$user->name}",
            $pabili->items->pluck('product_name')->take(5)->implode(', '),
            'pabili_new',
            '🧾',
            ['pabili_id' => $pabili->id],
        );

        return response()->json([
            'message' => 'Pabili request sent! A staff will confirm the price shortly.',
            'pabili' => $pabili->load('items'),
        ], 201);
    }

    /**
     * GET /api/pabili/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $pabili = PabiliRequest::with('items')
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($pabili);
    }

    /**
     * POST /api/pabili/{id}/approve — customer accepts the staff quote;
     * a real Order is created and the normal delivery pipeline takes over.
     */
    public function approve(Request $request, int $id, NotificationService $notifications): JsonResponse
    {
        $pabili = PabiliRequest::with('items')->where('customer_id', $request->user()->id)->findOrFail($id);

        abort_unless($pabili->status === PabiliRequest::STATUS_QUOTED, 422, 'This request has no confirmed price yet.');
        abort_if($pabili->order_id, 422, 'This request was already approved.');

        $items = $pabili->items->filter(fn ($i) => $i->quoted_price !== null);
        abort_if($items->isEmpty(), 422, 'The quote is missing prices.');

        $order = DB::transaction(function () use ($pabili, $items) {
            $product = $this->pabiliProduct();
            $subtotal = (float) $items->sum('quoted_price');

            $order = Order::create([
                'customer_id' => $pabili->customer_id,
                'total_amount' => round($subtotal, 2),
                'shipping_amount' => round((float) $pabili->quoted_shipping, 2),
                'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
                'delivery_state' => Order::STATE_PREPARING, // price already agreed; staff sources it
                'status' => 'paid',
                'fulfillment_status' => Order::FULFILL_ACCEPTED,
                'payment_method' => 'cod',
                'delivery_address' => $pabili->delivery_address,
                'latitude' => $pabili->latitude,
                'longitude' => $pabili->longitude,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item->quantity,
                    'price_at_purchase' => round((float) $item->quoted_price / max(1, $item->quantity), 2),
                ]);
            }

            $pabili->update([
                'status' => PabiliRequest::STATUS_CONVERTED,
                'approved_at' => now(),
                'order_id' => $order->id,
            ]);

            return $order;
        });

        $notifications->send(
            $pabili->customer_id,
            "Pabili #{$pabili->id} approved 🎉",
            'Your order is being prepared. Track it in My Orders.',
            'order',
            '🛒',
            ['order_id' => $order->id],
        );
        $notifications->sendToRole(
            'staff',
            "Pabili #{$pabili->id} approved by customer",
            'Order #'.$order->id.' is waiting to be marked ready.',
            'pabili_approved',
            '🧾',
            ['order_id' => $order->id, 'pabili_id' => $pabili->id],
        );

        return response()->json([
            'message' => 'Approved! Your order is on — you can follow it live now.',
            'pabili' => $pabili->fresh('items'),
            'order_id' => $order->id,
        ]);
    }

    /**
     * POST /api/pabili/{id}/decline — customer rejects the quoted price.
     */
    public function decline(Request $request, int $id, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate(['reason' => 'nullable|string|max:255']);

        $pabili = PabiliRequest::where('customer_id', $request->user()->id)->findOrFail($id);
        abort_unless($pabili->status === PabiliRequest::STATUS_QUOTED, 422, 'This request can no longer be declined.');

        $pabili->update(['status' => PabiliRequest::STATUS_DECLINED, 'decline_reason' => $validated['reason'] ?? null]);
        $pabili->items()->whereNotNull('quoted_price')->update(['quoted_price' => null]);

        $notifications->sendToRole(
            'staff',
            "Pabili #{$pabili->id} declined by customer",
            $validated['reason'] ?? null,
            'pabili_declined',
            '🧾',
            ['pabili_id' => $pabili->id],
        );

        return response()->json(['message' => 'Quote declined. Sorry about that!', 'pabili' => $pabili->fresh('items')]);
    }

    /**
     * POST /api/pabili/{id}/cancel — only while still pending (before a quote).
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $pabili = PabiliRequest::where('customer_id', $request->user()->id)->findOrFail($id);
        abort_unless($pabili->status === PabiliRequest::STATUS_PENDING, 422, 'This request can no longer be cancelled.');

        $pabili->update(['status' => PabiliRequest::STATUS_CANCELLED]);

        return response()->json(['message' => 'Pabili request cancelled.', 'pabili' => $pabili->load('items')]);
    }

    /**
     * Hidden catalog product that Pabili order lines ride on, so the regular
     * official-Mall order pipeline (mark-ready → dispatch → rider) applies.
     */
    protected function pabiliProduct(): Product
    {
        $mall = User::where('role', 'admin')->orderBy('id')->findOrFail(1);

        return Product::firstOrCreate(
            ['name' => self::PABILI_PRODUCT_NAME],
            [
                'merchant_id' => $mall->id,
                'description' => 'Buy-for-me item sourced by HABI partners based on a Pabili request.',
                'price' => 0,
                'stock' => 9999,
                'category' => 'Pabili',
                'status' => 'inactive', // never shoppable in the browsable catalog
                'is_official_mall' => true,
                'availability' => 'available',
                'suki_points_award' => 0,
                'affiliate_percentage' => 0,
            ],
        );
    }
}
