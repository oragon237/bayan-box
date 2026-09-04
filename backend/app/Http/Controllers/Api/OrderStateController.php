<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RiderLocation;
use App\Models\User;
use App\Services\DeliveryAssignmentService;
use App\Services\OrderStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Order lifecycle state machine endpoints (per-role transitions).
 */
class OrderStateController extends Controller
{
    public function __construct(
        protected OrderStateMachine $machine,
        protected DeliveryAssignmentService $assignments,
    ) {}

    /**
     * GET /api/orders/{id}/state — current lifecycle state + allowed actions.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $order = Order::with(['customer:id,name,phone', 'rider:id,name,phone', 'hub:id,name'])->findOrFail($id);

        return response()->json([
            'order' => $order,
            'delivery_state' => $order->delivery_state,
            'allowed_actions' => $this->allowedActions($order, $request->user()->role),
        ]);
    }

    /**
     * GET /api/orders/{id}/track — live delivery tracker payload:
     * merchant pickup point, drop-off point, latest rider GPS position
     * (with staleness badge), and a buffered ETA range (FR-MAP-001..004).
     */
    public function track(int $id, Request $request): JsonResponse
    {
        $order = Order::with([
            'customer:id,name,phone',
            'rider:id,name,phone',
            'items.product:id,name,merchant_id',
            'items.product.merchant:id,name,barangay,municipality,latitude,longitude',
        ])->findOrFail($id);

        $user = $request->user();
        $isParticipant = $order->customer_id === $user->id
            || $order->rider_id === $user->id
            || in_array($user->role, ['staff', 'admin'], true);
        abort_unless($isParticipant, 403, 'You cannot track this order.');

        $merchant = $order->items->first()?->product?->merchant;

        $activeStates = ['raider_assigned', 'raider_en_route_to_merchant', 'at_merchant', 'in_transit', 'arrived'];

        $riderLocation = $order->rider_id
            ? RiderLocation::where('rider_id', $order->rider_id)->latest('recorded_at')->first(['id', 'rider_id', 'latitude', 'longitude', 'recorded_at'])
            : null;

        // Live tracking only runs while the delivery is mid-flight. Rider live
        // GPS is exposed only during that window (and never from a stale fix),
        // so a past order can't be used to keep following the rider afterwards.
        $live = $order->fulfillment_type === Order::FULFILLMENT_DELIVERY
            && in_array($order->delivery_state, $activeStates, true);

        $rider = null;
        if ($order->rider) {
            $isStale = false;
            $lastSeenLabel = null;
            if ($riderLocation) {
                $minutesAgo = (int) $riderLocation->recorded_at->diffInMinutes(now());
                $isStale = $minutesAgo > 15;
                $lastSeenLabel = $isStale ? "Last seen {$minutesAgo} mins ago" : 'seen just now';
            }
            $useGps = $live && $riderLocation !== null && !$isStale;
            $rider = [
                'id' => $order->rider->id,
                'name' => $order->rider->name,
                'phone' => $order->rider->phone,
                'latitude' => $useGps ? $riderLocation->latitude : null,
                'longitude' => $useGps ? $riderLocation->longitude : null,
                'is_stale' => $isStale,
                'last_seen_label' => $lastSeenLabel,
                'last_seen_at' => $useGps ? $riderLocation->recorded_at : null,
                'active_orders' => Order::whereIn('delivery_state', $activeStates)->where('rider_id', $order->rider->id)->count(),
            ];
        }

        $headingTo = null;
        if ($live) {
            $headingTo = in_array($order->delivery_state, ['raider_assigned', 'raider_en_route_to_merchant'], true)
                ? 'merchant'
                : 'customer';
        }

        $destCoords = [$order->longitude, $order->latitude];
        $originCoords = $merchant?->longitude && $merchant?->latitude
            ? [$merchant->longitude, $merchant->latitude]
            : null;
        $fromCoords = ($rider['latitude'] ?? null)
            ? [$rider['longitude'], $rider['latitude']]
            : $originCoords;

        $eta = null;
        if ($live && $fromCoords && $destCoords[0]) {
            $km = $this->haversineKm((float) $fromCoords[1], (float) $fromCoords[0], (float) $destCoords[1], (float) $destCoords[0]);
            $rawMinutes = ($km / 25) * 60; // provincial average speed
            $buffered = $rawMinutes * (float) config('bayanbox.eta.buffer_multiplier', 1.30);
            $spread = (int) config('bayanbox.eta.range_spread_minutes', 7);
            $eta = [
                'min' => max(1, (int) round($buffered - $spread / 2)),
                'max' => max(2, (int) round($buffered + $spread / 2)),
            ];
        }

        return response()->json([
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'delivery_state' => $order->delivery_state,
                'fulfillment_type' => $order->fulfillment_type,
                'payment_method' => $order->payment_method,
                'total_amount' => $order->total_amount,
                'created_at' => $order->created_at,
            ],
            'items' => $order->items->map(fn ($i) => [
                'name' => $i->product?->name,
                'quantity' => $i->quantity,
            ]),
            'merchant' => $merchant ? [
                'id' => $merchant->id,
                'name' => $merchant->name,
                'barangay' => $merchant->barangay,
                'municipality' => $merchant->municipality,
                'latitude' => $merchant->latitude,
                'longitude' => $merchant->longitude,
            ] : null,
            'destination' => [
                'address' => $order->delivery_address,
                'latitude' => $order->latitude,
                'longitude' => $order->longitude,
                'customer' => $order->customer?->only(['id', 'name', 'phone']),
            ],
            'rider' => $rider,
            'heading_to' => $headingTo,
            'live' => $live,
            'eta' => $eta,
        ]);
    }

    protected function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 6371 * 2 * asin(min(1, sqrt($a)));
    }

    /**
     * POST /api/orders/{id}/state/{action} — perform a state transition.
     */
    public function transition(int $id, string $action, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
            'to' => 'nullable|in:'.implode(',', $this->allStates()),
            'pin' => 'nullable|string|max:8',
            'photo_url' => 'nullable|string|max:255',
        ]);

        // Assignment is the one transition that also needs a real rider
        // record. Keep it in the delivery-assignment service so the legacy
        // status and detailed delivery state always advance together.
        if ($action === 'assign_raider') {
            if (! in_array($request->user()->role, ['staff', 'admin'], true)) {
                abort(403, 'Only staff or administrators can assign a rider.');
            }

            $riderId = $request->validate([
                'rider_id' => 'required|integer|exists:users,id',
            ])['rider_id'];
            $rider = User::findOrFail($riderId);
            $order = $this->assignments->assignTo($order, $rider, 'manual', $request->user()->id);

            return response()->json([
                'message' => "Order #{$order->id} assigned to {$rider->name}.",
                'delivery_state' => $order->delivery_state,
                'order' => $order,
            ]);
        }

        $order = $this->machine->transition($order, $action, $request->user(), $validated);

        return response()->json([
            'message' => "Order #{$order->id} moved to {$order->delivery_state}.",
            'delivery_state' => $order->delivery_state,
            'order' => $order,
        ]);
    }

    /**
     * POST /api/orders/{id}/generate-pin — generate a one-time delivery PIN.
     */
    public function generatePin(int $id, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);

        if (! in_array($request->user()->role, ['staff', 'admin', 'rider'], true)) {
            abort(403, 'Only staff, admin, or the assigned rider can generate a delivery PIN.');
        }

        $pin = $this->machine->generatePin($order);

        return response()->json(['pin' => $pin, 'message' => "Delivery PIN: {$pin}. Share this with the customer."]);
    }

    protected function allowedActions(Order $order, string $role): array
    {
        $state = $order->delivery_state;
        $actions = [];

        if ($role === 'customer' && $state === Order::STATE_PENDING_MERCHANT) {
            $actions[] = 'cancel';
        }
        if (in_array($role, ['merchant', 'admin'], true)) {
            if ($state === Order::STATE_PENDING_MERCHANT) { $actions[] = 'accept'; $actions[] = 'reject'; }
            if ($state === Order::STATE_PREPARING) { $actions[] = 'mark_ready'; }
        }
        if ($role === 'staff' && $this->isOfficialMallOrder($order)) {
            if ($state === Order::STATE_PENDING_MERCHANT) { $actions[] = 'accept'; $actions[] = 'reject'; }
            if ($state === Order::STATE_PREPARING) { $actions[] = 'mark_ready'; }
            if ($state === Order::STATE_READY_FOR_PICKUP && $order->fulfillment_type === Order::FULFILLMENT_PICKUP) { $actions[] = 'confirm_collection'; }
        }
        if (in_array($role, ['staff', 'admin'], true)) {
            if (in_array($state, [Order::STATE_READY_FOR_PICKUP], true)) { $actions[] = 'assign_raider'; }
            $actions[] = 'force_cancel';
        }
        if ($role === 'rider') {
            if ($state === Order::STATE_RAIDER_ASSIGNED) { $actions[] = 'depart_to_merchant'; }
            if ($state === Order::STATE_RAIDER_EN_ROUTE) { $actions[] = 'arrive_merchant'; }
            if ($state === Order::STATE_AT_MERCHANT) { $actions[] = 'pickup_order'; }
            if ($state === Order::STATE_IN_TRANSIT) { $actions[] = 'arrive_customer'; }
            if ($state === Order::STATE_ARRIVED) { $actions[] = 'complete_delivery'; }
        }

        return $actions;
    }

    /**
     * Mall fulfillment is delegated to staff only when every line item is an
     * official Mall product; mixed and merchant orders remain merchant-owned.
     */
    protected function isOfficialMallOrder(Order $order): bool
    {
        $items = $order->items()->with('product:id,is_official_mall')->get();

        return $items->isNotEmpty()
            && $items->every(fn ($item) => (bool) $item->product?->is_official_mall);
    }

    protected function allStates(): array
    {
        return [
            Order::STATE_PENDING_MERCHANT, Order::STATE_PREPARING, Order::STATE_READY_FOR_PICKUP,
            Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE, Order::STATE_AT_MERCHANT,
            Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED, Order::STATE_DELIVERED, Order::STATE_CANCELLED,
        ];
    }
}
