import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToast, Spinner } from '../../components/ui.jsx';
import { ShareIcon } from '../../components/icons.jsx';

/**
 * Affiliate — sari-sari store referral QR poster (FR-AFF-001).
 * Renders the hub's unique referral QR and downloads the printable PDF poster.
 */
export default function ReferralQR({ user }) {
  const notify = useToast();
  const [referral, setReferral] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client
      .get('/hub/affiliate/referral-qr')
      .then(async (res) => {
        setReferral(res.data);
        const img = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(res.data.qr_payload)}`;
        const blob = await (await fetch(img)).blob();
        const reader = new FileReader();
        reader.onload = () => setQrDataUrl(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => setReferral(null));
  }, []);

  const downloadPoster = async () => {
    setBusy(true);
    try {
      const res = await client.get('/hub/affiliate/referral-qr/poster', { responseType: 'blob' });
      const blob = await res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bayan-referral-${referral?.hub?.referral_code || 'poster'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Poster downloaded — print & display it!');
    } catch {
      notify('Could not generate poster.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!referral) {
    return <div className="text-center text-ink-400 py-12">No hub bound to your account.</div>;
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div>
        <h2 className="text-xl font-black tracking-tight">Store Referral</h2>
        <p className="text-sm text-ink-400">Turn your store into a community parcel hub.</p>
      </div>

      {/* Poster preview */}
      <div className="card p-5 text-center animate-fade-up">
        <div className="text-sm font-bold text-bayan-700">{referral.hub.name}</div>
        <div className="text-xs text-ink-400 mt-0.5">{referral.hub.address}</div>

        <div className="mx-auto my-4 w-44 h-44 rounded-2xl border-4 border-bayan-100 bg-white flex items-center justify-center overflow-hidden">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Referral QR" className="w-full h-full" />
          ) : (
            <Spinner />
          )}
        </div>

        <div className="text-[11px] font-mono text-ink-400 bg-ink-50 rounded-xl px-3 py-2 mb-4 break-all">
          {referral.qr_payload}
        </div>

        <div className="bg-bayan-50 rounded-2xl px-4 py-3 text-sm font-bold text-bayan-700 mb-4">
          Earn ₱2.00 on every parcel this QR brings in — permanently.
        </div>

        <button onClick={downloadPoster} className="btn-primary flex items-center justify-center gap-2" disabled={busy || !qrDataUrl}>
          {busy ? <Spinner size="sm" className="!text-white" /> : <ShareIcon className="w-4 h-4" />}
          Download Printable Poster (PDF)
        </button>
      </div>

      <div className="card p-4 text-sm text-ink-500 leading-relaxed">
        <b className="text-ink-700">How it works:</b> Print the poster and display it at
        your store. New customers scan the QR when registering, linking their account
        to your hub. You receive a permanent <b className="text-bayan-700">₱2.00</b> micro-commission
        on every parcel they process through your hub.
      </div>
    </div>
  );
}
