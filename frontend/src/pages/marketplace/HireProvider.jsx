import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

export default function HireProvider({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceId, setServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([client.get(`/providers/${id}`), client.get('/services')])
      .then(([pRes, sRes]) => {
        setProvider(pRes.data.provider);
        setServices(sRes.data);
      })
      .catch(() => notify('Could not load provider.', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const selected = services.find((s) => String(s.id) === String(serviceId));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      notify('Please log in to hire a provider.', 'info');
      navigate('/login');
      return;
    }
    if (!serviceId || !bookingDate || !address.trim()) {
      notify('Please select a service, date, and address.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post('/bookings', {
        service_id: Number(serviceId),
        provider_id: Number(id),
        booking_date: bookingDate,
        address: address.trim(),
      });
      notify(`Booking #${res.data.id} created! ${provider.name} will confirm.`);
      navigate('/');
    } catch (err) {
      notify(err.response?.data?.message || 'Could not create booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!provider) {
    return <p className="text-center text-ink-400 py-10">Provider not found.</p>;
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-ink-500 hover:text-ink-700 font-bold flex items-center gap-1">
        ← Back
      </button>

      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 overflow-hidden flex items-center justify-center text-3xl shrink-0">
            {provider.picture_url ? (
              <img src={provider.picture_url} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              '🧑‍🔧'
            )}
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {provider.name}
              {provider.is_official && (
                <span className="text-[10px] font-black bg-bayan-600 text-white px-2 py-0.5 rounded-full">✓ Official</span>
              )}
            </h2>
            <p className="text-sm text-white/70">⭐ {Number(provider.average_rating || 0).toFixed(1)} ({provider.review_count || 0} reviews)</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.skills?.map((s) => (
                <span key={s} className="text-[10px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="card p-5 space-y-4">
        <h3 className="font-extrabold text-ink-800">Book a service</h3>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Service</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="field bg-white">
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ₱{Number(s.base_pakyaw_rate).toLocaleString()}
              </option>
            ))}
          </select>
          {selected && (
            <p className="text-xs text-ink-400 mt-1">Quoted ₱{Number(selected.base_pakyaw_rate).toLocaleString()} (pakyaw rate)</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Preferred date & time</label>
          <input
            type="datetime-local"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="field"
            min={new Date(Date.now() + 60 * 60e3).toISOString().slice(0, 16)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="e.g., Block 12, San Jose, Naga City" className="field" />
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition">
          {submitting ? 'Booking…' : user ? `Hire ${provider.name.split(' ')[0]}` : 'Login to hire'}
        </button>
      </form>
    </div>
  );
}