import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

const RANGES = [
  { label: 'Today', days: 0 }, { label: 'Last 7 days', days: 7 }, { label: 'This Month', days: 30 }, { label: 'Custom', days: -1 },
];

export default function MerchantReports({ user }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [range, setRange] = useState('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sort, setSort] = useState('units');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cashOutAmt, setCashOutAmt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payoutAccounts, setPayoutAccounts] = useState([]);
  const [selectedPayoutId, setSelectedPayoutId] = useState('');

  const load = () => {
    setLoading(true);
    const r = RANGES.find((r) => r.label === range);
    const params = {};
    if (r.days >= 0) {
      params.from = new Date(Date.now() - r.days * 864e5).toISOString();
      params.to = new Date().toISOString();
    } else {
      if (customFrom) params.from = customFrom;
      if (customTo) params.to = customTo;
    }
    params.sort = sort;
    client.get('/merchant/reports', { params }).then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [range, sort]);

  useEffect(() => {
    if (range === 'Custom' && customFrom && customTo) load();
  }, [customFrom, customTo]);

  // Load payout accounts for the cash-out flow
  useEffect(() => {
    client.get('/merchant/payouts').then((res) => {
      const list = res.data.accounts || [];
      setPayoutAccounts(list);
      const def = list.find((a) => a.is_default);
      setSelectedPayoutId(def?.id ? String(def.id) : (list[0]?.id ? String(list[0].id) : ''));
    }).catch(() => {});
  }, []);

  const requestCashOut = async () => {
    if (!cashOutAmt || Number(cashOutAmt) < 1) { notify('Enter an amount.', 'error'); return; }
    if (!selectedPayoutId) { notify('Add a payout account first.', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await client.post('/merchant/cash-out', { amount: Number(cashOutAmt), payout_account_id: Number(selectedPayoutId) });
      notify(res.data.message);
      setCashOutAmt('');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not request cash-out.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Reports & Analytics</h2>
        <p className="text-white/75 text-sm mt-1">Revenue trends, best sellers, and payout history.</p>
      </div>

      {/* Date filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {RANGES.map((r) => (
          <button key={r.label} onClick={() => setRange(r.label)} className={`chip border ${range === r.label ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{r.label}</button>
        ))}
        {range === 'Custom' && (
          <div className="flex gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="field w-40" />
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="field w-40" />
          </div>
        )}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field bg-white w-40 ml-auto">
          <option value="units">Sort by units sold</option>
          <option value="revenue">Sort by revenue</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center"><p className="text-xs text-ink-400">Orders</p><p className="text-2xl font-black">{data.summary.orders}</p></div>
            <div className="card p-3 text-center"><p className="text-xs text-ink-400">Revenue</p><p className="text-2xl font-black">₱{Number(data.summary.revenue).toLocaleString()}</p></div>
            <div className="card p-3 text-center"><p className="text-xs text-ink-400">Units sold</p><p className="text-2xl font-black">{data.summary.units}</p></div>
          </div>

          {/* Daily trend */}
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Daily revenue trend</h3>
            <div className="card p-4 overflow-x-auto">
              <div className="flex gap-2 min-w-[400px]">
                {data.trend.map((d) => {
                  const max = Math.max(...data.trend.map((t) => t.revenue), 1);
                  const h = Math.max(10, (d.revenue / max) * 100);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-ink-700">₱{d.revenue}</span>
                      <div className="w-full bg-bayan-200 rounded-t" style={{ height: `${h}px` }} />
                      <span className="text-[9px] text-ink-400">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Best sellers */}
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Best sellers</h3>
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider"><th className="p-2 text-left">Product</th><th className="p-2 text-left">Category</th><th className="p-2 text-right">Sold</th><th className="p-2 text-right">Revenue</th><th className="p-2 text-right">Stock</th></tr></thead>
                <tbody>
                  {data.best_sellers.map((p) => (
                    <tr key={p.product_id} className="border-t border-ink-50">
                      <td className="p-2 font-bold text-ink-800">{p.name}</td>
                      <td className="p-2 text-ink-400">{p.category}</td>
                      <td className="p-2 text-right font-bold">{p.units_sold}</td>
                      <td className="p-2 text-right font-bold text-bayan-700">₱{Number(p.revenue).toLocaleString()}</td>
                      <td className="p-2 text-right">{p.current_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wallet + cash-out */}
          <div className="card p-4 space-y-3">
            <h3 className="font-extrabold text-ink-800">Payout & Wallet</h3>
            <p className="text-sm">Balance: <span className="font-black text-lg">₱{Number(data.wallet.balance).toLocaleString()}</span></p>

            {/* Payout account selector */}
            {payoutAccounts.length === 0 ? (
              <div className="bg-amber-50 rounded-xl p-3 space-y-2">
                <p className="text-xs text-amber-800 font-bold">No payout account yet.</p>
                <button onClick={() => navigate('/merchant/settings/payouts')} className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">+ Add payout method</button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Withdraw to</label>
                <select value={selectedPayoutId} onChange={(e) => setSelectedPayoutId(e.target.value)} className="field bg-white">
                  {payoutAccounts.map((a) => <option key={a.id} value={a.id}>{a.display_label}{a.is_default ? ' (Primary)' : ''}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <input type="number" min="1" value={cashOutAmt} onChange={(e) => setCashOutAmt(e.target.value)} placeholder="Amount to withdraw" className="field flex-1" />
              <button onClick={requestCashOut} disabled={submitting || !selectedPayoutId} className="px-5 py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl">{submitting ? '…' : 'Request cash-out'}</button>
            </div>

            {data.wallet.withdrawals?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-ink-500 uppercase">Withdrawal history</p>
                {data.wallet.withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold">₱{Number(w.amount).toLocaleString()}</span>
                    <span className={`chip border ${w.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : w.status === 'declined' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{w.status}</span>
                    <span className="text-ink-400">{new Date(w.requested_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Transaction history (ledger) */}
            {data.wallet.history?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-ink-500 uppercase mt-3">Transaction history</p>
                <div className="divide-y divide-ink-100">
                  {data.wallet.history.map((tx) => (
                    <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-semibold text-ink-800 truncate">{tx.description}</div>
                        <div className="text-ink-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`font-bold whitespace-nowrap ${tx.direction === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                        {tx.direction === 'credit' ? '+' : '−'}₱{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}