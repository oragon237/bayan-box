<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Per-phone login throttle: 5 attempts per minute, 20 per hour
        RateLimiter::for('login', function ($job) {
            $phone = strtolower((string) $job->input('phone'));
            $ip = (string) $job->ip();

            return [
                Limit::perMinute(5)->by('login-phone:'.$phone),
                Limit::perMinute(20)->by('login-ip:'.$ip),
                Limit::perHour(30)->by('login-ip-hour:'.$ip),
            ];
        });
    }
}