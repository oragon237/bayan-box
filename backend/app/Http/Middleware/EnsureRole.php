<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Multi-role RBAC gate (PRD section 2).
 *
 * Usage (routes/api.php):
 *   Route::middleware(['auth:sanctum', 'role:staff'])->...
 *   Route::middleware(['auth:sanctum', 'role:admin,staff'])->...
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $allowed = array_map(
            fn (string $r) => Role::tryFrom($r)?->value ?? $r,
            $roles,
        );

        if (! $user->hasRole(...$allowed)) {
            return response()->json([
                'message' => 'Forbidden — your role does not permit this action.',
                'role' => $user->role,
                'required_roles' => $allowed,
            ], 403);
        }

        return $next($request);
    }
}
