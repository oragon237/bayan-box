import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { startTelemetry } from '../../services/telemetry.js';
import { useToast, Badge, EmptyState, Skeleton, Spinner } from '../../components/ui.jsx';
import { RouteIcon, CheckIcon, MapPinIcon } from '../../components/icons.jsx';

/**
 * Rider PWA — batch route list with GPS telemetry (50m) + COD tracking
 * (PRD 2.3, FR-MAP-002).
 */
export default function RiderBatches({ user }) {
  const notify = useToast();
  const [batches, setBatches] = useState(null);
  const [lastFix, setLastFix] = useState(null);
  const [delivering, setDelivering] = useState(null);

  // Start 50m telemetry watcher (FR-MAP-002)
  useEffect(() => {
    if (!user) return;
    const stop = startTelemetry(user.id, (batch) => setLastFix(batch[batch.length - 1]));
    return stop;
  }, [user]);

  const fetchBatches = async () => {
    setBatches(null);
    try {
      const { data } = await client.get('/rider/batches');
      setBatches(data.data);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const markDelivered = async (batchCode, parcelId) => {
    setDelivering(parcelId);
    try {
      await client.post(`/rider/batches/${batchCode}/parcels/${parcelId}/deliver`, {
        latitude: lastFix?.latitude ?? null,
        longitude: lastFix?.longitude ?? null,
      });
      notify('Parcel marked delivered.');
      fetchBatches();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to mark delivered.', 'error');
    } finally {
      setDelivering(null);
    }
  };

  const progress = (batch) => {
    const done = batch.batch_parcels.filter((p) => ['delivered', 'returned'].includes(p.dropoff_status)).length;
    return batch.batch_parcels.length ? Math.round((done / batch.batch_parcels.length) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">My Route</h2>
        <p className="text-sm text-ink-400">Barangay-clustered batch deliveries.</p>
      </div>

      {/* GPS status pill */}
      <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm ${lastFix ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white border border-ink-200 text-ink-500'}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${lastFix ? 'bg-green-500 animate-pulse-soft' : 'bg-ink-300'}`} />
        {lastFix ? (
          <span>
            GPS live · <b>{lastFix.latitude.toFixed(5)}, {lastFix.longitude.toFixed(5)}</b>
          </span>
        ) : (
          <span>Move 50m to start pushing GPS telemetry</span>
        )}
        <MapPinIcon className="w-4 h-4 ml-auto opacity-50" />
      </div>

      {/* Batches */}
      {batches === null ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : batches.length === 0 ? (
        <EmptyState icon="🛵" title="No assigned batches" hint="New routes from your hub will appear here." />
      ) : (
        batches.map((batch) => {
          const pct = progress(batch);
          return (
            <div key={batch.id} className="card p-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-bayan-50 text-bayan-600 flex items-center justify-center">
                    <RouteIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-black tracking-tight">{batch.batch_code}</div>
                    <div className="text-xs text-ink-400">{batch.hub?.name} · {batch.barangay || '—'}</div>
                  </div>
                </div>
                <Badge status={batch.status} />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-bold text-ink-400 mb-1">
                  <span>Route progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-bayan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-3 divide-y divide-ink-100">
                {batch.batch_parcels.map((bp) => {
                  const done = ['delivered', 'returned'].includes(bp.dropoff_status);
                  return (
                    <div key={bp.id} className="py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{bp.parcel.tracking_number}</div>
                        <div className="text-xs text-ink-400 truncate">{bp.parcel.recipient_name} · {bp.parcel.recipient_phone}</div>
                        {bp.parcel.cod_amount > 0 && (
                          <div className="text-[11px] font-bold text-amber-600 mt-0.5">COD ₱{bp.parcel.cod_amount}</div>
                        )}
                      </div>
                      {done ? (
                        <span className="chip bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                          <CheckIcon className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => markDelivered(batch.batch_code, bp.parcel.id)}
                          disabled={delivering === bp.parcel.id}
                          className="px-3.5 py-2 rounded-xl bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {delivering === bp.parcel.id ? <Spinner size="sm" className="!text-white" /> : <CheckIcon className="w-3.5 h-3.5" />}
                          Delivered
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
