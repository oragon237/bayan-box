import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function AdminMerchantList({ user }) {
  const notify = useToast();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null); // merchant id being viewed
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/merchants', { params: { per_page: 100 } });
      let list = res.data.data;
      if (filter !== 'all') list = list.filter((m) => m.status === filter);
      setMerchants(list);
    } catch {
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const view = async (m) => {
    setViewing(m);
    setDetail(null);
    try {
      const res = await client.get(`/admin/merchants/${m.id}`);
      setDetail(res.data);
    } catch {
      notify('Could not load details.', 'error');
    }
  };

  const approve = async (m) => {
    try {
      await client.post(`/admin/merchants/${m.id}/approve`);
      notify(`Approved ${m.name}.`);
      setViewing(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed.', 'error');
    }
  };

  const deactivate = async (m) => {
    try {
      await client.post(`/admin/merchants/${m.id}/deactivate`);
      notify(`${m.name} deactivated.`);
      setViewing(null);
      load();
    } catch {
      notify('Failed.', 'error');
    }
  };

  const activate = async (m) => {
    try {
      await client.post(`/admin/merchants/${m.id}/activate`);
      notify(`${m.name} activated.`);
      setViewing(null);
      load();
    } catch {
      notify('Failed.', 'error');
    }
  };

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending_verification', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'deactivated', label: 'Deactivated' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const statusColor = (s) =>
    s === 'active'
      ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'pending_verification'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : s === 'deactivated'
      ? 'bg-ink-100 text-ink-500 border-ink-200'
      : 'bg-red-50 text-red-600 border-red-200';

  const docs = detail?.documents || {};

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Merchants</h2>
        <p className="text-white/75 text-sm mt-1">Approve, activate, deactivate, and review merchant documents.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip border shrink-0 ${filter === f.value ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : merchants.length === 0 ? (
        <EmptyState icon="🏪" title="No merchants" hint="No merchant accounts match this filter." />
      ) : (
        <div className="space-y-3">
          {merchants.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-ink-800">{m.name}</h4>
                  <p className="text-xs text-ink-400">📱 {m.phone} · {m.municipality || '—'}</p>
                </div>
                <span className={`chip border ${statusColor(m.status)} shrink-0`}>{m.status.replace('_', ' ')}</span>
              </div>

              {m.status === 'pending_verification' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => approve(m)} className="flex-1 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">
                    ✅ Approve
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button onClick={() => view(m)} className="flex-1 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-xl">
                  👁 View details
                </button>
                {m.status !== 'active' && m.status !== 'pending_verification' && (
                  <button onClick={() => activate(m)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">
                    Activate
                  </button>
                )}
                {m.status === 'active' && (
                  <button onClick={() => deactivate(m)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setViewing(null)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-ink-800">{viewing.name}</h3>
              <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="text-sm text-ink-500 space-y-1">
              <p>📱 {viewing.phone}</p>
              <p>📍 {viewing.municipality || '—'}</p>
              <p>🕐 Joined {new Date(viewing.created_at).toLocaleDateString()}</p>
            </div>

            {!detail ? (
              <p className="text-center text-ink-400 animate-pulse-soft py-6">Loading documents…</p>
            ) : (
              <>
                {/* Picture */}
                {docs.picture_url && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink-500 uppercase">Merchant photo</p>
                    <img src={docs.picture_url} alt="Merchant" className="w-24 h-24 rounded-2xl object-cover border border-ink-200" />
                  </div>
                )}

                {/* DTI/SEC */}
                <div className="bg-ink-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-ink-500 uppercase">DTI / SEC Registration</p>
                  <p className="font-black text-ink-800 mt-1">{docs.dti_sec_number || '—'}</p>
                </div>

                {/* Government ID */}
                <div className="bg-ink-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-ink-500 uppercase">Government ID</p>
                  {docs.government_id_url ? (
                    <a href={docs.government_id_url} target="_blank" rel="noreferrer">
                      <img src={docs.government_id_url} alt="Government ID" className="w-full h-40 object-cover rounded-xl border border-ink-200" />
                    </a>
                  ) : (
                    <p className="text-ink-400 text-sm">No government ID uploaded.</p>
                  )}
                </div>

                {/* Business permit */}
                <div className="bg-ink-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-ink-500 uppercase">Business permit</p>
                  {docs.business_permit_url ? (
                    <a href={docs.business_permit_url} target="_blank" rel="noreferrer">
                      <img src={docs.business_permit_url} alt="Business permit" className="w-full h-40 object-cover rounded-xl border border-ink-200" />
                    </a>
                  ) : (
                    <p className="text-ink-400 text-sm">No business permit uploaded.</p>
                  )}
                </div>

                {/* Message / notes */}
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 uppercase">Message / notes</p>
                  <p className="text-sm text-amber-900 mt-1">{docs.verification_message || viewing.verification_notes || 'No message.'}</p>
                </div>

                {/* Product count */}
                <p className="text-sm text-ink-500">📦 Listed products: <b>{detail.product_count ?? 0}</b></p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {viewing.status === 'pending_verification' && (
                    <button onClick={() => approve(viewing)} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">
                      ✅ Approve & SMS
                    </button>
                  )}
                  {viewing.status === 'active' ? (
                    <button onClick={() => deactivate(viewing)} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">
                      Deactivate
                    </button>
                  ) : (
                    viewing.status !== 'pending_verification' && (
                      <button onClick={() => activate(viewing)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">
                        Activate
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}