<?php

namespace Database\Factories;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = \App\Models\User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '09' . fake()->numerify('########'),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => bcrypt('Password123!'),
            'role' => Role::Customer->value,
            'affiliate_code' => strtoupper(Str::random(7)),
            'status' => 'active',
        ];
    }

    public function role(Role|string $role): static
    {
        return $this->state(fn () => ['role' => $role instanceof Role ? $role->value : $role]);
    }

    public function staff(): static
    {
        return $this->role(Role::Staff);
    }

    public function merchant(): static
    {
        return $this->role(Role::Merchant);
    }

    public function pendingMerchant(): static
    {
        return $this->state([
            'role' => Role::Merchant->value,
            'status' => \App\Models\User::STATUS_PENDING,
        ]);
    }

    public function admin(): static
    {
        return $this->role(Role::Admin);
    }

    public function rider(): static
    {
        return $this->role(Role::Rider);
    }

    public function customer(): static
    {
        return $this->role(Role::Customer);
    }
}