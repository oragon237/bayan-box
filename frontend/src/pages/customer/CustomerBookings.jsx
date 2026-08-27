import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  provider_completed: 'bg-blue-50 text-blue-700 border-blue-200',
  rework: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function CustomerBookings({ user }) {
  const notify = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reworkReason, setReworkReason] = useState({});
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/bookings', { params: { per_page: 50 } });
      setBookings(res.data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirm = async (id) => {
    setBusy(`confirm-${id}`);
    try {
      const res = await client.post(`/bookings/${id}/confirm`);
      notify(`Job confirmed! ₱${Number(res.data.payout).toLocaleString()} released to provider.`);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not confirm.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const rework = async (id) => {
    setBusy(`rework-${id}`);
    try {
      await client.post(`/bookings/${id}/rework`, { reason: reworkReason[id] || null });
      notify('Re-work requested. Provider has been notified.');
      setReworkReason((prev) => ({ ...prev, [id]: '' }));
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not request re-work.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Provider Bookings</h2>
        <p className="text-white/75 text-sm mt-1">Monitor status, confirm completion, or request re-work.</p>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🧑‍🔧" title="No bookings yet" hint="Hire a skilled worker to track their job status here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-800">{b.service?.name}</h3>
<span className={`chip border ${STATUS_STYLES[b.status] || 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                        {(b.status || 'unknown').replace('_', ' ')}
                      </span>
                  </div>
                  <p className="text-sm text-ink-500 mt-1">Provider: {b.provider?.name || 'Awaiting assignment'}</p>
                  <p className="text-xs text-ink-400 mt-0.5">📍 {b.address}</p>
                  {b.status === 'rework' && b.rework_reason && (
                    <p className="text-xs text-orange-600 mt-1">🔧 Re-work reason: {b.rework_reason}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-ink-900">₱{Number(b.quoted_amount).toLocaleString()}</p>
                  <p className="text-[10px] text-ink-400">Booked {new Date(b.booking_date || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Status timeline */}
              <div className="mt-3 flex items-center gap-2 text-[11px] font-bold">
                {[
                  { key: 'pending', label: 'Pending' },
                  { key: 'accepted', label: 'Accepted' },
                  { key: 'provider_completed', label: 'Done' },
                  { key: 'completed', label: 'Confirmed' },
                ].map((step, i) => {
                  const done = statusIndex(b.status) >= i;
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                        {done ? '✓' : '·'}
                      </span>
                      <span className={done ? 'text-ink-700' : 'text-ink-400'}>{step.label}</span>
                      {i < 3 && <span className="w-5 h-0.5 bg-ink-200" />}
                    </div>
                  );
                })}
                {b.status === 'rework' && (
                  <span className="ml-1 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    Re-work
                  </span>
                )}
              </div>

              {/* Actions — provider_completed awaiting customer decision */}
              {b.status === 'provider_completed' && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirm(b.id)}
                      disabled={busy === `confirm-${b.id}`}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl"
                    >
                      ✅ Confirm completed
                    </button>
                    <button
                      onClick={() => rework(b.id)}
                      disabled={busy === `rework-${b.id}`}
                      className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl"
                    >
                      🔧 Request re-work
                    </button>
                  </div>
                  <input
                    value={reworkReason[b.id] || ''}
                    onChange={(e) => setReworkReason((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    placeholder="Reason for re-work (optional)"
                    className="field"
                  />
                </div>
              )}
              {b.status === 'rework' && (
                <div className="mt-3 py-2.5 bg-orange-50 text-orange-700 text-sm font-bold rounded-xl text-center">
                  🔧 Awaiting provider to fix and resubmit
                </div>
              )}
              {b.status === 'completed' && (
                <div className="mt-3 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl text-center">
                  ✅ Completed & payout released
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusIndex(s) {
  if (s === 'completed' || s === 'cancelled') return 3;
  if (s === 'provider_completed') return 2;
  if (s === 'accepted') return 1;
  if (s === 'rework') return 1;
  return 0;
}