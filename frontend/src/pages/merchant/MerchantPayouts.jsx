import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const BANKS = ['BDO', 'BPI', 'Landbank', 'UnionBank', 'Metrobank', 'RCBC', 'Security Bank', 'Maya Bank', 'SeaBank', 'Gotyme'];

const TYPE_META = {
  gcash: { icon: '💙', label: 'GCash' },
  maya: { icon: '💚', label: 'Maya' },
  bank: { icon: '🏦', label: 'Bank Transfer' },
};

const EMPTY = { account_type: 'gcash', account_name: '', mobile_number: '', bank_name: 'BDO', account_number: '', branch: '', is_default: false };

export default function MerchantPayouts({ user }) {
  const notify = useToast();
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState(null); // {id?, ...form}
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await client.get('/merchant/payouts');
      setAccounts(res.data.accounts || []);
    } catch {
      setAccounts([]);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError('');
    if (!modal.account_name.trim()) { setError('Account holder name is required.'); return; }
    if (modal.account_type === 'bank') {
      if (!modal.account_number.trim()) { setError('Account number is required.'); return; }
    } else if (!/^09[0-9]{9}$/.test(modal.mobile_number || '')) {
      setError('Enter a valid mobile number (09XXXXXXXXX).');
      return;
    }
    setSaving(true);
    try {
      if (modal.id) await client.put(`/merchant/payouts/${modal.id}`, modal);
      else await client.post('/merchant/payouts', modal);
      notify('Payout account saved.');
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    await client.post(`/merchant/payouts/${id}/default`).catch(() => {});
    notify('Default payout account set.');
    load();
  };

  const remove = async (id) => {
    await client.delete(`/merchant/payouts/${id}`).catch(() => {});
    notify('Payout account deleted.');
    load();
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => notify('Copied!')).catch(() => {});
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Payout Methods</h2>
        <p className="text-white/75 text-sm mt-1">Manage accounts used to receive your wallet cash-outs.</p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModal({ ...EMPTY })} className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">+ Add payout account</button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon="💳" title="No payout accounts" hint="Add a GCash, Maya, or bank account to receive withdrawals." />
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => {
            const meta = TYPE_META[a.account_type] || { icon: '💳', label: a.account_type };
            return (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <p className="font-bold text-ink-800 flex items-center gap-2">
                        {meta.label} {a.is_default && <span className="chip border bg-amber-50 text-amber-700 border-amber-200">⭐ Primary</span>}
                      </p>
                      <p className="text-sm text-ink-600">{a.account_name}</p>
                      <p className="text-xs text-ink-400">
                        {a.account_type === 'bank'
                          ? `${a.bank_name} · ${a.account_number} (${a.masked_account})`
                          : a.mobile_number}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => copy(a.account_type === 'bank' ? `${a.bank_name} ${a.account_number}` : a.mobile_number)} className="px-2 py-1 text-[11px] font-bold bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-lg">📋 Copy</button>
                </div>
                <div className="flex gap-2 mt-3">
                  {!a.is_default && <button onClick={() => setDefault(a.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">⭐ Set default</button>}
                  <button onClick={() => setModal(a)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">✏️ Edit</button>
                  <button onClick={() => remove(a.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setModal(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-ink-800">{modal.id ? 'Edit payout account' : 'Add payout account'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">✕</button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_META).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setModal({ ...modal, account_type: k })} className={`p-2 rounded-xl border text-xs font-bold ${modal.account_type === k ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{v.icon} {v.label}</button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Account holder name</label>
              <input value={modal.account_name} onChange={(e) => setModal({ ...modal, account_name: e.target.value })} placeholder="Full legal name" className="field" />
            </div>

            {modal.account_type === 'bank' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Bank</label>
                    <select value={modal.bank_name} onChange={(e) => setModal({ ...modal, bank_name: e.target.value })} className="field bg-white">
                      {BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Account number</label>
                    <input value={modal.account_number} onChange={(e) => setModal({ ...modal, account_number: e.target.value })} className="field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Branch / notes (optional)</label>
                  <input value={modal.branch} onChange={(e) => setModal({ ...modal, branch: e.target.value })} className="field" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Mobile number</label>
                <input value={modal.mobile_number} onChange={(e) => setModal({ ...modal, mobile_number: e.target.value })} placeholder="09XXXXXXXXX" className="field" />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={modal.is_default} onChange={(e) => setModal({ ...modal, is_default: e.target.checked })} className="w-4 h-4 text-bayan-600" />
              <span className="text-xs font-bold text-ink-700">Set as primary account for automatic wallet payouts</span>
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button onClick={save} disabled={saving} className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl">{saving ? 'Saving…' : 'Save payout account'}</button>
          </div>
        </div>
      )}
    </div>
  );
}