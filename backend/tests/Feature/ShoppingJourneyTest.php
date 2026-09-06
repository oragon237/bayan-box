<?php

namespace Tests\Feature;

use App\Models\AdCampaign;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use App\Services\MarketplaceService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class ShoppingJourneyTest extends TestCase
{
    private function product(User $merchant, array $overrides = []): Product
    {
        return Product::create([...[
            'merchant_id' => $merchant->id, 'name' => 'Test rice', 'price' => 100,
            'stock' => 10, 'status' => 'active', 'availability' => 'available',
        ], ...$overrides]);
    }

    public function test_adding_preserves_other_items_and_rejects_excess_stock(): void
    {
        $customer = User::factory()->create();
        $merchant = User::factory()->create(['role' => 'merchant']);
        $first = $this->product($merchant);
        $second = $this->product($merchant);
        CartItem::create(['customer_id' => $customer->id, 'product_id' => $first->id, 'quantity' => 2]);
        $this->actingAs($customer)->postJson('/api/cart/items', ['product_id' => $second->id, 'quantity' => 3])->assertOk();
        $this->assertDatabaseHas('cart_items', ['product_id' => $first->id, 'quantity' => 2]);
        $this->postJson('/api/cart/items', ['product_id' => $second->id, 'quantity' => 2])->assertOk()->assertJsonPath('item.quantity', 5);
        $this->postJson('/api/cart/items', ['product_id' => $second->id, 'quantity' => 6])->assertStatus(422);
        $this->assertDatabaseHas('cart_items', ['product_id' => $second->id, 'quantity' => 5]);
        $this->assertDatabaseCount('cart_items', 2);
    }

    public function test_add_requires_auth_and_rejects_unavailable_products(): void
    {
        $merchant = User::factory()->create(['role' => 'merchant']);
        $product = $this->product($merchant, ['stock' => 0]);
        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1])->assertStatus(422);
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_location_filters_catalog_and_sponsored_products_together(): void
    {
        $local = User::factory()->create(['role' => 'merchant', 'municipality' => 'Naga', 'barangay' => 'Centro']);
        $remote = User::factory()->create(['role' => 'merchant', 'municipality' => 'Naga', 'barangay' => 'Centro East']);
        $wanted = $this->product($local);
        $other = $this->product($remote);
        foreach ([$wanted, $other] as $product) {
            AdCampaign::create(['product_id' => $product->id, 'merchant_id' => $product->merchant_id,
                'ad_type' => 'sponsored', 'daily_rate' => 1, 'total_cost' => 1, 'duration_days' => 1,
                'start_date' => now(), 'end_date' => now()->addDay(), 'status' => 'active']);
        }
        $this->getJson('/api/products?city=Naga&barangay=Centro&exact_area=1')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $wanted->id)
            ->assertJsonCount(1, 'sponsored_items')->assertJsonPath('sponsored_items.0.product.id', $wanted->id);
        $this->getJson('/api/products?city=Unknown&exact_area=1')->assertOk()->assertJsonCount(0, 'data')->assertJsonCount(0, 'sponsored_items');
        $this->getJson('/api/products/locations')->assertOk()->assertJsonCount(2);
    }

    public function test_conversion_events_are_deduplicated_and_cannot_forge_orders(): void
    {
        $payload = ['event_id' => (string) Str::uuid(), 'session_id' => (string) Str::uuid(), 'event' => 'view_item', 'product_id' => 1, 'utm_source' => 'facebook'];
        $this->postJson('/api/conversions', $payload)->assertOk();
        $this->postJson('/api/conversions', $payload)->assertOk();
        $this->assertDatabaseCount('conversion_events', 1);
        $this->postJson('/api/conversions', [...$payload, 'event' => 'order_placed'])->assertStatus(422);
        $this->postJson('/api/conversions', [...$payload, 'utm_source' => 'name@example.com'])->assertStatus(422);
        $this->getJson('/api/admin/conversions')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/conversions')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->getJson('/api/admin/conversions')->assertOk()
            ->assertJsonPath('stages.0.sessions', 1)->assertJsonPath('completed_orders', 0);
    }

    public function test_only_successful_server_checkout_records_an_order_and_report_uses_its_state(): void
    {
        $customer = User::factory()->create();
        $order = Order::create(['customer_id' => $customer->id, 'total_amount' => 100, 'shipping_amount' => 40,
            'fulfillment_type' => 'delivery', 'status' => 'pending_payment', 'payment_method' => 'cod']);
        $this->mock(MarketplaceService::class, fn ($mock) => $mock->shouldReceive('processCheckout')->once()->andReturn($order));
        $payload = ['fulfillment_type' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'Test address',
            'latitude' => 13.6, 'longitude' => 123.2, 'conversion' => ['session_id' => (string) Str::uuid(), 'utm_source' => 'facebook']];
        $this->actingAs($customer)->postJson('/api/checkout', $payload)->assertOk();
        $this->assertDatabaseHas('conversion_events', ['event' => 'order_placed', 'order_id' => $order->id, 'utm_source' => 'facebook']);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->getJson('/api/admin/conversions')->assertJsonPath('completed_orders', 0);
        $order->update(['delivery_state' => 'delivered']);
        $this->getJson('/api/admin/conversions')->assertJsonPath('completed_orders', 1);
        $order->update(['status' => 'refunded']);
        $this->getJson('/api/admin/conversions')->assertJsonPath('completed_orders', 0);
    }

    public function test_failed_checkout_does_not_record_a_conversion(): void
    {
        $this->mock(MarketplaceService::class, fn ($mock) => $mock->shouldReceive('processCheckout')->once()->andThrow(new \RuntimeException('Out of stock')));
        $this->actingAs(User::factory()->create())->postJson('/api/checkout', [
            'fulfillment_type' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'Test address',
            'latitude' => 13.6, 'longitude' => 123.2, 'conversion' => ['session_id' => (string) Str::uuid()],
        ])->assertStatus(422);
        $this->assertDatabaseCount('conversion_events', 0);
    }

    public function test_unavailable_analytics_does_not_fail_a_successful_checkout(): void
    {
        $customer = User::factory()->create();
        $order = Order::create(['customer_id' => $customer->id, 'total_amount' => 100, 'shipping_amount' => 40,
            'fulfillment_type' => 'delivery', 'status' => 'pending_payment', 'payment_method' => 'cod']);
        $this->mock(MarketplaceService::class, fn ($mock) => $mock->shouldReceive('processCheckout')->once()->andReturn($order));
        // This test runs against the isolated in-memory SQLite database.
        Schema::drop('conversion_events');
        $this->actingAs($customer)->postJson('/api/checkout', [
            'fulfillment_type' => 'delivery', 'payment_method' => 'cod', 'delivery_address' => 'Test address',
            'latitude' => 13.6, 'longitude' => 123.2, 'conversion' => ['session_id' => (string) Str::uuid()],
        ])->assertOk()->assertJsonPath('order.id', $order->id);
    }
}
