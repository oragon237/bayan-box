<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * In-app notification endpoints (item 11).
 */
class NotificationController extends Controller
{
    /**
     * GET /api/notifications — my notifications.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Notification::where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * GET /api/notifications/unread-count — badge count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)->unread()->count();

        return response()->json(['unread' => $count]);
    }

    /**
     * POST /api/notifications/{id}/read — mark one read.
     */
    public function markRead(int $id, Request $request): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked read.']);
    }

    /**
     * POST /api/notifications/read-all — mark all read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)->unread()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked read.']);
    }
}