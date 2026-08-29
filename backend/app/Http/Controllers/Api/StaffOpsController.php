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
        $inTransit = Order::whereIn('status', ['assigned', 'out_for_delivery'])->count();
        $emergencyAlerts = IncidentReport::where('status', 'open')->count();
        $unassigned = Order::where('fulfillment_type', 'delivery')
            ->whereIn('status', ['paid', 'pending_payment'])
            ->whereNull('rider_id')->count();

        return response()->json([
            'active_riders' => $onlineRiders,
            'deliveries_in_transit' => $inTransit,
            'emergency_alerts' => $emergencyAlerts,
            'unassigned_orders' => $unassigned,
        ]);
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
        $readyOrders = Order::with(['customer:id,name,phone', 'items.product:id,name'])
            ->where('fulfillment_type', 'delivery')
            ->whereIn('status', ['paid', 'pending_payment'])
            ->whereNull('rider_id')
            ->orderByDesc('created_at')
            ->get();

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
            $order->update(['rider_id' => $rider->id, 'status' => 'assigned']);

            return response()->json(['message' => "Assigned to {$rider->name}.", 'order' => $order->fresh()]);
        }

        // Auto: round-robin (nearest = fewest active orders)
        $rider = $this->assignments->assign($order);

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
            'ready_for_pickup' => ['paid', 'pending_payment'],
            'in_transit' => ['assigned', 'out_for_delivery'],
            'delivered' => ['delivered', 'completed'],
            'failed_returned' => ['disputed', 'cancelled'],
        ];

        $result = [];
        foreach ($states as $label => $statuses) {
            $result[$label] = Order::with(['customer:id,name', 'items.product:id,name'])
                ->where('fulfillment_type', 'delivery')
                ->whereIn('status', $statuses)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'customer' => $o->customer,
                    'items' => $o->items,
                    'status' => $o->status,
                    'rider_id' => $o->rider_id,
                    'created_at' => $o->created_at,
                    'estimated_delivery_minutes' => 45,
                    'elapsed_minutes' => $o->status === 'out_for_delivery' ? max(0, now()->diffInMinutes($o->updated_at)) : 0,
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
            'status' => 'required|in:assigned,out_for_delivery,delivered,disputed,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $validated['status']]);

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
        $ticket->update(['status' => $validated['action'], 'resolution_note' => $validated['note']]);

        return response()->json(['message' => 'Ticket resolved.', 'ticket' => $ticket->fresh()]);
    }

    /**
     * POST /api/staff/ops/hazards — toggle a barangay hazard zone.
     */
    public function setHazards(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'zones' => 'required|array',
            'zones.*.name' => 'required|string|max:100',
            'zones.*.impassable' => 'required|boolean',
        ]);

        $this->settings->set('hazards', ['zones' => $validated['zones']]);

        return response()->json(['message' => 'Hazard zones updated.', 'zones' => $validated['zones']]);
    }

    /**
     * GET /api/staff/ops/hazards — current hazard zones.
     */
    public function hazards(): JsonResponse
    {
        return response()->json(['zones' => $this->settings->get('hazards')['zones'] ?? []]);
    }
}