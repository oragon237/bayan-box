<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\RiderLocation;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\DeliveryAssignmentService;
use App\Services\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff operational dashboard: dispatch, incidents, status board, tickets.
 */
class StaffOpsController extends Controller
{
    public function __construct(
        protected DeliveryAssignmentService $assignments,
        protected SystemSettingService $settings,
    ) {}

    /**
     * GET /api/staff/ops/overview — KPI metrics.
     */
    public function overview(): JsonResponse
    {
        $onlineRiders = User::where('role', 'rider')->where('status', 'active')->count();
        $inTransit = Order::whereIn('delivery_state', [Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED])->count();
        $emergencyAlerts = IncidentReport::where('status', 'open')->count();
        $unassigned = Order::where('fulfillment_type', 'delivery')
            ->where('delivery_state', Order::STATE_READY_FOR_PICKUP)
            ->whereNull('rider_id')->count();
        $mallOrdersWaiting = $this->officialMallOrders()
            ->where(function ($query) {
                $query->whereIn('delivery_state', [Order::STATE_PENDING_MERCHANT, Order::STATE_PREPARING])
                    ->orWhere(function ($pickupOrders) {
                        $pickupOrders->where('delivery_state', Order::STATE_READY_FOR_PICKUP)
                            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP);
                    });
            })
            ->count();

