import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function AdminMerchants({ user }) {
  const notify = useToast();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/merchants/pending', { params: { per_page: 50 } });
      setMerchants(res.data.data);
    } catch {
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (m) => {
    try {
      await client.post(`/admin/merchants/${m.id}/approve`);
      notify(`Approved ${m.name} — SMS sent.`);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Approval failed.', 'error');
    }
  };

  const reject = async (m) => {
    if (!reason.trim()) {
      notify('A rejection reason is required.', 'error');
      return;
    }
    try {
      await client.post(`/admin/merchants/${m.id}/reject`, { reason: reason.trim() });
      notify(`Rejected ${m.name}.`);
      setReason('');
      setRejecting(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Rejection failed.', 'error');
    }
  };

  const parseNotes = (notes) => {
    try {
      return JSON.parse(notes || '{}');
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Merchant Verification</h2>
        <p className="text-white/75 text-sm mt-1">Approve new merchant applicants to unlock product uploads.</p>
      </div>

      {rejecting && (
        <div className="card p-4 border-ink-200">
          <h3 className="font-bold text-ink-800 mb-2">Reject {rejecting.name}</h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason (e.g., invalid DTI registration)"
            className="field"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => reject(rejecting)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl">
              Confirm rejection
            </button>
            <button
              onClick={() => {
                setRejecting(null);
                setReason('');
              }}
              className="px-4 py-2 bg-ink-100 text-ink-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{/* skeleton */}</div>
      ) : merchants.length === 0 ? (
        <EmptyState icon="✅" title="Queue is clear" hint="No merchants are waiting for verification." />
      ) : (
        <div className="space-y-3">
          {merchants.map((m) => {
            const notes = parseNotes(m.verification_notes);
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink-800">{m.name}</h3>
                    <p className="text-xs text-ink-400">📱 {m.phone}</p>
                    <p className="text-xs text-ink-400">{m.municipality || '—'}</p>
                  </div>
                  <span className="chip border bg-amber-50 text-amber-700 border-amber-200 shrink-0">Pending</span>
                </div>

                <div className="mt-3 bg-ink-50 rounded-xl p-3 text-xs space-y-1">
                  <p className="text-ink-500">
                    <span className="font-bold text-ink-700">DTI/SEC:</span> {notes.dti_sec_number || '—'}
                  </p>
                  <p className="text-ink-500">
                    <span className="font-bold text-ink-700">Gov ID:</span>{' '}
                    {notes.government_id_url ? (
                      <a href={notes.government_id_url} target="_blank" rel="noreferrer" className="text-bayan-700 underline">
                        View upload
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="text-ink-400">Submitted {new Date(m.created_at).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(m)} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">
                    ✅ Approve & SMS
                  </button>
                  <button onClick={() => setRejecting(m)} className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">
                    ✕ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}