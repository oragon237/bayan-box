<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    public function test_staff_is_403_from_personal_affiliate_program(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)
            ->postJson('/api/affiliate/register-referral', ['referral_code' => 'ABC1234'])
            ->assertStatus(403);
    }

    public function test_admin_is_403_from_personal_affiliate_program(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson('/api/affiliate/register-referral', ['referral_code' => 'ABC1234'])
            ->assertStatus(403);
    }

    public function test_customer_can_link_referral(): void
    {
        $customer = User::factory()->customer()->create();
        $referrer = User::factory()->customer()->create();

        $this->actingAs($customer)
            ->postJson('/api/affiliate/register-referral', ['referral_code' => $referrer->affiliate_code])
            ->assertOk()
            ->assertJsonPath('message', 'Referral linked.');
    }

    public function test_staff_referral_code_cannot_attribute_at_registration(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Victim of Staff Code',
            'phone' => '09170000111',
            'password' => 'secret123',
            'referral_code' => $staff->affiliate_code,
        ]);

        $response->assertStatus(201)->assertJsonPath('referral_status', 'invalid');

        $user = User::where('phone', '09170000111')->first();
        $this->assertNull($user->referred_by_id);
    }

    public function test_pending_merchant_is_403_from_product_creation(): void
    {
        $merchant = User::factory()->pendingMerchant()->create();

        $this->actingAs($merchant)
            ->postJson('/api/merchant/products', [
                'name' => 'Unverified Product',
                'price' => 100,
                'stock' => 5,
            ])
            ->assertStatus(403);
    }

    public function test_verified_merchant_can_create_product(): void
    {
        $merchant = User::factory()->merchant()->create();

        $this->actingAs($merchant)
            ->postJson('/api/merchant/products', [
                'name' => 'Verified Product',
                'price' => 100,
                'stock' => 5,
            ])
            ->assertStatus(201);
    }

    public function test_customer_is_403_from_merchant_product_creation(): void
    {
        $customer = User::factory()->customer()->create();

        $this->actingAs($customer)
            ->postJson('/api/merchant/products', [
                'name' => 'Sneaky',
                'price' => 100,
                'stock' => 5,
            ])
            ->assertStatus(403);
    }

    public function test_staff_is_403_from_admin_settings(): void
    {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)
            ->getJson('/api/admin/settings')
            ->assertStatus(403);
    }

    public function test_merchant_cannot_access_admin_settings(): void
    {
        $merchant = User::factory()->merchant()->create();

        $this->actingAs($merchant)
            ->getJson('/api/admin/settings')
            ->assertStatus(403);
    }

    public function test_admin_can_access_admin_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson('/api/admin/settings')
            ->assertOk();
    }
}