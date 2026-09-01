import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

export default function AdminFinance({ user }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/finance')
      .then((res) => setData(res.data))
      .catch(() => notify('Could not load finance data.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return <div className="text-center text-ink-400 py-20">No data available.</div>;

  const { collected, wallets, riders, merchants, pending_cashouts, transaction_register: transactionRegister = [] } = data;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Financial Settlement</h2>
        <p className="text-white/75 text-sm mt-1">Money collected, platform earnings, rider COD, and merchant settlement.</p>
      </div>

      {/* Collected */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Total collected</p>
          <p className="text-2xl font-black text-ink-900 mt-1">₱{Number(collected.total).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Today</p>
          <p className="text-2xl font-black text-ink-900 mt-1">₱{Number(collected.today).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">GCash / Maya</p>
          <p className="text-2xl font-black text-green-700 mt-1">₱{Number(collected.gcash_maya).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">COD (cash)</p>
          <p className="text-2xl font-black text-amber-700 mt-1">₱{Number(collected.cod).toLocaleString()}</p>
          <p className="text-[10px] text-ink-400">Pending: ₱{Number(collected.cod_pending).toLocaleString()}</p>
        </div>
      </div>

      {/* Financial transaction register */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Financial Transaction Register</h3>
        {transactionRegister.length === 0 ? (
          <div className="card p-4 text-center text-sm text-ink-400">No financial transactions recorded yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Recorded</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Details</th><th className="p-2 text-left">Account</th><th className="p-2 text-right">Amount</th>
              </tr></thead>
              <tbody>{transactionRegister.map((transaction) => (
                <tr key={transaction.id} className="border-t border-ink-50">
                  <td className="p-2 text-ink-400 whitespace-nowrap">{transaction.recorded_at ? new Date(transaction.recorded_at).toLocaleString() : '—'}</td>
                  <td className="p-2"><span className={`chip border ${transaction.direction === 'credit' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{String(transaction.type).replace(/_/g, ' ')}</span></td>
                  <td className="p-2 text-ink-600">{transaction.description}{transaction.order_id ? ` · Order #${transaction.order_id}` : ''}</td>
                  <td className="p-2 text-ink-500">{transaction.account}{transaction.counterparty && transaction.counterparty !== '—' ? ` ↔ ${transaction.counterparty}` : ''}</td>
                  <td className={`p-2 text-right font-bold ${transaction.direction === 'credit' ? 'text-green-700' : 'text-red-600'}`}>{transaction.direction === 'credit' ? '+' : '−'}₱{Number(transaction.amount).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wallet Balances */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Wallet Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-[10px] font-bold text-ink-400 uppercase">Sales Escrow</p>
            <p className="text-xl font-black text-ink-900">₱{Number(wallets.escrow).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-ink-400 uppercase">Platform Earnings</p>
            <p className="text-xl font-black text-bayan-700">₱{Number(wallets.platform).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-ink-400 uppercase">Admin (Mall)</p>
            <p className="text-xl font-black text-purple-700">₱{Number(wallets.admin).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-ink-400 uppercase">Affiliate Paid</p>
            <p className="text-xl font-black text-ink-900">₱{Number(wallets.affiliate_paid).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Rider COD Reconciliation */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">
          Rider COD Reconciliation
          <span className="ml-2 text-xs font-normal text-ink-400">Total outstanding: ₱{Number(data.total_outstanding ?? riders.reduce((s, r) => s + r.outstanding, 0)).toLocaleString()}</span>
        </h3>
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Rider</th>
                <th className="p-2 text-right">COD Collected</th>
                <th className="p-2 text-right">Remitted</th>
                <th className="p-2 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {riders.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-ink-400">No riders found.</td></tr>
              ) : riders.map((r) => (
                <tr key={r.id} className="border-t border-ink-50">
                  <td className="p-2 font-bold text-ink-800">{r.name}</td>
                  <td className="p-2 text-right">₱{Number(r.cod_collected).toLocaleString()}</td>
                  <td className="p-2 text-right text-green-700 font-bold">₱{Number(r.remitted).toLocaleString()}</td>
                  <td className={`p-2 text-right font-bold ${r.outstanding > 0.01 ? 'text-red-600' : 'text-green-700'}`}>
                    ₱{Number(r.outstanding).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Settlement */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Merchant Settlement</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Merchant</th>
                <th className="p-2 text-right">Earned</th>
                <th className="p-2 text-right">Withdrawn</th>
                <th className="p-2 text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-ink-400">No merchants found.</td></tr>
              ) : merchants.map((m) => (
                <tr key={m.id} className="border-t border-ink-50">
                  <td className="p-2 font-bold text-ink-800">{m.name}</td>
                  <td className="p-2 text-right">₱{Number(m.earned).toLocaleString()}</td>
                  <td className="p-2 text-right">₱{Number(m.withdrawn).toLocaleString()}</td>
                  <td className="p-2 text-right font-bold text-bayan-700">₱{Number(m.balance).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Cash-outs */}
      {pending_cashouts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Pending Cash-outs</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {pending_cashouts.map((c) => (
                  <tr key={c.id} className="border-t border-ink-50">
                    <td className="p-2 font-bold text-ink-800">{c.user_name}</td>
                    <td className="p-2 text-ink-500 capitalize">{c.wallet_type?.replace('_', ' ')}</td>
                    <td className="p-2 text-right font-bold">₱{Number(c.amount).toLocaleString()}</td>
                    <td className="p-2 text-right text-ink-400">{new Date(c.requested_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
