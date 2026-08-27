import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToast } from '../../components/ui.jsx';

export default function AffiliateDashboard({ user }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [cashOuts, setCashOuts] = useState([]);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [eRes, cRes] = await Promise.all([
        client.get('/affiliate/earnings'),
        client.get('/affiliate/cash-outs', { params: { per_page: 20 } }),
      ]);
      setData(eRes.data);
      setCashOuts(cRes.data.data || []);
    } catch {
      notify('Could not load affiliate data.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const requestCashOut = async () => {
    if (!amount || Number(amount) < 1) {
      notify('Enter a valid amount.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/affiliate/cash-out', { amount: Number(amount) });
      notify('Cash-out requested. Admin will review.');
      setAmount('');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not request cash-out.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const referralUrl = data ? `${window.location.origin}/login?ref=${data.referral_code}` : '';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Affiliate</h2>
        <p className="text-white/75 text-sm mt-1">Earn commissions by referring others. Use your earnings to shop or cash out.</p>
      </div>

      {data && (
        <>
          {/* Earnings card */}
          <div className="card p-5">
            <p className="text-xs text-ink-400 font-semibold uppercase">Available earnings</p>
            <p className="text-3xl font-black text-ink-900 mt-1">₱{Number(data.balance).toLocaleString()}</p>
            <p className="text-xs text-ink-400 mt-1">
              Your referral code: <span className="font-bold text-bayan-700">{data.referral_code}</span>
            </p>
            <p className="text-xs text-ink-400 mt-0.5">Min cash-out: ₱{Number(data.min_cashout).toLocaleString()}</p>

            <div className="bg-ink-50 rounded-xl p-3 mt-3">
              <p className="text-[10px] font-bold text-ink-500 uppercase">Share your referral link</p>
              <p className="text-xs text-ink-700 mt-1 break-all select-all">{referralUrl}</p>
            </div>
          </div>

          {/* QR code */}
          <div className="card p-5 text-center space-y-3">
            <p className="text-xs font-bold text-ink-500 uppercase">Scan to register as my affiliate</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(referralUrl)}`}
              alt="Affiliate QR"
              className="w-56 h-56 mx-auto rounded-2xl border border-ink-100 bg-white"
            />
            <p className="text-xs text-ink-400">
              New users who register with your code earn you affiliate commissions on their purchases.
            </p>
          </div>

          {/* Cash-out form */}
          <div className="card p-4 space-y-3">
            <h3 className="font-extrabold text-ink-800">Request cash-out</h3>
            <div className="flex gap-2">
              <input
                type="number"
                min={data.min_cashout}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ₱${Number(data.min_cashout).toLocaleString()}`}
                className="field flex-1"
              />
              <button
                onClick={requestCashOut}
                disabled={submitting || Number(amount) < data.min_cashout}
                className="px-5 py-2 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl transition"
              >
                {submitting ? '…' : 'Request'}
              </button>
            </div>
            <p className="text-[11px] text-ink-400">Affiliate earnings can also be used to pay for marketplace purchases at checkout.</p>
          </div>

          {/* Cash-out history */}
          <div>
            <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Cash-out history</h3>
            {cashOuts.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-ink-400 text-sm">No cash-out requests yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cashOuts.map((co) => (
                  <div key={co.id} className="card p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-ink-800">₱{Number(co.amount).toLocaleString()}</span>
                      <span className={`chip border ml-2 ${co.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : co.status === 'declined' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {co.status}
                      </span>
                    </div>
                    <span className="text-xs text-ink-400">{new Date(co.requested_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}