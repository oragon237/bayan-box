<?php

namespace App\Services;

use App\Models\SystemSetting;

/**
 * Read/write system settings with sensible defaults.
 */
class SystemSettingService
{
    protected array $defaults = [
        'fees' => ['base_fee' => 40.00, 'base_distance_km' => 2.0, 'per_km_rate' => 10.00, 'merchant_commission_percent' => 5.00, 'min_cashout' => 500.00],
        'ads' => ['homepage_featured_rate' => 100.00, 'sponsored_rate' => 50.00, 'max_featured_slots' => 5],
        'toggles' => ['maintenance_mode' => false, 'allow_merchant_registration' => true],
        'locations' => ['default_lat' => 13.6218, 'default_lng' => 123.1948, 'service_zones' => []],
    ];

    public function all(): array
    {
        $out = [];
        foreach (array_keys($this->defaults) as $group) {
            $out[$group] = $this->get($group);
        }
        return $out;
    }

    public function get(string $group): array
    {
        $setting = SystemSetting::find($group);
        $value = $setting?->value;
        return array_merge($this->defaults[$group] ?? [], is_array($value) ? $value : []);
    }

    public function set(string $group, array $value): void
    {
        SystemSetting::updateOrCreate(['key' => $group], ['value' => array_merge($this->get($group), $value)]);
    }

    public function setAll(array $groups): void
    {
        foreach ($groups as $group => $value) {
            if (array_key_exists($group, $this->defaults)) {
                $this->set($group, $value);
            }
        }
    }

    public function value(string $group, string $key, $default = null)
    {
        return $this->get($group)[$key] ?? $default;
    }
}