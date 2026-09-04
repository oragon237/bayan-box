import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client.js';
import { useToast } from '../../components/ui.jsx';

/**
 * Customer profile — edit personal info + set a fixed home location
 * (latitude / longitude) used for delivery routing and tracking.
 */
export default function CustomerProfile({ user }) {
  const notify = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    barangay: '',
    municipality: '',
    latitude: '',
    longitude: '',
  });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await client.get('/profile');
      const p = res.data.user;
      setProfile(p);
      setForm({
        name: p.name || '',
        email: p.email || '',
        barangay: p.barangay || '',
        municipality: p.municipality || '',
        latitude: p.latitude ?? '',
        longitude: p.longitude ?? '',
      });
    } catch {
      notify('Could not load profile.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const useMyLocation = () => {
    if (!navigator.geolocation) { notify('Geolocation not supported.', 'error'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitude: Number(pos.coords.latitude.toFixed(7)),
          longitude: Number(pos.coords.longitude.toFixed(7)),
        });
        notify('Location detected.');
        setLocating(false);
      },
      () => { notify('Location access denied. Enter coordinates manually.', 'error'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const save = async () => {
    const lat = form.latitude === '' ? null : Number(form.latitude);
    const lng = form.longitude === '' ? null : Number(form.longitude);
    setSaving(true);
    try {
      await client.put('/profile', {
        name: form.name,
        email: form.email,
        barangay: form.barangay,
        municipality: form.municipality,
        latitude: lat,
        longitude: lng,
      });
      notify('Profile updated.');
      load();
    } catch (err) {
      notify(err.response?.data?.message || err.response?.data?.error || 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ink-400 animate-pulse-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Profile</h2>
        <p className="text-white/75 text-sm mt-1">
          Manage your information and set your fixed home location for deliveries.
        </p>
      </div>

      <div className="card p-4 space-y-4">
        {/* Personal info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Full name</label>
            <input value={form.name} onChange={set('name')} placeholder="Your full name" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Email address</label>
            <input value={form.email} onChange={set('email')} type="email" placeholder="your@email.com" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Barangay</label>
            <input value={form.barangay} onChange={set('barangay')} placeholder="e.g., San Jose" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Municipality</label>
            <input value={form.municipality} onChange={set('municipality')} placeholder="e.g., Naga City" className="field" />
          </div>
        </div>

        {/* Fixed location */}
        <div className="rounded-2xl bg-ink-50 border border-ink-100 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-ink-700">📍 Fixed location</p>
              <p className="text-[11px] text-ink-400">Used for delivery routing. Auto-set with GPS or enter coordinates.</p>
            </div>
            <button onClick={useMyLocation} disabled={locating} type="button" className="px-3 py-1.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-[11px] font-bold rounded-lg">
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Latitude</label>
              <input value={form.latitude} onChange={set('latitude')} placeholder="e.g., 13.6218" className="field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Longitude</label>
              <input value={form.longitude} onChange={set('longitude')} placeholder="e.g., 123.1948" className="field" />
            </div>
          </div>
          {(form.latitude === '' ) !== (form.longitude === '') && (
            <p className="text-[11px] text-amber-600 font-semibold">Latitude and longitude must be entered together.</p>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* Affiliate & rewards links */}
      <div className="space-y-2">
        <h3 className="font-extrabold text-ink-800 px-1">KITA — Earnings</h3>
        <Link
          to="/affiliate"
          className="block rounded-2xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-4 shadow-lift hover:from-bayan-800 hover:to-bayan-600 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Share · Earn · Cash out</p>
              <p className="text-base font-black tracking-tight mt-0.5">💸 Affiliate Program</p>
              <p className="text-[11px] text-white/80 mt-1">Refer friends and earn commission from their orders. Check balance, history, and cash out here.</p>
            </div>
            <span className="shrink-0 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-lg">→</span>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/referral" className="card p-3 text-center hover:bg-bayan-50 transition">
            <p className="text-lg">🪪</p>
            <p className="text-xs font-bold text-ink-700">My Referral QR</p>
            <p className="text-[10px] text-ink-400">Poster your code</p>
          </Link>
          <Link to="/points-shop" className="card p-3 text-center hover:bg-bayan-50 transition">
            <p className="text-lg">⭐</p>
            <p className="text-xs font-bold text-ink-700">Suki Points</p>
            <p className="text-[10px] text-ink-400">Redeem rewards</p>
          </Link>
        </div>
      </div>
    </div>
  );
}