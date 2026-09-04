<?php

namespace App\Http\Middleware;

use App\Services\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Emergency maintenance mode (admin → settings → System Toggles).
 * While toggles.maintenance_mode is on, the wrapped public routes answer
 * 503 for guests and customers; admin/staff pass through so the console
 * (and the switch itself) stays usable.
 */
class EnsureNotUnderMaintenance
{
    public function __construct(
        protected SystemSettingService $settings,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! (bool) $this->settings->value('toggles', 'maintenance_mode', false)) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && in_array($user->role, ['admin', 'staff'], true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Habi is undergoing emergency maintenance. Please check back shortly.',
            'maintenance' => true,
        ], 503)->header('Retry-After', '1800');
    }
}
