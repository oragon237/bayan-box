import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import { EmptyState, useToast, Spinner } from '../../components/ui.jsx';

const STATUS_STYLE = { delivered: 'bg-green-50 text-green-700 border-green-200', cancelled: 'bg-red-50 text-red-600 border-red-200', disputed: 'bg-amber-50 text-amber-700 border-amber-200' };

export default function StaffDispatch({ user }) {
  const notify = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'dispatch');
  const [ready, setReady] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [selectedRider, setSelectedRider] = useState({});
  const [auditOrder, setAuditOrder] = useState(null);
  const [auditData, setAuditData] = useState(null);

  // History filters
  const [history, setHistory] = useState([]);
  const [histPage, setHistPage] = useState(1);
  const [histLastPage, setHistLastPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [perPage, setPerPage] = useState(10);

  const loadDispatch = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/ops/dispatch');
      setReady(res.data.ready_orders || []);
      setRiders(res.data.riders || []);
    } catch { setReady([]); } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = { per_page: perPage, page: histPage, status: statusFilter };
      if (searchQ.trim()) params.search = searchQ.trim();
      if (dateRange === 'custom') { if (customFrom) params.startDate = customFrom; if (customTo) params.endDate = customTo; }
      else if (dateRange === '7') { params.startDate = new Date(Date.now() - 7*864e5).toISOString().slice(0,10); }
      else if (dateRange === '30') { params.startDate = new Date(Date.now() - 30*864e5).toISOString().slice(0,10); }
      const res = await client.get('/staff/ops/history', { params });
      setHistory(res.data.data || []);
      setHistPage(res.data.current_page || 1);
      setHistLastPage(res.data.last_page || 1);
      setHistTotal(res.data.total || 0);
    } catch { setHistory([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'dispatch') loadDispatch(); }, [tab]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, histPage, perPage, statusFilter, dateRange]);
  useEffect(() => { setHistPage(1); }, [searchQ, statusFilter, dateRange]);
  useEffect(() => { if (dateRange === 'custom' && customFrom && customTo) loadHistory(); }, [customFrom, customTo]);

  const assignAuto = async (orderId) => {
    setAssigning(`auto-${orderId}`);
    try { const res = await client.post(`/staff/ops/dispatch/${orderId}/assign`, {}); notify(res.data.message); loadDispatch(); }
    catch (err) { notify(err.response?.data?.message || 'Could not assign.', 'error'); } finally { setAssigning(null); }
  };

  const assignManual = async (orderId, riderId) => {
    if (!riderId) return;
    setAssigning(`manual-${orderId}`);
    try { const res = await client.post(`/staff/ops/dispatch/${orderId}/assign`, { rider_id: riderId }); notify(res.data.message); loadDispatch(); }
    catch (err) { notify(err.response?.data?.message || 'Could not assign.', 'error'); } finally { setAssigning(null); }
  };

  const loadAudit = async (id) => {
    setAuditOrder(id);
    setAuditData(null);
    try { const res = await client.get(`/staff/ops/orders/${id}/audit`); setAuditData(res.data); }
    catch { notify('Could not load audit.', 'error'); }
  };

  const exportCSV = () => {
    const rows = [['Order ID','Date','Status','Customer','Merchant','Rider','Method','Total','Trip Min']];
    history.forEach((h) => rows.push([h.display_id, h.created_at?.slice(0,10), h.status, h.customer?.name, h.merchant?.name, h.rider?.name, h.dispatch_method, h.total_amount, h.trip_duration_min]));
    const csv = rows.map((r) => r.map((v) => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dispatch_history.csv'; a.click();
    URL.revokeObjectURL(url);
    notify('CSV exported.');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Dispatch Center</h2>
        <p className="text-white/75 text-sm mt-1">Live dispatch and delivery history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('dispatch')} className={`chip border ${tab === 'dispatch' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>🚚 Live Dispatch</button>
        <button onClick={() => setTab('history')} className={`chip border ${tab === 'history' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>📜 Delivery History</button>
      </div>

      {tab === 'dispatch' ? (
        <>
          {/* Riders summary */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {riders.map((r) => (
              <div key={r.id} className="card px-3 py-2 shrink-0">
                <p className="font-bold text-ink-800 text-sm">🛵 {r.name}</p>
                <p className="text-[10px] text-ink-400">{r.active_orders} active order(s)</p>
              </div>
            ))}
          </div>

          {/* Map */}
          {ready.length > 0 && (
            <div className="card !p-0 overflow-hidden" style={{ height: 220 }}>
              <DeliveryMap origin={[123.1948, 13.6218]} destination={ready[0]?.latitude && ready[0]?.longitude ? [ready[0].longitude, ready[0].latitude] : undefined} className="w-full h-full" />
            </div>
          )}

          {loading ? <div className="space-y-3" /> : ready.length === 0 ? (
            <EmptyState icon="✅" title="All dispatched" hint="No orders awaiting rider assignment." />
          ) : (
            <div className="space-y-3">
              {ready.map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-ink-800">Order #{o.id} — ₱{Number(o.total_amount).toLocaleString()}</p>
                    <p className="text-xs text-ink-400">Customer: {o.customer?.name} · {o.customer?.phone}</p>
                    <p className="text-xs text-ink-500">📦 {o.items?.map((i) => i.product?.name).join(', ') || '—'}</p>
                    <p className="text-[11px] text-ink-400">📍 {o.delivery_address || 'Address on record'}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button onClick={() => assignAuto(o.id)} disabled={assigning === `auto-${o.id}`} className="w-full py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-xs font-bold rounded-xl">
                      {assigning === `auto-${o.id}` ? 'Assigning…' : '⚡ Auto-assign'}
                    </button>
                    <div className="flex gap-2">
                      <select value={selectedRider[o.id] || ''} onChange={(e) => setSelectedRider((p) => ({ ...p, [o.id]: e.target.value }))} className="field flex-1 bg-white">
                        <option value="">Manual assign…</option>
                        {riders.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.active_orders} active</option>)}
                      </select>
                      <button onClick={() => assignManual(o.id, selectedRider[o.id])} disabled={!selectedRider[o.id] || assigning === `manual-${o.id}`} className="px-4 py-2 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-xl">Assign</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filters bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search by Order ID, customer, merchant, rider…" aria-label="Search history" className="field flex-1 min-w-48" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter" className="field bg-white w-36">
                <option value="all">All statuses</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Failed / Returned</option>
              </select>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} aria-label="Date range" className="field bg-white w-36">
                <option value="">All dates</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} aria-label="Items per page" className="field bg-white w-24">
                <option value={10}>10/page</option>
                <option value={25}>25/page</option>
                <option value={50}>50/page</option>
              </select>
              <button onClick={exportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">📥 Export CSV</button>
            </div>
            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} aria-label="From date" className="field w-44" />
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} aria-label="To date" className="field w-44" />
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-12 bg-ink-200 rounded-xl animate-pulse-soft" />)}</div>
          ) : history.length === 0 ? (
            <EmptyState icon="📜" title="No delivery history" hint="No records match your filters." />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-xs" role="table">
                <thead><tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider">
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Merchant</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Raider</th>
                  <th className="p-2 text-center">Method</th>
                  <th className="p-2 text-right">Duration</th>
                  <th className="p-2 text-center">Status</th>
                  <th className="p-2 text-center">Actions</th>
                </tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-ink-50 hover:bg-ink-50 transition">
                      <td className="p-2">
                        <p className="font-bold text-ink-800">{h.display_id}</p>
                        <p className="text-[10px] text-ink-400">{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</p>
                      </td>
                      <td className="p-2">
                        <p className="font-bold text-ink-700">{h.merchant?.name || '—'}</p>
                        <p className="text-[10px] text-ink-400">{h.merchant?.municipality || ''}</p>
                      </td>
                      <td className="p-2">
                        <p className="text-ink-800">{h.customer?.name || '—'}</p>
                        <p className="text-[10px] text-ink-400">{h.delivery_address || ''}</p>
                      </td>
                      <td className="p-2">
                        <p className="text-ink-800">{h.rider?.name || '—'}</p>
                        <p className="text-[10px] text-ink-400">#{h.rider?.id || ''}</p>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`chip border ${h.dispatch_method === 'auto' ? 'bg-bayan-50 text-bayan-700 border-bayan-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {h.dispatch_method === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-2 text-right font-bold">{h.trip_duration_min != null ? `${h.trip_duration_min} min` : '—'}</td>
                      <td className="p-2 text-center">
                        <span className={`chip border ${STATUS_STYLE[h.status] || 'bg-ink-100 text-ink-500'}`}>{h.status}</span>
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => loadAudit(h.id)} className="px-2 py-1 bg-bayan-50 hover:bg-bayan-100 text-bayan-700 text-[10px] font-bold rounded-lg">👁 Timeline</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {histLastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setHistPage(Math.max(1, histPage - 1))} disabled={histPage <= 1} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg">← Prev</button>
              <span className="text-xs font-bold text-ink-500">Page {histPage} of {histLastPage} ({histTotal} total)</span>
              <button onClick={() => setHistPage(Math.min(histLastPage, histPage + 1))} disabled={histPage >= histLastPage} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Audit modal */}
      {auditOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setAuditOrder(null); setAuditData(null); }}>
          <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-black text-ink-800">Order Audit</h3>
              <button onClick={() => { setAuditOrder(null); setAuditData(null); }} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">✕</button>
            </div>
            {!auditData ? (
              <div className="p-10 text-center"><Spinner /></div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-sm text-ink-400">Order #{auditData.order.id} · {auditData.order.status}</p>

                {/* Lifecycle timeline */}
                <div className="space-y-2">
                  <h4 className="font-bold text-ink-800">⏱ Lifecycle</h4>
                  <div className="space-y-1.5 text-sm">
                    {Object.entries(auditData.lifecycle).map(([key, val]) => val && (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-bayan-600" />
                        <span className="text-ink-500 capitalize w-36">{key.replace(/_/g, ' ')}</span>
                        <span className="text-ink-800">{new Date(val).toLocaleString()}</span>
                      </div>
                    ))}
                    {auditData.lifecycle.cancelled_reason && (
                      <div className="flex items-center gap-2 text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="w-36">Cancel reason</span>
                        <span className="font-bold">{auditData.lifecycle.cancelled_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof of delivery */}
                <div className="bg-ink-50 rounded-xl p-3 space-y-1">
                  <h4 className="font-bold text-ink-800">📸 Proof of delivery</h4>
                  <p className="text-sm text-ink-600">PIN: <span className="font-bold">{auditData.proof_of_delivery.pin || '—'}</span></p>
                  {auditData.proof_of_delivery.photo_url && (
                    <a href={auditData.proof_of_delivery.photo_url} target="_blank" rel="noreferrer" className="text-sm text-bayan-700 font-bold hover:underline">
                      📎 View delivery photo
                    </a>
                  )}
                  <p className="text-sm text-ink-500">Assigned via: {auditData.proof_of_delivery.dispatch_method || '—'} by {auditData.proof_of_delivery.assigned_by || '—'}</p>
                </div>

                {/* Customer reviews */}
                <div>
                  <h4 className="font-bold text-ink-800 mb-2">⭐ Customer feedback</h4>
                  {auditData.reviews.length === 0 ? (
                    <p className="text-sm text-ink-400">No feedback left.</p>
                  ) : (
                    auditData.reviews.map((r, i) => (
                      <div key={i} className="text-sm border-b border-ink-50 pb-2 mb-2 last:border-0">
                        <p className="font-bold text-ink-800">{r.user} — {'★'.repeat(Math.round(r.rating))}</p>
                        {r.review && <p className="text-ink-600">{r.review}</p>}
                        <p className="text-[11px] text-ink-400">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}