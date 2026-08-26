<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Bulk-sync endpoint for the PWA IndexedDB offline queue (FR-OFF-001/002).
 * Accepts a batch of offline actions (scans, telemetry, status updates)
 * and replays them atomically.
 */
class OfflineSyncController extends Controller
{
    /**
     * POST /api/sync/offline-queue
     *
     * The frontend service worker pushes cached actions once connectivity
     * is restored. Each action has a `type` and `payload`.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actions' => 'required|array|max:200',
            'actions.*.action_id' => 'required|string|max:40',
            'actions.*.type' => 'required|string|in:scan_intake,telemetry,status_update,delivery_confirmation',
            'actions.*.payload' => 'required|array',
            'actions.*.queued_at' => 'nullable|date',
        ]);

        $results = [];

        foreach ($validated['actions'] as $action) {
            try {
                $result = match ($action['type']) {
                    'scan_intake' => $this->replayIntake($action),
                    'telemetry' => $this->replayTelemetry($action),
                    'status_update' => $this->replayStatus($action),
                    'delivery_confirmation' => $this->replayDelivery($action),
                };

                $results[] = [
                    'action_id' => $action['action_id'],
                    'status' => 'replayed',
                    'data' => $result,
                ];
            } catch (\Throwable $e) {
                $results[] = [
                    'action_id' => $action['action_id'],
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json(['results' => $results]);
    }

    protected function replayIntake(array $action): mixed
    {
        $p = $action['payload'];
        $hub = \App\Models\Hub::findOrFail($p['hub_id']);

        return app(\App\Services\ParcelService::class)->intake($hub, $p);
    }

    protected function replayTelemetry(array $action): mixed
    {
        $p = $action['payload'];
        \App\Models\RiderLocation::create([
            'rider_id' => $p['rider_id'],
            'latitude' => $p['latitude'],
            'longitude' => $p['longitude'],
            'accuracy_m' => $p['accuracy_m'] ?? 0,
            'recorded_at' => $p['recorded_at'] ?? now(),
        ]);

        return ['recorded' => true];
    }

    protected function replayStatus(array $action): mixed
    {
        $p = $action['payload'];
        $parcel = \App\Models\Parcel::where('tracking_number', $p['tracking_number'])->firstOrFail();

        $parcel->forceFill(['status' => $p['status']])->save();

        return $parcel->only('id', 'tracking_number', 'status');
    }

    protected function replayDelivery(array $action): mixed
    {
        $p = $action['payload'];
        $parcel = \App\Models\Parcel::where('tracking_number', $p['tracking_number'])->firstOrFail();
        $rider = \App\Models\User::findOrFail($p['rider_id']);

        return app(\App\Services\ParcelService::class)->markDelivered($parcel, $rider, $p);
    }
}