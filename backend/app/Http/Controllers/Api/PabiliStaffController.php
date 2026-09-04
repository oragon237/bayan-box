<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PabiliItem;
use App\Models\PabiliRequest;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Staff console for Pabili requests: review incoming lists and confirm the
 * price (per line + delivery fee) so the customer can approve.
 */
class PabiliStaffController extends Controller
{
    /**
     * GET /api/staff/ops/pabili — queue (pending first when no filter).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PabiliRequest::with(['items', 'customer:id,name,phone,barangay,municipality'])
            ->whereIn('status', [
                PabiliRequest::STATUS_PENDING,
                PabiliRequest::STATUS_QUOTED,
                PabiliRequest::STATUS_APPROVED,
                PabiliRequest::STATUS_CONVERTED,
                PabiliRequest::STATUS_DECLINED,
            ]);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $data = $query
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->limit(100)
            ->get();

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/staff/ops/pabili/{id}/quote — confirm prices. Payload:
     * { items: { "<item_id>": { price, note? } }, shipping_fee, quote_note? }
     */
    public function quote(Request $request, int $id, NotificationService $notifications): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.note' => 'nullable|string|max:255',
            'shipping_fee' => 'required|numeric|min:0',
            'quote_note' => 'nullable|string|max:500',
        ]);

        $pabili = PabiliRequest::with('items')->findOrFail($id);
        abort_unless(
            in_array($pabili->status, [PabiliRequest::STATUS_PENDING, PabiliRequest::STATUS_QUOTED], true),
            422,
            'This request is no longer open for quoting.',
        );

        $own = $pabili->items->keyBy('id');
        foreach ($validated['items'] as $itemId => $line) {
            abort_unless($own->has((int) $itemId), 422, "Item {$itemId} does not belong to this request.");
        }
        abort_unless(count($validated['items']) === $own->count(), 422, 'Every listed item needs a confirmed price.');

        $staffId = $request->user()->id;

        DB::transaction(function () use ($pabili, $validated, $staffId) {
            foreach ($validated['items'] as $itemId => $line) {
                PabiliItem::where('pabili_request_id', $pabili->id)
                    ->whereKey($itemId)
                    ->update(['quoted_price' => $line['price'], 'staff_note' => $line['note'] ?? null]);
            }

            $pabili->update([
                'status' => PabiliRequest::STATUS_QUOTED,
                'quoted_total' => round((float) collect($validated['items'])->sum('price'), 2),
                'quoted_shipping' => round((float) $validated['shipping_fee'], 2),
                'quoted_by_id' => $staffId,
                'quote_note' => $validated['quote_note'] ?? null,
                'quoted_at' => now(),
            ]);
        });
        $pabili->load('items');

        $notifications->send(
            $pabili->customer_id,
            "Pabili #{$pabili->id}: price confirmed 🧾",
            'Total ₱'.number_format((float) $pabili->quoted_total + (float) $pabili->quoted_shipping, 2).' incl. delivery. Open Pabili to approve.',
            'pabili_quoted',
            '🧾',
            ['pabili_id' => $pabili->id],
        );

        return response()->json([
            'message' => 'Quote saved — waiting for the customer to approve.',
            'pabili' => $pabili,
        ]);
    }
}
