<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantPayoutAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant payout accounts (GCash / Maya / Bank).
 */
class MerchantPayoutController extends Controller
{
    protected const BANKS = ['BDO', 'BPI', 'Landbank', 'UnionBank', 'Metrobank', 'RCBC', 'Security Bank', 'Maya Bank', 'SeaBank', 'Gotyme'];

    /**
     * GET /api/merchant/payouts — my saved payout accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $accounts = MerchantPayoutAccount::where('user_id', $request->user()->id)->orderByDesc('is_default')->get();

        return response()->json(['accounts' => $accounts->map(fn ($a) => $this->shape($a))]);
    }

    /**
     * POST /api/merchant/payouts — add a payout account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateAccount($request);

        // If this is set as default, clear other defaults
        if ($validated['is_default']) {
            MerchantPayoutAccount::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $account = MerchantPayoutAccount::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json($this->shape($account), 201);
    }

    /**
     * PUT /api/merchant/payouts/{id} — update an account.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $account = MerchantPayoutAccount::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $this->validateAccount($request, false);

        if (! empty($validated['is_default'])) {
            MerchantPayoutAccount::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $account->update($validated);

        return response()->json($this->shape($account->fresh()));
    }

    /**
     * POST /api/merchant/payouts/{id}/default — set as primary.
     */
    public function setDefault(int $id, Request $request): JsonResponse
    {
        $account = MerchantPayoutAccount::where('user_id', $request->user()->id)->findOrFail($id);

        MerchantPayoutAccount::where('user_id', $request->user()->id)->update(['is_default' => false]);
        $account->update(['is_default' => true]);

        return response()->json(['message' => 'Default payout account set.', 'account' => $this->shape($account->fresh())]);
    }

    /**
     * DELETE /api/merchant/payouts/{id} — delete an account.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $account = MerchantPayoutAccount::where('user_id', $request->user()->id)->findOrFail($id);
        $account->delete();

        return response()->json(['message' => 'Payout account deleted.']);
    }

    protected function validateAccount(Request $request, bool $required = true): array
    {
        $rules = [
            'account_type' => 'required|in:gcash,maya,bank',
            'account_name' => 'required|string|max:120',
            'is_default' => 'nullable|boolean',
        ];

        // Dynamic fields based on type
        $rules['mobile_number'] = 'nullable|regex:/^09[0-9]{9}$/';
        $rules['bank_name'] = 'nullable|string|max:60';
        $rules['account_number'] = 'nullable|string|max:40';
        $rules['branch'] = 'nullable|string|max:120';

        $validated = $request->validate($rules);

        if ($validated['account_type'] === 'bank') {
            if (empty($validated['bank_name'])) abort(422, 'Bank name is required.');
            if (empty($validated['account_number'])) abort(422, 'Account number is required.');
        } else {
            if (empty($validated['mobile_number'])) abort(422, 'Mobile number is required for e-wallets.');
        }

        return $validated;
    }

    protected function shape(MerchantPayoutAccount $a): array
    {
        return [
            'id' => $a->id,
            'account_type' => $a->account_type,
            'account_name' => $a->account_name,
            'mobile_number' => $a->mobile_number,
            'bank_name' => $a->bank_name,
            'account_number' => $a->account_number,
            'branch' => $a->branch,
            'is_default' => $a->is_default,
            'masked_account' => $a->maskedAccount(),
            'display_label' => $a->displayLabel(),
        ];
    }
}