<?php

use Illuminate\Support\Str;

// Auto-detect environment: when served from the live domain, never expose
// debug/stack traces even if APP_DEBUG is set true in .env.
$appUrl = (string) env('APP_URL', 'http://localhost:8000');
$isLive = Str::contains($appUrl, 'becoolbox.app');

return [
    'name' => env('APP_NAME', 'BeCoolBox'),

    'env' => env('APP_ENV', $isLive ? 'production' : 'local'),

    /*
    | Debug mode: enabled only on non-live hosts. Live (becoolbox.app) always
    | renders safe errors regardless of APP_DEBUG.
    */
    'debug' => (bool) env('APP_DEBUG', false) && ! $isLive,

    'url' => env('APP_URL', 'http://localhost:8000'),

    'timezone' => 'Asia/Manila',

    'locale' => 'en',

    'fallback_locale' => 'en',

    'faker_locale' => 'en_US',

    'key' => env('APP_KEY'),

    'cipher' => 'AES-256-CBC',

    'maintenance' => [
        'driver' => 'file',
    ],
];
