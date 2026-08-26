<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ledger transactions — PRD 4.1 #9 (Double-Entry Protection).
     *
     * Extended beyond the PRD sketch to guarantee auditability:
     *  - amount  : signed (+ credit / - debit)
     *  - wallet_id / counterparty_wallet_id : both legs of the double entry
     *  - transaction_hash : unique per movement, gives idempotency + replay protection
     *  - balance_after    : immutable snapshot for reconciliation
     *  - reference_*      : polymorphic link back to the business event
     */
    public function up(): void
    {
        Schema::create('ledger_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets')->restrictOnDelete();
            $table->foreignId('counterparty_wallet_id')->nullable()->constrained('wallets')->restrictOnDelete();
            $table->decimal('amount', 12, 2)->notNull();
            $table->decimal('balance_after', 12, 2)->nullable();
            $table->string('direction', 10)->default('credit'); // credit | debit
            $table->string('type', 40)->default('manual');      // delivery_split, cod_settlement, topup, affiliate_commission, redemption, escrow...
            $table->string('description', 255)->notNull();
            $table->string('transaction_hash', 64)->unique()->notNull();
            $table->nullableMorphs('reference');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_transactions');
    }
};
