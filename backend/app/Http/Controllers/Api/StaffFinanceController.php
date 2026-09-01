<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RiderCodRemittance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Staff financial operations: track COD collected at the hub as well as
 * rider COD remittances.
 */
class StaffFinanceController extends Controller
{
    /**
     * GET /api/staff/finance — rider COD reconciliation plus completed
     * click-and-collect COD collections received at the hub.
     */
    public function summary(): JsonResponse
    {
        $riders = User::where('role', 'rider')->get(['id', 'name', 'phone']);

        $summary = $riders->map(function ($rider) {
            $collected = Order::where('rider_id', $rider->id)
                ->where('payment_method', 'cod')
                ->whereIn('status', ['delivered', 'completed'])
                ->get()
                ->sum(fn ($o) => (float) $o->total_amount + (float) $o->shipping_amount);

            $remitted = (float) RiderCodRemittance::where('rider_id', $rider->id)->sum('amount');

            return [
                'id' => $rider->id,
                'name' => $rider->name,
                'phone' => $rider->phone,
                'cod_collected' => round((float) $collected, 2),
                'remitted' => round($remitted, 2),
                'outstanding' => round((float) $collected - $remitted, 2),
            ];
        })->values()->all();

        $recent = RiderCodRemittance::with(['rider:id,name', 'recorder:id,name'])
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'rider_name' => $r->rider?->name,
                'amount' => (float) $r->amount,
                'notes' => $r->notes,
                'recorded_by' => $r->recorder?->name,
                'created_at' => $r->created_at,
            ]);

        $pickupCollections = Order::with(['hub:id,name,staff_id', 'hub.staff:id,name'])
            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP)
            ->where('payment_method', 'cod')
            ->whereIn('status', ['delivered', 'completed'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'display_id' => 'ORD-'.str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
                'hub_name' => $order->hub?->name ?? 'Hub not recorded',
                'collected_by' => $order->hub?->staff?->name ?? 'Hub staff',
                'amount' => round((float) $order->total_amount + (float) $order->shipping_amount, 2),
                'collected_at' => $order->updated_at,
            ]);

        $riderCollections = Order::with('rider:id,name')
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->where('payment_method', 'cod')
            ->whereIn('status', ['delivered', 'completed'])
            ->whereNotNull('rider_id')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($order) => [
                'id' => 'rider-order-'.$order->id,
                'recorded_at' => $order->updated_at,
                'type' => 'rider_cod_collection',
                'reference' => 'ORD-'.str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
                'collected_by' => $order->rider?->name ?? 'Rider',
                'amount' => round((float) $order->total_amount + (float) $order->shipping_amount, 2),
            ]);

        $pickupCollectionTransactions = $pickupCollections->map(fn ($collection) => [
            'id' => 'pickup-order-'.$collection['id'],
            'recorded_at' => $collection['collected_at'],
            'type' => 'hub_cod_collection',
            'reference' => $collection['display_id'],
            'collected_by' => $collection['collected_by'],
            'amount' => $collection['amount'],
        ]);

        $remittanceTransactions = $recent->map(fn ($remittance) => [
            'id' => 'remittance-'.$remittance['id'],
            'recorded_at' => $remittance['created_at'],
            'type' => 'rider_cod_remittance',
            'reference' => 'REM-'.str_pad((string) $remittance['id'], 5, '0', STR_PAD_LEFT),
            'collected_by' => $remittance['rider_name'] ?? 'Rider',
            'amount' => $remittance['amount'],
        ]);

        return response()->json([
            'riders' => $summary,
            'recent' => $recent,
            'pickup_collections' => $pickupCollections,
            'pickup_cod_collected' => round((float) $pickupCollections->sum('amount'), 2),
            'collection_transactions' => $pickupCollectionTransactions
                ->concat($riderCollections)
                ->concat($remittanceTransactions)
                ->sortByDesc('recorded_at')
                ->values(),
            'total_outstanding' => round(array_sum(array_column($summary, 'outstanding')), 2),
        ]);
    }

    /**
     * POST /api/staff/finance/remit — record cash received from a rider.
     */
    public function remit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'required|integer|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:255',
        ]);

        $rider = User::where('role', 'rider')->findOrFail($validated['rider_id']);

        $remittance = DB::transaction(function () use ($validated, $request, $rider) {
            $record = RiderCodRemittance::create([
                'rider_id' => $rider->id,
                'amount' => round((float) $validated['amount'], 2),
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $request->user()->id,
            ]);

            return $record->load(['rider:id,name', 'recorder:id,name']);
        });

        return response()->json([
            'message' => "COD remittance of ₱".number_format((float) $remittance->amount, 2)." recorded for {$rider->name}.",
            'remittance' => $remittance,
        ], 201);
    }
}
