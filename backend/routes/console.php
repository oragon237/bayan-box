<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('bayanbox:demo', function () {
    $this->call('db:seed', ['--class' => 'Database\\Seeders\\DatabaseSeeder']);
})->purpose('Seed BayanBox demo data (roles, rates, hubs, providers)');
