<?php

namespace App\Services;

use App\Models\LoyaltyPoint;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Suki Points loyalty ledger (FR-LOY-001..004).
 *
 * No flat balance column — every event appends a signed row to
 * loyalty_points; the balance is the SUM. Points are awarded only inside a
 * transaction to stay consistent with the parcel lifecycle.
 */
class LoyaltyService
{
    /**
     * Award points. Returns the created ledger row.
     */
    public function award(User $user, int $points, string $type, string $description, $reference = null): LoyaltyPoint
    {
        if ($points <= 0) {
            throw new RuntimeException('Points must be positive.');
        }

        return DB::transaction(function () use ($user, $points, $type, $description, $reference) {
            $balanceAfter = $this->balance($user) + $points;

            return LoyaltyPoint::create([
                'user_id' => $user->id,
                'points' => $points,
                'type' => $type,
                'description' => $description,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference?->getKey(),
                'balance_after' => $balanceAfter,
            ]);
        });
    }

    /**
     * Burn points. Enforces the balance floor.
     */
    public function burn(User $user, int $points, string $type, string $description, $reference = null): LoyaltyPoint
    {
        if ($points <= 0) {
            throw new RuntimeException('Points must be positive.');
        }

        return DB::transaction(function () use ($user, $points, $type, $description, $reference) {
            $balance = $this->balance($user);
            if ($balance < $points) {
                throw new RuntimeException("Insufficient Suki points. Required: {$points}, available: {$balance}");
            }

            $balanceAfter = $balance - $points;

            return LoyaltyPoint::create([
                'user_id' => $user->id,
                'points' => -$points,
                'type' => $type,
                'description' => $description,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference?->getKey(),
                'balance_after' => $balanceAfter,
            ]);
        });
    }

    public function balance(User $user): int
    {
        return (int) LoyaltyPoint::where('user_id', $user->id)->sum('points');
    }

    public function ledger(User $user, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return LoyaltyPoint::where('user_id', $user->id)
            ->latest('created_at')
            ->limit($limit)
            ->get();
    }
}