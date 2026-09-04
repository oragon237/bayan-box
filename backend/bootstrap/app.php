<?php

use App\Http\Middleware\EnsureNotUnderMaintenance;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\LogContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // RBAC route guard alias (PRD section 2)
        $middleware->alias([
            'role' => EnsureRole::class,
            'maintenance' => EnsureNotUnderMaintenance::class,
        ]);

        $middleware->append(LogContext::class);

        $middleware->statefulApi();

        // Guests hitting protected routes must never be redirected to a
        // (non-existent) named `login` route — that throws a 500. API
        // consumers (PWA) handle auth client-side.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // API requests must never be redirected to a (non-existent) `login`
        // route — unauthenticated API calls return a clean JSON 401.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })
    ->create();
