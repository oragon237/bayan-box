<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversionController extends Controller
{
    public static function contextRules(string $prefix = ''): array
    {
        $rules = [$prefix.'session_id' => 'required|uuid'];
        foreach (['utm_source', 'utm_medium', 'utm_campaign'] as $field) {
            $rules[$prefix.$field] = ['nullable', 'string', 'max:80', 'regex:/^[a-zA-Z0-9_. -]+$/'];
        }
        return $rules;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(array_merge(self::contextRules(), [
            'event_id' => 'required|uuid',
            // Orders can only be recorded by successful server-side checkout.
            'event' => 'required|in:visit,view_item,add_to_cart,begin_checkout,checkout_error,select_area',
            'product_id' => 'nullable|integer|min:1',
            'quantity' => 'nullable|integer|min:1|max:100',
        ]));
        DB::table('conversion_events')->insertOrIgnore([...$data, 'created_at' => now()]);
        return response()->json(['ok' => true]);
    }

    public function report(): JsonResponse
    {
        $since = now()->subDays(30);
        $events = DB::table('conversion_events')->where('created_at', '>=', $since);
        $stages = (clone $events)->select('event')->selectRaw('COUNT(*) as events, COUNT(DISTINCT session_id) as sessions')
            ->groupBy('event')->get();
        $sources = (clone $events)->where('event', 'order_placed')->select('utm_source', 'utm_medium', 'utm_campaign')
            ->selectRaw('COUNT(*) as orders')->groupBy('utm_source', 'utm_medium', 'utm_campaign')->orderByDesc('orders')->limit(20)->get();
        $orders = DB::table('conversion_events as e')->join('orders as o', 'o.id', '=', 'e.order_id')
            ->where('e.created_at', '>=', $since)->where('e.event', 'order_placed');
        $completed = (clone $orders)->where(function ($q) {
            $q->where('o.status', 'completed')->orWhere('o.delivery_state', 'delivered')->orWhere('o.fulfillment_status', 'delivered');
        })->whereNotIn('o.status', ['cancelled', 'refunded'])->count();
        return response()->json(['days' => 30, 'stages' => $stages, 'sources' => $sources, 'completed_orders' => $completed]);
    }
}
