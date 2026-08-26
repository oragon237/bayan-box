<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DeliveryPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(
        protected DeliveryPricingService $pricing,
    ) {}

    /**
     * POST /api/delivery/calculate
     *
     * Real-time doorstep surcharge calculator (FR-CALC-001..006).
     * Called by the DeliveryCostPreview React component.
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin_lat' => 'required|numeric|between:-90,90',
            'origin_lng' => 'required|numeric|between:-180,180',
            'dest_lat' => 'required|numeric|between:-90,90',
            'dest_lng' => 'required|numeric|between:-180,180',
            'municipality' => 'nullable|string|max:100',
        ]);

        $quote = $this->pricing->calculateFee(
            (float) $validated['origin_lat'],
            (float) $validated['origin_lng'],
            (float) $validated['dest_lat'],
            (float) $validated['dest_lng'],
            $validated['municipality'] ?? null,
        );

        return response()->json($quote);
    }
}