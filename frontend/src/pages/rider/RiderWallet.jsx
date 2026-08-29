import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToast, StatCard, Skeleton, Spinner } from '../../components/ui.jsx';
import { WalletIcon, ArrowRightIcon } from '../../components/icons.jsx';

const directionIcon = (d) => (d === 'credit' ? '↑' : '↓');
const directionColor = (d) => (d === 'credit' ? 'text-green-600' : 'text-red-600');
const directionBg = (d) => (d === 'credit' ? 'bg-green-50' : 'bg-red-50');

export default function RiderWallet({ user }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [topup, setTopup] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await client.get('/rider/wallet');
      setData(data);
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const doTopup = async (e) => {
    e.preventDefault();
    const amount = Number(topup);
    if (!amount || amount <= 0) return notify('Enter a valid amount.', 'error');
    setSubmitting(true);
    try {
      await client.post('/wallets/rider_prepaid/topup', { amount, payment_method: 'gcash' });
      notify(`Top-up of ₱${amount} credited.`);
      setTopup('');
      fetchWallet();
    } catch (err) {
      notify(err.response?.data?.message || 'Top-up failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const wallet = data?.wallet || null;
  const txs = wallet?.ledger_transactions || [];
  const parcelTxs = data?.parcel_wallet?.ledger || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">Rider Wallet</h2>
        <p className="text-sm text-ink-400">Prepaid wallet used to lock COD value on pickup.</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-bayan-700 to-bayan-500 rounded-3xl p-6 text-white shadow-lift">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Prepaid Balance</span>
          <WalletIcon className="w-5 h-5 text-white/70" />
        </div>
        <span className="text-5xl font-black tracking-tight">
          ₱{Number(wallet?.balance ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Top-up form */}
      <form onSubmit={doTopup} className="card p-4 space-y-3 animate-fade-up">
        <h3 className="font-bold text-ink-700">Top-up via GCash / Maya</h3>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">₱</span>
          <input
            className="input pl-8"
            inputMode="decimal"
            placeholder="Amount"
            value={topup}
            onChange={(e) => setTopup(e.target.value.replace(/[^\d.]/g, ''))}
          />
        </div>
        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={submitting}>
          {submitting && <Spinner size="sm" className="!text-white" />}
          Top Up <ArrowRightIcon className="w-4 h-4" />
        </button>
      </form>

      {/* Transactions — Prepaid (COD) */}
      <div className="card p-4">
        <h3 className="font-bold text-ink-700 mb-3">Recent Transactions — Prepaid (COD)</h3>
        {txs.length === 0 ? (
          <div className="text-sm text-ink-400 text-center py-6">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {txs.slice(0, 30).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${directionBg(tx.direction)} ${directionColor(tx.direction)}`}>
                  {directionIcon(tx.direction)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{tx.description}</div>
                  <div className="text-[11px] text-ink-400">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <span className={`font-black text-sm ${directionColor(tx.direction)}`}>
                  {tx.direction === 'credit' ? '+' : '−'}₱{Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parcel delivery earnings */}
      {parcelTxs.length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-ink-700 mb-3">
            Parcel Delivery Earnings
            <span className="ml-2 text-sm font-normal text-ink-400">₱{Number(data?.parcel_wallet?.balance ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </h3>
          <div className="divide-y divide-ink-100">
            {parcelTxs.slice(0, 30).map((tx) => (
              <div key={tx.id} className="py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${directionBg(tx.direction)} ${directionColor(tx.direction)}`}>
                  {directionIcon(tx.direction)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{tx.description}</div>
                  <div className="text-[11px] text-ink-400">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <span className={`font-black text-sm ${directionColor(tx.direction)}`}>
                  {tx.direction === 'credit' ? '+' : '−'}₱{Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}