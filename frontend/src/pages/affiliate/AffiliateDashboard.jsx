import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { useToast } from '../../components/ui.jsx';

export default function AffiliateDashboard({ user }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [cashOuts, setCashOuts] = useState([]);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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

            {/* Affiliate status */}
            <div className={`mt-3 rounded-xl p-3 flex items-center justify-between ${data.affiliate_status === 'active' ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div>
                <p className="text-xs font-bold ${data.affiliate_status === 'active' ? 'text-green-700' : 'text-amber-700'}">
                  {data.affiliate_status === 'active' ? '✅ Affiliate activated' : '⏳ Pending admin approval'}
                </p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  {data.affiliate_status === 'active' ? 'You can withdraw your earnings.' : 'Submit your ID below to be activated.'}
                </p>
              </div>
            </div>
          </div>

          {/* Income sources */}
          <div className="card p-4">
            <h3 className="font-extrabold text-ink-800 mb-2">Where your income comes from</h3>
            {data.income_sources && Object.keys(data.income_sources).length === 0 ? (
              <p className="text-sm text-ink-400">No earnings yet. Share your referral link to start earning.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.income_sources || {}).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-ink-600 capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-black text-ink-900">₱{Number(amount).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="font-bold text-ink-700">Total earned</span>
                  <span className="font-black text-ink-900">₱{Number(data.balance).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Document upload */}
          <div className="card p-4 space-y-3">
            <h3 className="font-extrabold text-ink-800">Affiliate requirements (ID)</h3>
            <p className="text-xs text-ink-400">
              Upload your government ID. Admin must approve before you can withdraw earnings.
            </p>
            <div className="flex gap-2">
              <input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="Paste image URL, or use upload below"
                className="field flex-1"
              />
            </div>
            <ImageUploader value={docUrl} onChange={setDocUrl} folder="affiliate" label="Upload ID image" />
            <button
              onClick={async () => {
                if (!docUrl.trim()) {
                  notify('Upload or paste your ID image first.', 'error');
                  return;
                }
                setUploading(true);
                try {
                  const res = await client.post('/affiliate/upload-document', { id_url: docUrl.trim(), document_type: 'government_id' });
                  notify(res.data.message);
                  setDocUrl('');
                  load();
                } catch (err) {
                  notify(err.response?.data?.message || 'Upload failed.', 'error');
                } finally {
                  setUploading(false);
                }
              }}
              disabled={uploading}
              className="w-full py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl"
            >
              {uploading ? 'Submitting…' : 'Submit requirement'}
            </button>
            {data.affiliate_documents?.length > 0 && (
              <p className="text-[11px] text-green-600">✓ {data.affiliate_documents.length} document(s) submitted for review.</p>
            )}
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