import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../../api/client.js';
import MapView from '../../components/MapView.jsx';
import { useToast, Badge, Spinner, Skeleton } from '../../components/ui.jsx';
import { MapPinIcon } from '../../components/icons.jsx';

/**
 * Customer PWA — low-bandwidth Leaflet/OSM tracking with 3-marker overlay
 * (Origin Hub, Rider, Destination) + 1.30x ETA buffer (FR-MAP-001..004).
 */
export default function CustomerTracking() {
  const { tracking: paramTracking } = useParams();
  const notify = useToast();
  const [tracking, setTracking] = useState(paramTracking || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTracking = async (trackingNumber) => {
    if (!trackingNumber) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get(`/track/${trackingNumber}`);
      setData(data);
    } catch {
      setError('Parcel not found. Double-check the tracking number.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramTracking) fetchTracking(paramTracking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTracking]);

  const markers = [];
  if (data?.origin_hub?.latitude) markers.push({ lat: data.origin_hub.latitude, lng: data.origin_hub.longitude, type: 'hub', label: `Origin: ${data.origin_hub.name}` });
  if (data?.rider?.latitude) markers.push({ lat: data.rider.latitude, lng: data.rider.longitude, type: 'rider', label: data.rider.is_stale ? `Rider — ${data.rider.last_seen_label}` : 'Rider (live)' });
  if (data?.destination?.latitude) markers.push({ lat: data.destination.latitude, lng: data.destination.longitude, type: 'dest', label: 'Destination' });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">Track My Parcel</h2>
        <p className="text-sm text-ink-400">Follow your shipment in real time.</p>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); fetchTracking(tracking); }}
        className="flex gap-2 animate-fade-up"
      >
        <div className="flex-1 relative">
          <MapPinIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input pl-10 uppercase"
            placeholder="Enter tracking number"
            value={tracking}
            onChange={(e) => setTracking(e.target.value.toUpperCase())}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-bayan-600 hover:bg-bayan-700 text-white font-bold transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? <Spinner size="sm" className="!text-white" /> : 'Track'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold animate-fade-up">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Parcel summary */}
          <div className="card p-4 animate-fade-up">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-black tracking-tight">{data.parcel.tracking_number}</div>
                <div className="text-sm text-ink-400 mt-0.5">For {data.parcel.recipient_name}</div>
              </div>
              <Badge status={data.parcel.status} />
            </div>

            {data.parcel.calculated_delivery_fee > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="bg-ink-50 rounded-xl py-2">
                  <div className="text-[11px] font-semibold text-ink-400 uppercase">Distance</div>
                  <div className="font-black text-ink-800">{data.parcel.delivery_distance_km} km</div>
                </div>
                <div className="bg-bayan-50 rounded-xl py-2">
                  <div className="text-[11px] font-semibold text-bayan-700 uppercase">Delivery fee</div>
                  <div className="font-black text-bayan-700">₱{data.parcel.calculated_delivery_fee}</div>
                </div>
              </div>
            )}

            {/* ETA + stale rider banner */}
            <div className="mt-3 space-y-2">
              {data.rider?.is_stale && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-bold animate-pulse-soft">
                  ⚠ Rider {data.rider.last_seen_label}
                </div>
              )}
              {data.eta && (
                <div className="flex items-center justify-between bg-bayan-50 rounded-xl px-3 py-2">
                  <span className="text-[11px] font-bold text-bayan-700 uppercase">Estimated arrival</span>
                  <span className="font-black text-bayan-700">{data.eta.min}–{data.eta.max} mins</span>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="card !p-0 overflow-hidden animate-fade-up" style={{ height: 320 }}>
            <MapView markers={markers} />
          </div>

          {/* Timeline */}
          <div className="card p-4 animate-fade-up">
            <h3 className="font-bold text-ink-700 mb-3">Status Timeline</h3>
            {data.status_history.length === 0 ? (
              <div className="text-sm text-ink-400 text-center py-4">No updates yet.</div>
            ) : (
              <ol className="relative space-y-4 pl-5">
                <span className="absolute left-[7px] top-1 bottom-1 w-px bg-ink-200" />
                {data.status_history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-bayan-500 ring-4 ring-bayan-100" />
                    <div className="text-sm font-bold capitalize">{h.status.replaceAll('_', ' ')}</div>
                    {h.note && <div className="text-xs text-ink-400">{h.note}</div>}
                    <div className="text-[11px] text-ink-300 mt-0.5">{new Date(h.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {!data && !error && !loading && (
        <div className="text-center text-sm text-ink-400 py-8">
          Tracking numbers look like <b>BB-2026-XXXXXX</b>
        </div>
      )}
    </div>
  );
}
