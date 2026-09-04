import { useState } from 'react';
import client from '../api/client.js';
import { useToast } from './ui.jsx';

/**
 * Customer-cancel button — the state machine only allows cancelling while the
 * order is still awaiting merchant acceptance (pending_merchant).
 * First click opens an inline confirm row with an optional reason.
 */
export default function CancelOrderButton({ orderId, onDone }) {
  const notify = useToast();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] font-bold text-red-500 hover:underline"
      >
        ✕ Cancel order
      </button>
    );
  }

  const doCancel = async () => {
    setBusy(true);
    try {
      const res = await client.post(`/orders/${orderId}/state/cancel`, { reason: reason.trim() || null });
      notify(res.data.message || 'Order cancelled.');
      setConfirming(false);
      setReason('');
      if (onDone) onDone();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not cancel the order.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doCancel(); } }}
        placeholder="Bakit i-cancel? (optional)"
        className="field flex-1 bg-white text-xs"
      />
      <button
        type="button"
        onClick={doCancel}
        disabled={busy}
        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shrink-0"
      >
        {busy ? '…' : 'I-cancel'}
      </button>
      <button
        type="button"
        onClick={() => { setConfirming(false); setReason(''); }}
        className="px-2.5 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-600 text-[11px] font-bold rounded-lg shrink-0"
      >
        Keep
      </button>
    </div>
  );
}
