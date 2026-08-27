import { useState } from 'react';
import client from '../api/client.js';
import { useToast, Spinner } from '../components/ui.jsx';

const ROLES = [
  { value: 'customer', label: 'Shopper', emoji: null, desc: 'Track parcels & earn Suki points' },
  { value: 'merchant', label: 'Merchant', emoji: null, desc: 'Sell & consolidate returns' },
  { value: 'rider', label: 'Rider', emoji: null, desc: 'Deliver & manage COD' },
  { value: 'provider', label: 'Skilled Worker', emoji: null, desc: 'Take service jobs' },
];

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState({
    name: '', phone: '', password: '', referral_code: '',
  });
  const [busy, setBusy] = useState(false);
  const notify = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload =
        mode === 'login'
          ? { phone: form.phone, password: form.password }
          : { name: form.name, phone: form.phone, password: form.password, role, referral_code: form.referral_code || undefined };

      const { data } = await client.post(`/auth/${mode}`, payload);
      localStorage.setItem('bayanbox_token', data.token);
      localStorage.setItem('bayanbox_user', JSON.stringify(data.user));
      notify(mode === 'login' ? `Welcome back, ${data.user.name.split(' ')[0]}!` : 'Account created!');
      onAuth(data.user);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Something went wrong.';
      notify(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bayan-800 via-bayan-700 to-bayan-500 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/15 backdrop-blur-md rounded-3xl px-6 py-3 shadow-lift">
            <img
              src="/beboolbox-logo.png"
              alt="BayanBox"
              className="h-14 w-auto object-contain"
            />
          </div>
          <p className="text-white/70 text-sm mt-3">BodegaBarangay · Provincial Last-Mile OS</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lift p-6 animate-fade-up">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-ink-100 rounded-2xl p-1 mb-5">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 rounded-xl text-sm font-bold capitalize transition ${
                  mode === m ? 'bg-white shadow text-bayan-700' : 'text-ink-500'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'register' && (
              <input className="input" placeholder="Full name" value={form.name} onChange={set('name')} required />
            )}

            <input
              className="input"
              placeholder="Mobile number (0917…)"
              inputMode="tel"
              value={form.phone}
              onChange={set('phone')}
              required
            />

            <input
              className="input"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
            />

            {mode === 'register' && (
              <>
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        role === r.value
                          ? 'border-bayan-600 bg-bayan-50 ring-2 ring-bayan-500/30'
                          : 'border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      <span className={`block text-sm font-bold ${role === r.value ? 'text-bayan-700' : 'text-ink-700'}`}>
                        {r.label}
                      </span>
                      <span className="block text-[11px] text-ink-400 mt-0.5 leading-tight">{r.desc}</span>
                    </button>
                  ))}
                </div>

                <input
                  className="input"
                  placeholder="Referral code (optional — scan a store poster)"
                  value={form.referral_code}
                  onChange={set('referral_code')}
                />
              </>
            )}

            <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={busy}>
              {busy && <Spinner size="sm" className="!text-white" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-white/60 text-xs mt-6 text-center max-w-xs">
          Works offline. Trusted sari-sari stores power deliveries across the province.
        </p>

        <button
          onClick={async () => {
            const { enterDemoMode } = await import('../api/mock.js');
            enterDemoMode();
            const user = JSON.parse(localStorage.getItem('bayanbox_user'));
            onAuth(user);
          }}
          className="mt-4 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur hover:bg-white/20 text-white font-bold text-sm transition border border-white/20"
        >
          Explore UI Demo (no backend required)
        </button>
      </div>
    </div>
  );
}
