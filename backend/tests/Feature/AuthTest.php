<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register_with_phone_and_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Juan Dela Cruz',
            'phone' => '09170000123',
            'password' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.phone', '09170000123')
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonStructure(['user', 'token', 'referral_status']);
    }

    public function test_merchant_registration_starts_pending_verification(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Pending Store',
            'phone' => '09170000456',
            'password' => 'secret123',
            'role' => 'merchant',
            'dti_sec_number' => 'DTI-12345',
        ]);

        $response->assertStatus(201);

        $user = User::where('phone', '09170000456')->first();
        $this->assertSame(User::STATUS_PENDING, $user->status);
        $this->assertSame('merchant', $user->role);
    }

    public function test_duplicate_phone_rejected(): void
    {
        User::factory()->create(['phone' => '09170000001']);

        $this->postJson('/api/auth/register', [
            'name' => 'Duplicate',
            'phone' => '09170000001',
            'password' => 'secret123',
        ])->assertStatus(422);
    }

    public function test_user_can_login_and_receive_sanctum_token(): void
    {
        $user = User::factory()->create(['password_hash' => bcrypt('secret123')]);

        $response = $this->postJson('/api/auth/login', [
            'phone' => $user->phone,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.phone', $user->phone)
            ->assertJsonStructure(['token']);
    }

    public function test_login_with_wrong_password_rejected(): void
    {
        $user = User::factory()->create(['password_hash' => bcrypt('secret123')]);

        $this->postJson('/api/auth/login', [
            'phone' => $user->phone,
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_unauthenticated_request_returns_json_401(): void
    {
        $this->getJson('/api/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_valid_referral_code_linked_at_registration(): void
    {
        $referrer = User::factory()->create();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Customer',
            'phone' => '09170000789',
            'password' => 'secret123',
            'referral_code' => $referrer->affiliate_code,
        ]);

        $response->assertStatus(201)->assertJsonPath('referral_status', 'applied');

        $newUser = User::where('phone', '09170000789')->first();
        $this->assertSame($referrer->id, $newUser->referred_by_id);
    }

    public function test_invalid_referral_code_reports_invalid_non_blocking(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'No Referrer',
            'phone' => '09170000999',
            'password' => 'secret123',
            'referral_code' => 'DOESNOTEXIST',
        ]);

        $response->assertStatus(201)->assertJsonPath('referral_status', 'invalid');
    }
}