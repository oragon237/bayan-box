import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToast, Badge, EmptyState, Spinner, Skeleton } from '../../components/ui.jsx';
import { PackageIcon, CheckIcon, CloseIcon } from '../../components/icons.jsx';

/**
 * Staff Hub PWA — inventory reconciliation + OTP-validated secure release
 * (PRD 2.2, FR-OFF-003).
 */
export default function HubInventory({ user }) {
  const notify = useToast();
  const [parcels, setParcels] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchInventory = async () => {
    setParcels(null);
    try {
      const { data } = await client.get('/hub/inventory', {
        params: { status: status || undefined, search: search || undefined },
      });
      setParcels(data.parcels.data);
    } catch {
      setParcels([]);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const reconcile = async (tracking) => {
    try {
      await client.post(`/hub/parcels/${tracking}/reconcile`);
      notify('Receipt confirmed — OTP SMS sent.');
      fetchInventory();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed.', 'error');
    }
  };

  const submitRelease = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post(`/hub/parcels/${releaseTarget.tracking_number}/release`, { otp_code: otp });
      notify(`Released ${releaseTarget.tracking_number}.`);
      setReleaseTarget(null);
      setOtp('');
      fetchInventory();
    } catch (err) {
      notify(err.response?.data?.message || 'Invalid OTP.', 'error');
      setOtp('');
    } finally {
      setBusy(false);
    }
  };

  const markReturned = async (tracking) => {
    try {
      await client.post(`/hub/parcels/${tracking}/return`);
      notify('Marked returned.');
      fetchInventory();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed.', 'error');
    }
  };

  const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'received_at_hub', label: 'Received' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'picked_up', label: 'Picked up' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'returned', label: 'Returned' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">Hub Inventory</h2>
        <p className="text-sm text-ink-400">Reconcile receipts and release parcels with OTP.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            className="input pl-9"
            placeholder="Search tracking or recipient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300">⌕</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`chip whitespace-nowrap ${
              status === f.value ? 'bg-bayan-600 text-white' : 'bg-white text-ink-500 border border-ink-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {parcels === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : parcels.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No parcels found"
          hint="Scan an inbound parcel or adjust your filters."
        />
      ) : (
        <div className="space-y-3">
          {parcels.map((p) => (
            <div key={p.id} className="card p-4 animate-fade-up">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-2xl bg-ink-100 text-ink-500 flex items-center justify-center shrink-0">
                  <PackageIcon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm tracking-tight">{p.tracking_number}</span>
                    <Badge status={p.status} />
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {p.recipient_name} · {p.recipient_phone}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-400">
                    {p.cod_amount > 0 && <span className="font-bold text-amber-600">COD ₱{p.cod_amount}</span>}
                    {p.delivery_distance_km > 0 && <span>{p.delivery_distance_km} km</span>}
                    {p.calculated_delivery_fee > 0 && <span className="font-semibold text-ink-600">₱{p.calculated_delivery_fee}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {p.status === 'received_at_hub' && (
                  <>
                    <button onClick={() => reconcile(p.tracking_number)} className="btn-ghost flex items-center gap-1">
                      <CheckIcon className="w-4 h-4" /> Confirm
                    </button>
                    <button
                      onClick={() => setReleaseTarget(p)}
                      className="flex-1 py-2 rounded-xl bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold transition"
                    >
                      Release (OTP)
                    </button>
                  </>
                )}
                {!['delivered', 'returned'].includes(p.status) && (
                  <button onClick={() => markReturned(p.tracking_number)} className="btn-ghost flex items-center gap-1 ml-auto">
                    <CloseIcon className="w-4 h-4" /> Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP release modal */}
      {releaseTarget && (
        <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-3xl shadow-lift w-full max-w-sm p-6 animate-fade-up">
            <h3 className="text-lg font-black tracking-tight">Secure Release</h3>
            <p className="text-sm text-ink-400 mt-1">
              Enter the customer's 6-digit OTP for
              <span className="font-bold text-ink-800 block mt-0.5">{releaseTarget.tracking_number}</span>
            </p>

            <input
              className="input text-center text-3xl font-black tracking-[0.45em] mt-4 h-16"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setReleaseTarget(null); setOtp(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={submitRelease}
                disabled={otp.length !== 6 || busy}
                className="flex-1 py-3 rounded-2xl bg-bayan-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Spinner size="sm" className="!text-white" />}
                Validate &amp; Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
