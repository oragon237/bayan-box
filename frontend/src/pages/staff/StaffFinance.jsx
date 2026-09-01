import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

export default function StaffFinance({ user }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderId, setRiderId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/finance');
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const recordRemit = async (e) => {
    e.preventDefault();
    if (!riderId || !amount || Number(amount) <= 0) {
      notify('Select a rider and enter a valid amount.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post('/staff/finance/remit', {
        rider_id: Number(riderId),
        amount: Number(amount),
        notes: notes.trim() || null,
      });
      notify(res.data.message);
      setAmount('');
      setNotes('');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not record remittance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return <div className="text-center text-ink-400 py-20">No data available.</div>;

  const { riders, recent, pickup_collections: pickupCollections = [], pickup_cod_collected: pickupCodCollected = 0, collection_transactions: collectionTransactions = [] } = data;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-teal-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">COD Collections & Remittance</h2>
        <p className="text-white/75 text-sm mt-1">Track hub collections, record rider cash deposits, and reconcile balances.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold text-ink-400 uppercase">Riders</p>
          <p className="text-2xl font-black text-ink-900">{riders.length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold text-ink-400 uppercase">Rider COD collected</p>
          <p className="text-2xl font-black text-amber-700">₱{Number(riders.reduce((s, r) => s + r.cod_collected, 0)).toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold text-ink-400 uppercase">Hub COD collected</p>
          <p className="text-2xl font-black text-bayan-700">₱{Number(pickupCodCollected).toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold text-ink-400 uppercase">Outstanding</p>
          <p className="text-2xl font-black text-red-600">₱{Number(data.total_outstanding).toLocaleString()}</p>
        </div>
      </div>

      {/* All cash collection events */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Collection Transaction Register</h3>
        {collectionTransactions.length === 0 ? (
          <div className="card p-4 text-center text-sm text-ink-400">No COD collection transactions recorded yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                <th className="p-2 text-left">Recorded</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Reference</th><th className="p-2 text-left">Handled by</th><th className="p-2 text-right">Amount</th>
              </tr></thead>
              <tbody>{collectionTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-ink-50">
                  <td className="p-2 text-ink-400 whitespace-nowrap">{transaction.recorded_at ? new Date(transaction.recorded_at).toLocaleString() : '—'}</td>
                  <td className="p-2"><span className="chip border bg-bayan-50 text-bayan-700 border-bayan-200">{String(transaction.type).replace(/_/g, ' ')}</span></td>
                  <td className="p-2 font-bold text-ink-700">{transaction.reference}</td>
                  <td className="p-2 text-ink-600">{transaction.collected_by}</td>
                  <td className="p-2 text-right font-bold text-green-700">₱{Number(transaction.amount).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Click-and-collect COD receipts */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Hub COD Collections</h3>
        {pickupCollections.length === 0 ? (
          <div className="card p-4 text-center text-sm text-ink-400">No completed click-and-collect COD orders.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                  <th className="p-2 text-left">Order</th>
                  <th className="p-2 text-left">Hub</th>
                  <th className="p-2 text-left">Collected by</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">Collected at</th>
                </tr>
              </thead>
              <tbody>
                {pickupCollections.map((collection) => (
                  <tr key={collection.id} className="border-t border-ink-50">
                    <td className="p-2 font-bold text-ink-800">{collection.display_id}</td>
                    <td className="p-2 text-ink-600">{collection.hub_name}</td>
                    <td className="p-2 text-ink-600">{collection.collected_by}</td>
                    <td className="p-2 text-right font-bold text-bayan-700">₱{Number(collection.amount).toLocaleString()}</td>
                    <td className="p-2 text-right text-ink-400">{collection.collected_at ? new Date(collection.collected_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record remittance form */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold text-ink-800">Record Cash Remittance</h3>
        <form onSubmit={recordRemit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={riderId} onChange={(e) => setRiderId(e.target.value)} className="field bg-white" required>
              <option value="">Select rider…</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.outstanding > 0.01 ? `(₱${Number(r.outstanding).toLocaleString()} outstanding)` : ''}
                </option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="field pl-7"
                required
              />
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes (e.g. batch #)"
              className="field"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
            {submitting ? 'Recording…' : 'Record Remittance'}
          </button>
        </form>
      </div>

      {/* Rider COD table */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Rider COD Summary</h3>
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
              {riders.map((r) => (
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

      {/* Rider remittances */}
      {recent?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Rider COD Remittances</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                  <th className="p-2 text-left">Rider</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-left">Notes</th>
                  <th className="p-2 text-left">Recorded by</th>
                  <th className="p-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-ink-50">
                    <td className="p-2 font-bold text-ink-800">{r.rider_name}</td>
                    <td className="p-2 text-right font-bold text-green-700">₱{Number(r.amount).toLocaleString()}</td>
                    <td className="p-2 text-ink-400">{r.notes || '—'}</td>
                    <td className="p-2 text-ink-500">{r.recorded_by || '—'}</td>
                    <td className="p-2 text-right text-ink-400">{new Date(r.created_at).toLocaleString()}</td>
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
