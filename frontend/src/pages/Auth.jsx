import { useState } from 'react';
import client from '../api/client.js';
import { useToast, Spinner } from '../components/ui.jsx';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [form, setForm] = useState(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    return { name: '', phone: '', password: '', password2: '', code: '', referral_code: ref || '' };
  });
  const [busy, setBusy] = useState(false);
  const [resetHint, setResetHint] = useState('');
  const notify = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { data } = await client.post('/auth/forgot-password', { phone: form.phone });
        setResetHint(data.message);
        setMode('reset');
        return;
      }
      if (mode === 'reset') {
        const { data } = await client.post('/auth/reset-password', {
          phone: form.phone,
          code: form.code,
          password: form.password,
          password_confirmation: form.password2,
        });
        notify(data.message);
        setForm((f) => ({ ...f, password: '', password2: '', code: '' }));
        setResetHint('');
        setMode('login');
        return;
      }

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
    <div className="relative w-screen -ml-[calc(50vw-50%)] bg-gradient-to-br from-bayan-800 via-bayan-700 to-bayan-500 -mt-4 -mb-28 min-h-[calc(100vh-152px)]">
      <div className="flex flex-col items-center justify-center px-5 py-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/95 px-4 py-2.5 shadow-lift">
            <img
            src={`${import.meta.env.BASE_URL}habi-logo-concept.png`}
            alt="HABI"
            className="h-11 w-[150px] object-contain"
          />
          </div>
          <p className={`text-white/75 text-sm mt-3 ${mode === 'register' ? 'hidden' : ''}`}>HABI · Local commerce, delivery &amp; services</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lift p-5 animate-fade-up max-h-[calc(100vh-150px)] overflow-y-auto no-scrollbar">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-ink-100 rounded-2xl p-1 mb-4">
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

          {mode === 'reset' && resetHint && (
            <p className="text-[11px] leading-snug text-bayan-700 bg-bayan-50 border border-bayan-200 rounded-xl p-2.5 mb-3">{resetHint}</p>
          )}

          <form onSubmit={submit} className={mode === 'register' ? 'space-y-2.5' : 'space-y-3.5'}>
            {mode === 'register' && (
              <input className="input py-2 text-sm" placeholder="Full name" value={form.name} onChange={set('name')} required />
            )}

            <input
              className="input py-2 text-sm"
              placeholder="Mobile number (0917…)"
              inputMode="tel"
              value={form.phone}
              onChange={set('phone')}
              required
            />

            {mode === 'reset' && (
              <input
                className="input py-2 text-sm tracking-widest"
                placeholder="6-digit code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={form.code}
                onChange={set('code')}
                required
              />
            )}

            {mode !== 'forgot' && (
              <input
                className="input py-2 text-sm"
                placeholder={mode === 'reset' ? 'New password' : 'Password'}
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
            )}

            {mode === 'reset' && (
              <input
                className="input py-2 text-sm"
                placeholder="Confirm new password"
                type="password"
                value={form.password2}
                onChange={set('password2')}
                required
                minLength={6}
              />
            )}

            {mode === 'register' && (
              <>
                {/* Role selector — compact toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border ${
                      role === 'customer' ? 'border-bayan-600 bg-bayan-50 text-bayan-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    🛍️ Shopper
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border ${
                      role === 'merchant' ? 'border-bayan-600 bg-bayan-50 text-bayan-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    🏪 Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('rider')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border ${
                      role === 'rider' ? 'border-bayan-600 bg-bayan-50 text-bayan-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    🛵 Rider
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border ${
                      role === 'provider' ? 'border-bayan-600 bg-bayan-50 text-bayan-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    🧑‍🔧 Worker
                  </button>
                </div>

                <input
                  className="input py-2 text-sm"
                  placeholder="Referral code (optional — scan a store poster)"
                  value={form.referral_code}
                  onChange={set('referral_code')}
                />
              </>
            )}

            <button type="submit" className="btn-primary flex items-center justify-center gap-2 !py-2.5 !text-sm" disabled={busy}>
              {busy && <Spinner size="sm" className="!text-white" />}
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Send verification code' : 'Set new password'}
            </button>

            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="w-full text-center text-xs font-bold text-bayan-700 hover:underline">
                Forgot password?
              </button>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button type="button" onClick={() => { setMode('login'); setResetHint(''); }} className="w-full text-center text-xs font-bold text-ink-500 hover:underline">
                ← Back to Sign In
              </button>
            )}
          </form>
        </div>

        <p className="text-white/60 text-xs mt-6 text-center max-w-xs">
          Works offline. Trusted sari-sari stores power deliveries across the province.
        </p>
      </div>
    </div>
  );
}
