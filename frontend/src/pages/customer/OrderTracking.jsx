import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import CancelOrderButton from '../../components/CancelOrderButton.jsx';
import { Badge, Spinner } from '../../components/ui.jsx';

const STATE_COPY = {
  pending_merchant: 'Waiting for the merchant to accept.',
  preparing: 'The merchant is preparing your order.',
  ready_for_pickup: 'Ready for pickup — a rider will be assigned soon.',
  raider_assigned: 'A rider is assigned and heading to the store.',
  raider_en_route_to_merchant: 'Rider is on the way to pick up your order.',
  at_merchant: 'Rider is at the store collecting your order.',
  in_transit: 'Rider is on the way to you.',
  arrived: 'Rider has arrived at your drop-off.',
  delivered: 'Delivered.',
  cancelled: 'This order was cancelled.',
};

export default function OrderTracking() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: payload } = await client.get(`/orders/${id}/track`);
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load live tracking.');
      if (!silent) setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!data?.live) return undefined;
    const timer = setInterval(() => load(true), 10_000);
    return () => clearInterval(timer);
  }, [id, data?.live]);

  const origin = useMemo(() => {
    const m = data?.merchant;
    if (!m?.latitude || !m?.longitude) return undefined;
    return [Number(m.longitude), Number(m.latitude)];
  }, [data?.merchant]);

  const destination = useMemo(() => {
    const d = data?.destination;
    if (!d?.latitude || !d?.longitude) return undefined;
    return [Number(d.longitude), Number(d.latitude)];
  }, [data?.destination]);

  const rider = useMemo(() => {
    const r = data?.rider;
    if (!r?.latitude || !r?.longitude) return undefined;
    return [Number(r.longitude), Number(r.latitude)];
  }, [data?.rider]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/orders" className="text-sm font-bold text-bayan-700">← My orders</Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold">{error}</div>
      </div>
    );
  }

  const state = data.order.delivery_state;
  const heading = data.heading_to === 'merchant' ? 'Heading to store' : 'Heading to you';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/orders" className="text-xs font-bold text-bayan-700">← My orders</Link>
          <h2 className="text-xl font-black tracking-tight mt-1">Live tracking</h2>
          <p className="text-sm text-ink-400">Order #{data.order.id}</p>
        </div>
        <Badge status={state} />
      </div>

      <div className="card p-4">
        <p className="font-bold text-ink-800">{STATE_COPY[state] || state}</p>
        {state === 'pending_merchant' && (
          <div className="mt-2">
            <CancelOrderButton orderId={data.order.id} onDone={() => load(true)} />
          </div>
        )}
        {data.live && (
          <p className="text-xs text-bayan-700 font-semibold mt-1">
            {heading} · map refreshes every 10 seconds
          </p>
        )}
        {data.rider?.is_stale && (
          <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-bold">
            ⚠ Rider {data.rider.last_seen_label}
          </div>
        )}
        {data.eta && data.live && (
          <div className="mt-3 flex items-center justify-between bg-bayan-50 rounded-xl px-3 py-2">
            <span className="text-[11px] font-bold text-bayan-700 uppercase">Estimated arrival</span>
            <span className="font-black text-bayan-700">{data.eta.min}–{data.eta.max} mins</span>
          </div>
        )}
        {data.rider && !data.live && state !== 'cancelled' && (
          <p className="text-[11px] text-ink-400 mt-1">🔒 Live rider location pauses once the order is {String(state).replace(/_/g, ' ')}.</p>
        )}
        <div className="mt-3 grid gap-1 text-xs text-ink-500">
          <p>🏪 {data.merchant?.name || 'Merchant'} — {[data.merchant?.barangay, data.merchant?.municipality].filter(Boolean).join(', ') || 'Store'}</p>
          <p>🏠 {data.destination?.address || 'Your drop-off'}</p>
          {data.rider?.name && <p>🛵 {data.rider.name}{data.rider.last_seen_label ? ` · ${data.rider.last_seen_label}` : data.rider.latitude ? ' · live' : ' · waiting for GPS'}</p>}
        </div>
        <div className="mt-2 text-xs text-ink-500">
          {data.items?.map((i) => (
            <span key={i.name} className="inline-block bg-ink-50 px-2 py-0.5 rounded-full mr-1 mt-1">{i.name} ×{i.quantity}</span>
          ))}
        </div>
      </div>

      {(origin || destination || rider) ? (
        <div className="card !p-0 overflow-hidden" style={{ height: 320 }}>
          <DeliveryMap origin={origin} destination={destination} rider={rider} className="w-full h-full" />
        </div>
      ) : (
        <div className="card p-6 text-sm text-ink-400 text-center">No map coordinates yet for this order.</div>
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-ink-500 px-1">
        <span>🏪 Pickup</span>
        <span>🛵 Rider</span>
        <span>🏠 Drop-off</span>
      </div>
    </div>
  );
}