        return response()->json([
            'active_riders' => $onlineRiders,
            'deliveries_in_transit' => $inTransit,
            'emergency_alerts' => $emergencyAlerts,
            'unassigned_orders' => $unassigned,
            'mall_orders_waiting' => $mallOrdersWaiting,
        ]);
    }

    /**
     * GET /api/staff/ops/mall-orders — all official Mall orders. Merchant and
     * mixed-store orders are excluded so staff see the same lifecycle scope
     * as a merchant sees for their own products.
     */
    public function mallOrders(): JsonResponse
    {
        $orders = $this->officialMallOrders()
            ->with([
                'customer:id,name,phone',
                'items.product:id,name,merchant_id,is_official_mall',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    /**
     * GET /api/staff/ops/incidents — open emergency reports.
     */
    public function incidents(): JsonResponse
    {
        return response()->json(
            IncidentReport::with(['rider:id,name,phone', 'order:id,status'])
                ->where('status', 'open')
                ->orderByDesc('created_at')
                ->get()
        );
    }

    /**
     * POST /api/staff/ops/incidents/{id}/resolve — close an incident.
     */
    public function resolveIncident(int $id, Request $request): JsonResponse
    {
        $incident = IncidentReport::findOrFail($id);
        $incident->update([
            'status' => 'resolved',
            'resolution_notes' => $request->input('notes'),
            'resolved_at' => now(),
        ]);

        return response()->json(['message' => 'Incident resolved.', 'incident' => $incident->fresh()]);
    }

    /**
     * GET /api/staff/ops/dispatch — ready orders + online riders with workload.
     */
    public function dispatch(): JsonResponse
    {
        $readyOrders = Order::with([
            'customer:id,name,phone,barangay,municipality',
            'items.product:id,name,merchant_id',
            'items.product.merchant:id,name,barangay,municipality,latitude,longitude',
        ])
            ->where('fulfillment_type', 'delivery')
            ->where('delivery_state', Order::STATE_READY_FOR_PICKUP)
            ->whereNull('rider_id')
            ->orderByDesc('created_at')
            ->get()
            ->each(function (Order $order) {
                $merchant = $order->items->first()?->product?->merchant;
                $order->setAttribute('merchant', $merchant ? [
                    'id' => $merchant->id,
                    'name' => $merchant->name,
                    'barangay' => $merchant->barangay,
                    'municipality' => $merchant->municipality,
                    'latitude' => $merchant->latitude,
                    'longitude' => $merchant->longitude,
                ] : null);
            });

        $riders = User::where('role', 'rider')->where('status', 'active')
            ->withCount(['deliveries as active_orders' => fn ($q) => $q->whereIn('status', ['assigned', 'out_for_delivery'])])
            ->get(['id', 'name', 'phone'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'phone' => $r->phone,
                'active_orders' => $r->active_orders,
                'latitude' => RiderLocation::where('rider_id', $r->id)->orderByDesc('recorded_at')->value('latitude'),
                'longitude' => RiderLocation::where('rider_id', $r->id)->orderByDesc('recorded_at')->value('longitude'),
            ]);

        return response()->json(['ready_orders' => $readyOrders, 'riders' => $riders]);
    }

    /**
     * POST /api/staff/ops/dispatch/{orderId}/assign — auto or manual assign.
     */
    public function assign(int $orderId, Request $request): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        // Manual: specific rider
        if ($request->input('rider_id')) {
            $rider = User::where('role', 'rider')->where('status', 'active')->findOrFail($request->input('rider_id'));
            $order = $this->assignments->assignTo($order, $rider, 'manual', $request->user()->id);

            return response()->json(['message' => "Assigned to {$rider->name}.", 'order' => $order]);
        }

        // Auto: round-robin (nearest = fewest active orders)
        $rider = $this->assignments->assign($order, $request->user()->id);

        if (! $rider) {
            return response()->json(['message' => 'No active riders available.'], 202);
        }

        return response()->json(['message' => "Auto-assigned to {$rider->name}.", 'order' => $order->fresh()]);
    }

    /**
     * GET /api/staff/ops/status-board — orders grouped by delivery state.
     */
    public function statusBoard(): JsonResponse
    {
        $states = [
            'ready_for_pickup' => [Order::STATE_READY_FOR_PICKUP],
            'rider_collecting' => [Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE, Order::STATE_AT_MERCHANT],
            'in_transit' => [Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED],
            'delivered' => [Order::STATE_DELIVERED],
            'failed_returned' => [Order::STATE_CANCELLED],
        ];

        $result = [];
        foreach ($states as $label => $statuses) {
            $result[$label] = Order::with(['customer:id,name', 'items.product:id,name'])
                ->where('fulfillment_type', 'delivery')
                ->whereIn('delivery_state', $statuses)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'customer' => $o->customer,
                    'items' => $o->items,
                    'status' => $o->status,
                    'delivery_state' => $o->delivery_state,
                    'rider_id' => $o->rider_id,
                    'created_at' => $o->created_at,
                    'estimated_delivery_minutes' => 45,
                    'elapsed_minutes' => in_array($o->delivery_state, [Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED], true)
                        ? max(0, now()->diffInMinutes($o->updated_at))
                        : 0,
                ]);
        }

        return response()->json($result);
    }

    /**
     * PUT /api/staff/ops/orders/{id}/status — force update status.
     */
    public function forceStatus(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:disputed,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'status' => $validated['status'],
            'delivery_state' => Order::STATE_CANCELLED,
            'fulfillment_status' => Order::FULFILL_CANCELLED,
        ]);

        return response()->json(['message' => 'Order status updated.', 'order' => $order->fresh()]);
    }

    /**
     * GET /api/staff/ops/tickets — open support tickets.
     */
    public function tickets(): JsonResponse
    {
        return response()->json(
            SupportTicket::with(['user:id,name,phone', 'order:id,status'])
                ->orderByDesc('created_at')
                ->get()
        );
    }

    /**
     * POST /api/staff/ops/tickets/{id}/resolve — resolve a ticket.
     */
    public function resolveTicket(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:refunded,redelivery,dismissed',
            'note' => 'required|string|max:255',
        ]);

        $ticket = SupportTicket::findOrFail($id);

        // Fix #2: a refunded ticket must reverse the original order payouts
        if ($validated['action'] === 'refunded' && $ticket->order_id) {
            $order = Order::find($ticket->order_id);
            if ($order) {
                app(\App\Services\WalletService::class)->refundOrder($order, $validated['note']);
            }
        }

        $ticket->update(['status' => $validated['action'], 'resolution_note' => $validated['note']]);

        return response()->json(['message' => 'Ticket resolved.', 'ticket' => $ticket->fresh()]);
    }

    /**
     * GET /api/staff/ops/history — all rider-assigned delivery transactions.
     */
    public function history(Request $request): JsonResponse
    {
        $query = Order::with([
            'customer:id,name,phone',
            'items.product:id,name,merchant_id',
            'items.product.merchant:id,name,barangay,municipality',
            'rider:id,name',
            'assignedBy:id,name',
        ])
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->whereNotNull('rider_id');

        // Status filter
        if ($request->input('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Date range
        if ($from = $request->input('startDate')) {
            $query->where('created_at', '>=', \Illuminate\Support\Carbon::parse($from)->startOfDay());
        }
        if ($to = $request->input('endDate')) {
            $query->where('created_at', '<=', \Illuminate\Support\Carbon::parse($to)->endOfDay());
        }

        // Search: order id, customer, merchant, rider
        if ($q = trim((string) $request->input('search'))) {
            $query->where(function ($qry) use ($q) {
                $qry->where('id', 'ilike', "%{$q}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'ilike', "%{$q}%"))
                    ->orWhereHas('items.product.merchant', fn ($m) => $m->where('name', 'ilike', "%{$q}%"))
                    ->orWhereHas('rider', fn ($r) => $r->where('name', 'ilike', "%{$q}%"));
            });
        }

        $orders = $query->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 10));

        $orders->getCollection()->transform(fn ($o) => [
            'id' => $o->id,
            'display_id' => 'ORD-'.str_pad((string) $o->id, 5, '0', STR_PAD_LEFT),
            'created_at' => $o->created_at->toDateTimeString(),
            'status' => $o->status,
            'delivery_state' => $o->delivery_state,
            'merchant' => $o->items?->first()?->product?->merchant,
            'customer' => $o->customer,
            'delivery_address' => $o->delivery_address,
            'rider' => $o->rider,
            'dispatch_method' => $o->dispatch_method ?? ($o->rider_id ? 'auto' : null),
            'assigned_by' => $o->assignedBy,
            'total_amount' => $o->total_amount,
            'shipping_amount' => $o->shipping_amount,
            'trip_duration_min' => $this->tripDuration($o),
            'payment_method' => $o->payment_method,
        ]);

        return response()->json($orders);
    }

    /**
     * GET /api/staff/ops/orders/{id}/audit — full lifecycle audit + POD.
     */
    public function audit(int $id): JsonResponse
    {
        $order = Order::with([
            'customer:id,name,phone',
            'items.product:id,name,merchant_id',
            'items.product.merchant:id,name',
            'rider:id,name,phone',
            'assignedBy:id,name',
        ])->findOrFail($id);

        // Customer rating/feedback from product reviews on this order's items
        $productIds = $order->items->pluck('product_id');
        $reviews = \App\Models\ProductReview::with('user:id,name')
            ->whereIn('product_id', $productIds)
            ->where('user_id', $order->customer_id)
            ->get();

        return response()->json([
            'order' => $order,
            'lifecycle' => [
                'order_placed' => $order->created_at?->toDateTimeString(),
                'merchant_ready' => $order->ready_at?->toDateTimeString(),
                'merchant_accepted' => $order->accepted_at?->toDateTimeString(),
                'picked_up' => $order->rider_pickup_at?->toDateTimeString(),
                'completed' => $order->updated_at?->toDateTimeString(),
                'cancelled_reason' => $order->cancel_reason,
            ],
            'proof_of_delivery' => [
                'pin' => $order->delivery_pin,
                'photo_url' => $order->delivery_photo_url,
                'dispatch_method' => $order->dispatch_method,
                'assigned_by' => $order->assignedBy?->name,
            ],
            'reviews' => $reviews->map(fn ($r) => [
                'user' => $r->user?->name,
                'rating' => $r->rating,
                'review' => $r->review,
                'created_at' => $r->created_at->toDateTimeString(),
            ]),
        ]);
    }

    protected function tripDuration(Order $o): ?int
    {
        $start = $o->ready_at ?? $o->created_at;
        $end = $o->status === 'delivered' ? $o->updated_at : null;

        return $start && $end ? max(0, $start->diffInMinutes($end)) : null;
    }

    /**
     * Restrict staff fulfillment to baskets made up exclusively of official
     * Mall stock. This mirrors the state-machine authorization rule.
     */
    protected function officialMallOrders()
    {
        return Order::query()
            ->whereHas('items.product', fn ($product) => $product->where('is_official_mall', true))
            ->whereDoesntHave('items.product', fn ($product) => $product->where('is_official_mall', false));
    }

    /**
     * GET /api/staff/ops/hazards — current hazard zones.
     */
    public function hazards(): JsonResponse
    {
        return response()->json(['zones' => $this->settings->get('hazards')['zones'] ?? []]);
    }
}
