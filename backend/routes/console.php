<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('bayanbox:demo', function () {
    $this->call('db:seed', ['--class' => 'Database\\Seeders\\DatabaseSeeder']);
})->purpose('Seed BayanBox demo data (roles, rates, hubs, providers)');

// Order lifecycle exceptions: auto-cancel + raider reassignment
Schedule::command('orders:process-lifecycle')->everyMinute();
