<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = [
            'request_id' => Str::uuid()->toString(),
            'ip' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
        ];

        if ($request->user()) {
            $context['user_id'] = $request->user()->id;
            $context['user_role'] = $request->user()->role;
        }

        Log::withContext($context);

        $response = $next($request);

        if ($response->isServerError()) {
            Log::error('Request resulted in a '.$response->getStatusCode().' response', [
                'status' => $response->getStatusCode(),
                'duration_ms' => defined('LARAVEL_START')
                    ? (int) ((microtime(true) - LARAVEL_START) * 1000)
                    : null,
            ]);
        }

        return $response;
    }
}