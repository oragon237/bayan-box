import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import DeliveryMap from '../../components/DeliveryMap.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATE_STYLE = {
  raider_assigned: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  raider_en_route_to_merchant: 'bg-blue-50 text-blue-700 border-blue-200',
  at_merchant: 'bg-purple-50 text-purple-700 border-purple-200',
  in_transit: 'bg-orange-50 text-orange-700 border-orange-200',
  arrived: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-ink-100 text-ink-500 border-ink-200',
};

const STATE_LABEL = {
  raider_assigned: 'Assigned to you',
  raider_en_route_to_merchant: 'Heading to merchant',
  at_merchant: 'At merchant',
  in_transit: 'Heading to customer',
  arrived: 'At customer',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_ACTION = {
  raider_assigned: { action: 'depart_to_merchant', label: '🚚 Go to merchant', notice: 'Heading to the merchant.' },
  raider_en_route_to_merchant: { action: 'arrive_merchant', label: '📍 I arrived at merchant', notice: 'Merchant arrival confirmed.' },
  at_merchant: { action: 'pickup_order', label: '📦 Confirm pickup', notice: 'Order picked up. Head to the customer.' },
  in_transit: { action: 'arrive_customer', label: '📍 I arrived at customer', notice: 'Customer arrival confirmed.' },
  arrived: { action: 'complete_delivery', label: '✅ Complete delivery', notice: 'Delivery completed.' },
};

export default function RiderDeliveries({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('active');
  const [deliveries, setDeliveries] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [proofPhoto, setProofPhoto] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, h] = await Promise.all([
        client.get('/rider/deliveries'),
        client.get('/rider/deliveries/history'),
      ]);
      setDeliveries(a.data.deliveries || []);
      setHistory(h.data.data || []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const action = async (delivery, next) => {
    if (next.action === 'complete_delivery' && !proofPhoto) {
      notify('Upload a proof-of-delivery photo before completing this delivery.', 'error');
      return;
    }
    try {
      const res = await client.post(`/orders/${delivery.id}/state/${next.action}`, next.action === 'complete_delivery' ? { photo_url: proofPhoto } : {});
      notify(res.data?.message || next.notice);
      setViewing(null);
      setProofPhoto(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed.', 'error');
    }
  };

  const refuse = async (delivery) => {
    try {
      const res = await client.post(`/rider/deliveries/${delivery.id}/refuse`);
      notify(res.data?.message || 'Assignment declined.');
      setViewing(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not refuse this delivery.', 'error');
    }
  };

  const openDetail = (d) => {
    setViewing(d);
    setProofPhoto(null);
  };

  const renderDetail = (d) => {
    const state = d.delivery_state;
    const next = NEXT_ACTION[state];
    const dest = d.latitude && d.longitude ? [d.longitude, d.latitude] : null;
    // Origin = merchant store location (fallback: Naga hub)
    const origin = d.merchant?.latitude && d.merchant?.longitude
      ? [d.merchant.longitude, d.merchant.latitude]
      : [123.1948, 13.6218];
    return (
      <div className="card overflow-hidden">
        <div className="px-4 py-2 bg-ink-50 flex items-center justify-between">
          <span className="font-black text-ink-800">Order #{d.id}</span>
          <span className={`chip border ${STATE_STYLE[state] || 'bg-ink-100 text-ink-500'}`}>{STATE_LABEL[state] || state}</span>
        </div>

        {dest && <DeliveryMap origin={origin} destination={dest} className="w-full h-40" />}

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-ink-50 rounded-xl p-3">
              <p className="text-[10px] text-ink-400 uppercase font-bold">🏪 Merchant</p>
              <p className="font-bold text-ink-800 mt-0.5">{d.merchant?.name || '—'}</p>
              <p className="text-xs text-ink-500">{d.merchant?.barangay}{d.merchant?.barangay && d.merchant?.municipality ? ', ' : ''}{d.merchant?.municipality || ''}</p>
            </div>
            <div className="bg-ink-50 rounded-xl p-3">
              <p className="text-[10px] text-ink-400 uppercase font-bold">📦 Customer</p>
              <p className="font-bold text-ink-800 mt-0.5">{d.customer?.name}</p>
              <p className="text-xs text-ink-500">📱 {d.customer?.phone}</p>
            </div>
            <div className="bg-ink-50 rounded-xl p-3">
              <p className="text-[10px] text-ink-400 uppercase font-bold">📍 Delivery address</p>
              <p className="text-sm text-ink-700 mt-0.5">{d.delivery_address || 'Address on record'}</p>
            </div>
          </div>

          <div className="bg-ink-50 rounded-xl p-3 text-xs space-y-1">
            <p className="text-ink-500 font-bold">🛍 Items</p>
            {d.items?.map((i) => (
              <p key={i.id || i.product?.id} className="text-ink-600">• {i.product?.name} ×{i.quantity}</p>
            )) || <p className="text-ink-400">—</p>}
            <p className="text-ink-400 mt-1">💳 {String(d.payment_method || 'gcash').toUpperCase()}</p>
          </div>

          {/* Earnings breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 rounded-xl p-2"><p className="text-sm font-black text-green-700">₱{Number(d.shipping_amount).toLocaleString()}</p><p className="text-[10px] text-ink-400">Base fee</p></div>
            <div className="bg-ink-50 rounded-xl p-2"><p className="text-sm font-black text-ink-700">₱0</p><p className="text-[10px] text-ink-400">Tip</p></div>
            <div className="bg-orange-50 rounded-xl p-2"><p className="text-sm font-black text-orange-600">₱0</p><p className="text-[10px] text-ink-400">Surge</p></div>
          </div>

          {state === 'arrived' && (
            <div className="rounded-2xl border border-bayan-100 bg-bayan-50/70 p-3 space-y-2">
              <p className="text-sm font-black text-bayan-800">📷 Proof of delivery</p>
              <p className="text-xs text-bayan-700">Upload the handoff photo before completing this delivery.</p>
              <ImageUploader value={proofPhoto} onChange={setProofPhoto} folder="delivery-proofs" label="Proof of delivery" />
            </div>
          )}

          {next && (
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${d.customer?.phone}`} className="flex-1 min-w-24 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl text-center">📞 Call</a>
              <a href={`https://www.google.com/maps/dir/${d.merchant?.latitude ? `${d.merchant.latitude},${d.merchant.longitude}/` : ''}${d.latitude},${d.longitude}`} target="_blank" rel="noreferrer" className="flex-1 min-w-24 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl text-center">🧭 Navigate</a>
              <button onClick={() => action(d, next)} className="flex-1 min-w-32 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl">{next.label}</button>
              {state === 'raider_assigned' && <button onClick={() => refuse(d)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl">✕ Refuse</button>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Deliveries</h2>
        <p className="text-white/75 text-sm mt-1">Tap any delivery to view full details.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')} className={`chip border ${tab === 'active' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>🛵 Active ({deliveries.length})</button>
        <button onClick={() => setTab('history')} className={`chip border ${tab === 'history' ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>📜 History ({history.length})</button>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : tab === 'active' ? (
        deliveries.length === 0 ? (
          <EmptyState icon="🛵" title="No assigned deliveries" hint="New orders will appear here when staff dispatches them." />
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <button key={d.id} onClick={() => openDetail(d)} className="card p-4 w-full text-left space-y-3 hover:shadow-lift transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-ink-400">Order #{d.id}</p>
                    <h3 className="font-bold text-ink-800">{d.customer?.name}</h3>
                    <p className="text-xs text-ink-500">📱 {d.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-ink-900">₱{Number(d.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-ink-400">+ ₱{Number(d.shipping_amount).toLocaleString()} delivery</p>
                  </div>
                </div>

                <div className="bg-ink-50 rounded-xl p-3 text-xs space-y-1">
                  <p className="text-ink-500">📍 {d.delivery_address || 'Address provided'}</p>
                  <p className="text-ink-400">{d.items?.map((i) => `${i.product?.name} ×${i.quantity}`).join(', ') || '—'}</p>
                  <p className="text-ink-400">💳 {String(d.payment_method || 'gcash').toUpperCase()}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`chip border ${STATE_STYLE[d.delivery_state] || 'bg-ink-100 text-ink-500'}`}>{STATE_LABEL[d.delivery_state] || d.delivery_state}</span>
                  <span className="text-xs font-bold text-bayan-700">View details →</span>
                </div>
              </button>
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState icon="📜" title="No delivery history yet" hint="Completed deliveries will appear here." />
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <button key={h.id} onClick={() => openDetail(h)} className="card p-4 w-full flex items-center gap-3 text-left hover:shadow-lift transition">
              <div className="w-11 h-11 rounded-xl bg-ink-100 flex items-center justify-center text-xl shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-800">Order #{h.id} — ₱{Number(h.total_amount).toLocaleString()}</p>
                <p className="text-xs text-ink-400 truncate">{h.customer?.name} · {h.customer?.phone}</p>
                <p className="text-[11px] text-ink-400">{h.items?.map((i) => `${i.product?.name} ×${i.quantity}`).join(', ') || '—'}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">{new Date(h.updated_at || h.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`chip border shrink-0 ${STATE_STYLE[h.delivery_state] || 'bg-ink-100 text-ink-500'}`}>{STATE_LABEL[h.delivery_state] || h.delivery_state}</span>
            </button>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setViewing(null)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-black text-ink-800">Delivery details</h3>
              <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center" aria-label="Close">✕</button>
            </div>
            <div className="p-4">
              {renderDetail(viewing)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
