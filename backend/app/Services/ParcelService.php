<?php

namespace App\Services;

use App\Enums\ParcelStatus;
use App\Models\DeliveryBatch;
use App\Models\DeliveryBatchParcel;
use App\Models\Hub;
use App\Models\Parcel;
use App\Models\ParcelStatusHistory;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Parcel lifecycle orchestration: intake, reconciliation, rider assignment,
 * COD settlement, OTP release, returns and the loyalty / referral side-effects.
 */
class ParcelService
{
    public function __construct(
        protected SmsService $sms,
        protected WalletService $walletService,
        protected LoyaltyService $loyalty,
        protected AffiliateService $affiliate,
        protected DeliveryPricingService $pricing,
    ) {}

    /**
     * Register inbound parcel(s) at a hub (Staff Hub PWA intake scan).
     * Generates the OTP and sends the pickup SMS.
     *
     * @param  array{ tracking_number: string, recipient_name: string, recipient_phone: string,
     *                shipper_name?: string, cod_amount?: float, ... }  $data
     */
    public function intake(Hub $hub, array $data, ?int $referredBy = null): Parcel
    {
        return DB::transaction(function () use ($hub, $data, $referredBy) {
            $parcel = Parcel::create([
                'tracking_number' => $data['tracking_number'],
                'shipper_name' => $data['shipper_name'] ?? null,
                'recipient_name' => $data['recipient_name'],
                'recipient_phone' => $data['recipient_phone'],
                'hub_id' => $hub->id,
                'status' => ParcelStatus::ReceivedAtHub->value,
                'otp_code' => $this->generateOtp(),
                'otp_expires_at' => now()->addHours(config('bayanbox.otp.ttl_minutes', 48)),
                'cod_amount' => $data['cod_amount'] ?? 0.00,
                'origin_address' => $data['origin_address'] ?? $hub->address,
                'origin_latitude' => $data['origin_latitude'] ?? $hub->latitude,
                'origin_longitude' => $data['origin_longitude'] ?? $hub->longitude,
                'destination_address' => $data['destination_address'] ?? null,
                'destination_latitude' => $data['destination_latitude'] ?? null,
                'destination_longitude' => $data['destination_longitude'] ?? null,
                'destination_barangay' => $data['destination_barangay'] ?? null,
                'arrived_at_hub_at' => now(),
                'referred_by_id' => $referredBy ?? $data['referred_by_id'] ?? null,
            ]);

            // Geocode the destination for delivery pricing later
            if (! empty($data['destination_latitude']) && ! empty($data['destination_longitude'])) {
                $this->applyDeliveryMetrics($parcel);
            }

            $this->logStatus($parcel, ParcelStatus::ReceivedAtHub->value, 'Parcel intake scanned at hub.', $hub->staff_id);

            // Capacity tracking
            $hub->increment('current_parcel_count');

            // FR-OFF-003: failover SMS OTP
            $this->sms->sendPickupOtp($parcel->recipient_phone, $parcel->otp_code, $parcel->tracking_number);

            // FR-AFF-003: Return Shield credit for a referring merchant who
            // crosses the shipment threshold (idempotent grant).
            if (! empty($parcel->shipper_name)) {
                $merchant = User::where('name', $parcel->shipper_name)
                    ->where('role', 'merchant')
                    ->first();
                if ($merchant) {
                    $this->affiliate->maybeGrantReturnShield($merchant);
                }
            }

            return $parcel->fresh();
        });
    }

    /**
     * Assign an inbound parcel to a rider's delivery batch (out for delivery).
     */
    public function assignToBatch(Parcel $parcel, DeliveryBatch $batch): DeliveryBatchParcel
    {
        return DB::transaction(function () use ($parcel, $batch) {
            $sequence = $batch->batchParcels()->max('sequence') + 1;

            $pivot = DeliveryBatchParcel::firstOrCreate(
                ['delivery_batch_id' => $batch->id, 'parcel_id' => $parcel->id],
                ['sequence' => $sequence],
            );

            $parcel->forceFill([
                'rider_id' => $batch->rider_id,
                'status' => ParcelStatus::OutForDelivery->value,
            ])->save();

            $this->logStatus($parcel, ParcelStatus::OutForDelivery->value, "Assigned to batch {$batch->batch_code}", $batch->rider_id);

            return $pivot;
        });
    }

