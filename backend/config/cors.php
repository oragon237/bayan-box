<?php

use Illuminate\Support\Str;

// Auto-detect environment from APP_URL.
$appUrl = (string) env('APP_URL', 'http://localhost:8000');
$isLive = Str::contains($appUrl, 'becoolbox.app');

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    /*
    | Allowed origins:
    |  - Live (becoolbox.app): only the production frontend domains.
    |  - Local: common dev origins (Vite 3000/5173 + the API origin itself).
    */
    'allowed_origins' => $isLive
        ? ['https://becoolbox.app', 'https://www.becoolbox.app', 'http://becoolbox.app']
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
