import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState } from '../../components/ui.jsx';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function CustomerBookings({ user }) {
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

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Provider Bookings</h2>
        <p className="text-white/75 text-sm mt-1">Monitor the status of your hired skilled workers.</p>
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
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-500 mt-1">Provider: {b.provider?.name || 'Awaiting assignment'}</p>
                  <p className="text-xs text-ink-400 mt-0.5">📍 {b.address}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-ink-900">₱{Number(b.quoted_amount).toLocaleString()}</p>
                  <p className="text-[10px] text-ink-400">Booked {new Date(b.booking_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Status timeline */}
              <div className="mt-3 flex items-center gap-2 text-[11px] font-bold">
                {[
                  { key: 'pending', label: 'Pending' },
                  { key: 'accepted', label: 'Accepted' },
                  { key: 'completed', label: 'Completed' },
                ].map((step, i) => {
                  const done = statusIndex(b.status) >= i;
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                        {done ? '✓' : '·'}
                      </span>
                      <span className={done ? 'text-ink-700' : 'text-ink-400'}>{step.label}</span>
                      {i < 2 && <span className="w-6 h-0.5 bg-ink-200" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusIndex(s) {
  if (s === 'completed' || s === 'cancelled') return 2;
  if (s === 'accepted') return 1;
  return 0;
}