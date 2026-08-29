<?php

namespace App\Console\Commands;

use App\Services\AffiliateService;
use Illuminate\Console\Command;

/**
 * Release marketplace affiliate commissions whose grace period (held_until)
 * has passed and whose order was not cancelled. Runs hourly.
 */
class ReleaseAffiliateCommissions extends Command
{
    protected $signature = 'affiliate:release-commissions';

    protected $description = 'Release vested affiliate commissions (grace period elapsed, order not cancelled)';

    public function handle(AffiliateService $affiliate): int
    {
        $released = $affiliate->releaseVestedCommissions();

        $this->info("Released {$released} vested affiliate commission(s).");

        return self::SUCCESS;
    }
}