    /**
     * Rider marks a parcel delivered. Settles COD against the rider's prepaid
     * wallet, pays the 85/15 delivery split, and fires loyalty/referral hooks.
     */
    public function markDelivered(Parcel $parcel, User $rider, array $options = []): Parcel
    {
        return DB::transaction(function () use ($parcel, $rider, $options) {
            if ($parcel->status === ParcelStatus::Delivered->value) {
                throw new RuntimeException('Parcel is already delivered.');
            }

            // 1. COD collection (if any) — debit rider prepaid wallet
            $codAmount = (float) $parcel->cod_amount;
            if ($codAmount > 0) {
                $prepaidWallet = $this->walletService->ensureWallet($rider->id, Wallet::TYPE_RIDER_PREPAID);

                // Rider locks COD value upfront by topping up; on delivery the
                // cash collected refunds the prepaid wallet as earnings.
                $this->walletService->credit(
                    $prepaidWallet,
                    $codAmount,
                    "COD collected on {$parcel->tracking_number} (replenishes prepaid lock)",
                    'cod_settlement',
                    null,
                    $parcel,
                    ['cod_amount' => $codAmount],
                );
            }

            // 2. Delivery fee split (85/15)
            $fee = (float) $parcel->calculated_delivery_fee;
            if ($fee > 0) {
                $riderEarnings = $this->walletService->ensureWallet($rider->id, Wallet::TYPE_PROVIDER_EARNINGS);
                $platformWallet = $this->walletService->ensureWallet(
                    (int) config('bayanbox.ledger.platform_user_id', 1),
                    Wallet::TYPE_PLATFORM_EARNINGS,
                );

                $split = $this->pricing->splitFee($fee);

                $this->walletService->credit(
                    $riderEarnings,
                    $split['rider_share'],
                    "Delivery fee rider share — {$parcel->tracking_number}",
                    'delivery_split',
                    $platformWallet,
                    $parcel,
                    $split,
                );

                $this->walletService->credit(
                    $platformWallet,
                    $split['platform_share'],
                    "Delivery fee platform share — {$parcel->tracking_number}",
                    'delivery_split',
                    $riderEarnings,
                    $parcel,
                    $split,
                );
            }

            // 3. Referral micro-commission (FR-AFF-002)
            $this->affiliate->payoutReferralCommission($parcel);

            // 4. Finalise parcel
            $parcel->forceFill([
                'status' => ParcelStatus::Delivered->value,
                'delivered_at' => now(),
                'picked_up_at' => $parcel->picked_up_at ?? now(),
            ])->save();

            $this->logStatus($parcel, ParcelStatus::Delivered->value, 'Delivered to recipient.', $rider->id, $options['latitude'] ?? null, $options['longitude'] ?? null);

            return $parcel->fresh();
        });
    }

    /**
     * Validate the customer OTP and release the parcel at the hub
     * (FR-OFF-003 / Staff secure release). Awards the 24h Suki Points reward.
     */
    public function releaseByOtp(Parcel $parcel, string $otp, ?User $actor = null): Parcel
    {
        return DB::transaction(function () use ($parcel, $otp, $actor) {
            if (! $parcel->isOtpValid($otp)) {
                $parcel->increment('otp_attempts');
                throw new RuntimeException('Invalid or expired OTP.');
            }

            $parcel->forceFill([
                'status' => ParcelStatus::PickedUp->value,
                'picked_up_at' => now(),
            ])->save();

            $this->logStatus($parcel, ParcelStatus::PickedUp->value, 'Released to customer after OTP validation.', $actor?->id);

            // FR-LOY-002: 1 point if picked up within 24h of arrival
            if ($parcel->arrived_at_hub_at && $parcel->arrived_at_hub_at->diffInHours(now()) <= (int) config('bayanbox.loyalty.pickup_within_hours', 24)) {
                $customer = User::where('phone', $parcel->recipient_phone)->first();
                if ($customer) {
                    $this->loyalty->award(
                        $customer,
                        (int) config('bayanbox.loyalty.pickup_points_per_parcel', 1),
                        'pickup_reward',
                        "Fast pickup reward — {$parcel->tracking_number}",
                        $parcel,
                    );
                }
            }

            // FR-AFF-002 side-effect on pickup
            $this->affiliate->payoutReferralCommission($parcel);

            return $parcel->fresh();
        });
    }

    /**
     * Calculate + persist delivery distance/fee on a parcel (delivery upgrade).
     */
    public function applyDeliveryMetrics(Parcel $parcel): array
    {
        $originLat = (float) ($parcel->origin_latitude ?? $parcel->hub?->latitude);
        $originLng = (float) ($parcel->origin_longitude ?? $parcel->hub?->longitude);
        $destLat = (float) ($parcel->destination_latitude ?? 0);
        $destLng = (float) ($parcel->destination_longitude ?? 0);

        if (! $originLat || ! $originLng || ! $destLat || ! $destLng) {
            throw new RuntimeException('Origin and destination coordinates are required.');
        }

        $quote = $this->pricing->calculateFee(
            $originLat, $originLng, $destLat, $destLng,
            $parcel->hub?->municipality,
        );

        $parcel->forceFill([
            'delivery_distance_km' => $quote['distance_km'],
            'calculated_delivery_fee' => $quote['total_delivery_fee'],
            'applied_surge' => $quote['applied_surge'],
        ])->save();

        return $quote;
    }

    /**
     * Reverse logistics: mark returned to hub / to carrier.
     */
    public function markReturned(Parcel $parcel, string $note = 'Returned to hub', ?User $actor = null): Parcel
    {
        $parcel->forceFill(['status' => ParcelStatus::Returned->value])->save();
        $this->logStatus($parcel, ParcelStatus::Returned->value, $note, $actor?->id);

        return $parcel->fresh();
    }

    /**
     * Append an audit row to parcel_status_history.
     */
    public function logStatus(
        Parcel $parcel,
        string $status,
        string $note = '',
        ?int $actorUserId = null,
        ?float $lat = null,
        ?float $lng = null,
    ): ParcelStatusHistory {
        return ParcelStatusHistory::create([
            'parcel_id' => $parcel->id,
            'status' => $status,
            'note' => $note,
            'actor_user_id' => $actorUserId,
            'latitude' => $lat,
            'longitude' => $lng,
        ]);
    }

    public function generateOtp(): string
    {
        $length = (int) config('bayanbox.otp.length', 6);
        $otp = (string) random_int(10 ** ($length - 1), (10 ** $length) - 1);

        return Str::padLeft($otp, $length, '0');
    }
}