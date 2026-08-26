import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../../api/client.js';
import { enqueueAction, queueCount } from '../../services/offlineQueue.js';
import { useToast, Spinner } from '../../components/ui.jsx';
import { ScanIcon, CheckIcon } from '../../components/icons.jsx';

/**
 * Staff Hub PWA — inbound intake barcode scanner with offline IndexedDB queue
 * (PRD 2.2, FR-OFF-001/002).
 */
export default function HubScanner({ user }) {
  const scannerRef = useRef(null);
  const notify = useToast();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [form, setForm] = useState({
    tracking_number: '',
    recipient_name: '',
    recipient_phone: '',
    shipper_name: '',
    cod_amount: '',
  });

  const refreshPending = async () => setPendingCount(await queueCount());

  useEffect(() => {
    refreshPending();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('barcode-reader');
    }
    setScanning(true);
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 140 } },
        (decoded) => {
          setForm((f) => ({ ...f, tracking_number: decoded }));
          setLastScan(decoded);
          scannerRef.current?.stop().catch(() => {});
          setScanning(false);
        },
        () => {},
      );
    } catch {
      notify('Camera unavailable — use manual entry.', 'error');
      setScanning(false);
    }
  };

  const submitIntake = async (e) => {
    e.preventDefault();
    if (!form.tracking_number || !form.recipient_name || !form.recipient_phone) {
      return notify('Tracking number, name and phone are required.', 'error');
    }

    const payload = {
      tracking_number: form.tracking_number.trim(),
      recipient_name: form.recipient_name.trim(),
      recipient_phone: form.recipient_phone.trim(),
      shipper_name: form.shipper_name.trim() || null,
      cod_amount: form.cod_amount ? Number(form.cod_amount) : 0,
      hub_id: user?.hub?.id ?? null,
    };

    setSubmitting(true);
    try {
      if (!navigator.onLine) {
        await enqueueAction({ type: 'scan_intake', payload });
        await refreshPending();
        notify('Offline — scan queued, will sync automatically.');
      } else {
        await client.post('/hub/intake', payload);
        notify(`Intake registered: ${payload.tracking_number}`);
      }
    } catch (err) {
      if (!navigator.onLine) {
        await enqueueAction({ type: 'scan_intake', payload });
        await refreshPending();
        notify('Offline — scan queued, will sync automatically.');
      } else {
        const msg =
          err.response?.data?.errors?.tracking_number?.[0] ||
          err.response?.data?.message ||
          'Sync failed.';
        notify(msg, 'error');
      }
    } finally {
      setSubmitting(false);
      setForm({ tracking_number: '', recipient_name: '', recipient_phone: '', shipper_name: '', cod_amount: '' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-black tracking-tight">Parcel Intake</h2>
        <p className="text-sm text-ink-400">Scan the carrier barcode to register an inbound parcel.</p>
      </div>

      {/* Offline queue banner */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-soft" />
            <span className="text-sm font-bold">{pendingCount} scan(s) queued offline</span>
          </div>
          <span className="text-[11px] font-semibold">Auto-sync on</span>
        </div>
      )}

      {/* Scanner card */}
      <div className="card overflow-hidden">
        <div className="relative bg-ink-900" id="barcode-reader" style={{ minHeight: 220 }}>
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3">
              <ScanIcon className="w-10 h-10" />
              <span className="text-sm font-semibold">Scanner ready</span>
            </div>
          )}
        </div>

        <div className="p-4 flex items-center gap-3">
          <button type="button" onClick={scanning ? stopScanner : startScanner} className={scanning ? 'btn-secondary flex-1' : 'btn-primary flex-1'}>
            {scanning ? 'Stop Scanner' : 'Start Camera Scanner'}
          </button>
          {lastScan && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-bayan-700 bg-bayan-50 rounded-xl px-3 py-2">
              <CheckIcon className="w-4 h-4" /> {lastScan}
            </div>
          )}
        </div>
      </div>

      {/* Intake form */}
      <form onSubmit={submitIntake} className="card p-4 space-y-3 animate-fade-up">
        <h3 className="font-bold text-ink-700">Inbound Parcel Details</h3>

        <input
          className="input"
          placeholder="Tracking / barcode number"
          value={form.tracking_number}
          onChange={(e) => setForm({ ...form, tracking_number: e.target.value.toUpperCase() })}
        />

        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Recipient name" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
          <input className="input" placeholder="Recipient phone" inputMode="tel" value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Shipper (optional)" value={form.shipper_name} onChange={(e) => setForm({ ...form, shipper_name: e.target.value })} />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-400">₱</span>
            <input
              className="input pl-8"
              placeholder="COD amount"
              inputMode="decimal"
              value={form.cod_amount}
              onChange={(e) => setForm({ ...form, cod_amount: e.target.value.replace(/[^\d.]/g, '') })}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={submitting}>
          {submitting ? <Spinner size="sm" className="!text-white" /> : <ScanIcon className="w-4 h-4" />}
          Register Intake
        </button>
      </form>
    </div>
  );
}
