import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function AdminAffiliates({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('cashouts');
  const [affiliates, setAffiliates] = useState([]);
  const [cashOuts, setCashOuts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'cashouts') {
        const res = await client.get('/admin/affiliates/cash-outs', { params: { per_page: 100 } });
        setCashOuts(res.data.data || []);
      } else {
        const res = await client.get('/admin/affiliates', { params: { all: true } });
        setAffiliates(res.data.affiliates || []);
      }
    } catch {
      setCashOuts([]);
      setAffiliates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const approve = async (id) => {
    try {
      const res = await client.post(`/admin/affiliates/cash-outs/${id}/approve`);
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not approve.', 'error');
    }
  };

  const decline = async (id) => {
    try {
      await client.post(`/admin/affiliates/cash-outs/${id}/decline`, { reason: 'Declined by admin' });
      notify('Cash-out declined.');
      load();
    } catch {
      notify('Could not decline.', 'error');
    }
  };

  const statusColor = (s) =>
    s === 'paid'
      ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'declined'
      ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Affiliates</h2>
        <p className="text-white/75 text-sm mt-1">Track commissions and manage cash-out requests.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('cashouts')}
          className={`chip border ${tab === 'cashouts' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
        >
          Cash-out requests
        </button>
        <button
          onClick={() => setTab('commissions')}
          className={`chip border ${tab === 'commissions' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
        >
          Commission tracking
        </button>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : tab === 'cashouts' ? (
        cashOuts.length === 0 ? (
          <EmptyState icon="💸" title="No cash-out requests" hint="Affiliate cash-out requests will appear here." />
        ) : (
          <div className="space-y-3">
            {cashOuts.map((co) => (
              <div key={co.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink-800">₱{Number(co.amount).toLocaleString()}</p>
                    <p className="text-xs text-ink-400">{co.user?.name} · {co.user?.phone}</p>
                    <p className="text-[11px] text-ink-400">Requested {new Date(co.requested_at).toLocaleString()}</p>
                  </div>
                  <span className={`chip border ${statusColor(co.status)}`}>{co.status}</span>
                </div>
                {co.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approve(co.id)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">
                      ✅ Approve & pay
                    </button>
                    <button onClick={() => decline(co.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl">
                      ✕ Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : affiliates.length === 0 ? (
        <EmptyState icon="🤝" title="No affiliates" hint="Accounts with referral codes will appear here." />
      ) : (
        <div className="space-y-2">
          {affiliates.map((a) => (
            <div key={a.id} className="card p-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-ink-800">{a.name} <span className="text-[10px] text-ink-400">({a.role})</span></p>
                <p className="text-xs text-ink-400">Code: {a.affiliate_code}</p>
              </div>
              <p className="font-black text-ink-900">₱{Number(a.earnings).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}