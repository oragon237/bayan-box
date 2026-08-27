import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  provider_completed: 'bg-blue-50 text-blue-700 border-blue-200',
  rework: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

export default function ProviderJobs({ user }) {
  const notify = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const accept = async (id) => {
    try {
      await client.post(`/bookings/${id}/accept`);
      notify('Job accepted!');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not accept.', 'error');
    }
  };

  const complete = async (id) => {
    try {
      const res = await client.post(`/bookings/${id}/complete`);
      notify(res.data?.message || 'Marked as done. Awaiting customer confirmation.');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not mark as done.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">My Jobs</h2>
          <p className="text-white/75 text-sm mt-1">Accept and complete service bookings from customers.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : bookings.length === 0 ? (
        <EmptyState icon="🧑‍🔧" title="No jobs yet" hint="New bookings from customers will appear here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-800">{b.service?.name}</h3>
                    <span className={`chip border ${STATUS_STYLES[b.status] || 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-500 mt-1">Customer: {b.customer?.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">📱 {b.customer?.phone} · 📍 {b.address}</p>
                  <p className="text-xs text-ink-400">
                    📅 {new Date(b.booking_date).toLocaleDateString()} · ₱{Number(b.quoted_amount).toLocaleString()} quoted
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-ink-900">₱{Number(b.provider_payout).toLocaleString()}</p>
                  <p className="text-[10px] text-ink-400">Your payout</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {b.status === 'pending' && (
                  <button
                    onClick={() => accept(b.id)}
                    className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl"
                  >
                    ✅ Accept job
                  </button>
                )}
                {b.status === 'accepted' && (
                  <button
                    onClick={() => complete(b.id)}
                    className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl"
                  >
                    ✅ Mark as done
                  </button>
                )}
                {b.status === 'rework' && (
                  <button
                    onClick={() => complete(b.id)}
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl"
                  >
                    🔧 Re-work done — resubmit
                  </button>
                )}
                {b.status === 'provider_completed' && (
                  <span className="flex-1 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl text-center">
                    ⏳ Awaiting customer confirmation
                  </span>
                )}
                {b.status === 'completed' && (
                  <span className="flex-1 py-2.5 bg-ink-50 text-ink-500 text-sm font-bold rounded-xl text-center">
                    Payout sent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}