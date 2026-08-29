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
 * Staff financial operations: record rider COD remittances (cash dropped
 * at the hub) and view rider COD reconciliation.
 */
class StaffFinanceController extends Controller
{
    /**
     * GET /api/staff/finance — rider COD summary (collected vs remitted).
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
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'rider_name' => $r->rider?->name,
                'amount' => (float) $r->amount,
                'notes' => $r->notes,
                'recorded_by' => $r->recorder?->name,
                'created_at' => $r->created_at,
            ]);

        return response()->json([
            'riders' => $summary,
            'recent' => $recent,
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
