import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function AdminAffiliates({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('cashouts');
  const [affiliates, setAffiliates] = useState([]);
  const [cashOuts, setCashOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(20);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sort, setSort] = useState('desc');

  // Detail modal
  const [detail, setDetail] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'cashouts') {
        const res = await client.get('/admin/affiliates/cash-outs', { params: { per_page: 100 } });
        setCashOuts(res.data.data || []);
      } else {
        const params = { per_page: perPage, page, sort };
        if (search.trim()) params.search = search.trim();
        if (roleFilter) params.role = roleFilter;
        if (cityFilter) params.city = cityFilter;
        const res = await client.get('/admin/affiliates', { params });
        setAffiliates(res.data.data || []);
        setPage(res.data.current_page || 1);
        setLastPage(res.data.last_page || 1);
        setTotal(res.data.total || 0);
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
  }, [tab, page, perPage, sort, roleFilter, cityFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, cityFilter, sort]);

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

  const activate = async (id) => {
    try {
      const res = await client.post(`/admin/affiliates/${id}/activate`);
      notify(res.data.message);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not activate.', 'error');
    }
  };

  const ROLE_BADGE = {
  customer: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  merchant: 'bg-purple-50 text-purple-700 border-purple-200',
  rider: 'bg-orange-50 text-orange-700 border-orange-200',
  provider: 'bg-teal-50 text-teal-700 border-teal-200',
};

const statusColor = (s) =>
    s === 'paid' ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'declined' ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Affiliates</h2>
        <p className="text-white/75 text-sm mt-1">Track commissions, manage cash-out requests, and activate affiliates.</p>
      </div>

      <div className="flex gap-2">
        {['cashouts', 'commissions'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`chip border ${tab === t ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
          >
            {t === 'cashouts' ? 'Cash-out requests' : 'Commission tracking'}
          </button>
        ))}
      </div>

      {tab === 'commissions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or code…"
            className="field"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="field bg-white">
            <option value="">All roles</option>
            <option value="customer">Customer</option>
            <option value="merchant">Merchant</option>
            <option value="staff">Staff</option>
            <option value="rider">Rider</option>
            <option value="provider">Provider</option>
          </select>
          <input
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="City / municipality…"
            className="field"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="field bg-white">
            <option value="desc">Highest earnings</option>
            <option value="asc">Lowest earnings</option>
          </select>
        </div>
      )}

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
                    <button onClick={() => approve(co.id)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">
                      ✅ Approve & pay
                    </button>
                    <button onClick={() => decline(co.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition">
                      ✕ Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : affiliates.length === 0 ? (
        <EmptyState icon="🤝" title="No affiliates" hint="No accounts with affiliate codes match your filters." />
      ) : (
        <div className="space-y-2">
          {affiliates.map((a) => (
            <div key={a.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-800 truncate">
                    {a.name}
                    <span className={`ml-1.5 chip border ${ROLE_BADGE[a.role] || 'bg-ink-50 text-ink-600 border-ink-200'}`}>{a.role}</span>
                  </p>
                  <p className="text-xs text-ink-400 truncate">Code: {a.affiliate_code} · {a.municipality || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-ink-900">₱{Number(a.earnings).toLocaleString()}</p>
                  <span className={`chip border ${a.affiliate_status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {a.affiliate_status}
                  </span>
                </div>
              </div>

              {a.affiliate_documents?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.affiliate_documents.map((d, i) => (
                    <button key={i} onClick={() => setLightbox(d.id_url)} className="w-14 h-14 rounded-lg overflow-hidden border border-ink-200">
                      <img src={d.id_url} alt="Requirement" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button onClick={() => setDetail(a)} className="flex-1 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-xl transition">
                  👁 View
                </button>
                {a.affiliate_status !== 'active' && (
                  <button onClick={() => activate(a.id)} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">
                    ✅ Activate
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-3 pt-3">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg">
                ← Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-bold ${page === p ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(Math.min(lastPage, page + 1))} disabled={page >= lastPage} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg">
                Next →
              </button>
              <span className="text-xs text-ink-400">({total} total)</span>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetail(null)}>
          <div className="bg-white w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-ink-800">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">✕</button>
            </div>
            <div className="text-sm space-y-2 text-ink-500">
              <p>📱 {detail.phone}</p>
              <p>🔗 Code: {detail.affiliate_code}</p>
              <p>📍 {detail.municipality || '—'}{detail.barangay ? `, ${detail.barangay}` : ''}</p>
              <p>🎭 Role: <span className={`chip border ${ROLE_BADGE[detail.role] || 'bg-ink-50 text-ink-600 border-ink-200'}`}>{detail.role}</span></p>
              <p>💰 Earnings: <span className="font-bold text-ink-900">₱{Number(detail.earnings).toLocaleString()}</span></p>
              <p>📋 Affiliate status: <span className={`chip border ${detail.affiliate_status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{detail.affiliate_status}</span></p>
              <p>🕐 Joined: {detail.created_at ? new Date(detail.created_at).toLocaleDateString() : '—'}</p>
              {detail.affiliate_activated_at && <p>✅ Activated: {new Date(detail.affiliate_activated_at).toLocaleDateString()}</p>}
            </div>
            {detail.affiliate_documents?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-ink-500 uppercase mb-2">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {detail.affiliate_documents.map((d, i) => (
                    <button key={i} onClick={() => setLightbox(d.id_url)} className="w-20 h-20 rounded-xl overflow-hidden border border-ink-200">
                      <img src={d.id_url} alt="Doc" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {detail.affiliate_status !== 'active' && (
              <button onClick={() => { activate(detail.id); setDetail(null); }} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition">
                ✅ Activate affiliate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white text-lg font-bold flex items-center justify-center z-10">✕</button>
          <img src={lightbox} alt="Preview" className="max-w-full max-h-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}