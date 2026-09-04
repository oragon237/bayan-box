import { useEffect, useState } from 'react';
import client from '../api/client.js';
import DeliveryMap from './DeliveryMap.jsx';
import { calculateDeliveryFee, fetchDrivingDistance } from '../lib/distance.js';
import { useToast, Spinner } from './ui.jsx';
import { TagIcon, MapPinIcon } from './icons.jsx';

/**
 * Dynamic Delivery Calculator (PRD 5.2, FR-CALC-001..006).
 * Interactive Leaflet pin selector → real-time doorstep surcharge + 85/15 split.
 */
export default function DeliveryCostPreview({ user, hubCoords = null }) {
  const notify = useToast();
  const [customerPin, setCustomerPin] = useState(null);
  const [origin, setOrigin] = useState(hubCoords || null);
  const [municipality, setMunicipality] = useState('Naga City');
  const [calculation, setCalculation] = useState({ loading: false });

  // 1. Use device location as the origin if none provided
  useEffect(() => {
    if (origin) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error('Geolocation error:', err);
        notify('Enable location to estimate rates.', 'error');
      },
    );
  }, [origin]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMapPick = (pin) => setCustomerPin(pin);

  const calculateDynamicFee = async () => {
    if (!origin?.lat || !origin?.lng || !customerPin?.lat || !customerPin?.lng) return;

    setCalculation({ loading: true });
    try {
      // Frontend: fetch driving distance & calculate fee
      const route = await fetchDrivingDistance([origin.lng, origin.lat], [customerPin.lng, customerPin.lat]);
      const frontendFee = calculateDeliveryFee(route.distanceKm);

      // Backend: get the 85/15 split (also serves as verification)
      const response = await client.post('/delivery/calculate', {
        origin_lat: origin.lat, origin_lng: origin.lng,
        dest_lat: customerPin.lat, dest_lng: customerPin.lng,
        municipality,
      }).catch(() => null);

      const backend = response?.data;
      setCalculation({
        loading: false,
        distance_km: route.distanceKm,
        duration_mins: route.durationMins,
        total_delivery_fee: backend?.total_delivery_fee ?? frontendFee,
        rider_share: backend?.rider_share ?? Math.round(frontendFee * 0.85),
        platform_share: backend?.platform_share ?? Math.round(frontendFee * 0.15),
        base_fare: backend?.base_fare ?? 40,
        per_km_surcharge: backend?.per_km_surcharge ?? Math.max(0, (route.distanceKm - 2) * 10),
        route_geometry: route.geometry,
      });
    } catch (err) {
      console.error('Calculation failure:', err);
      notify('Unable to calculate right now. Try again.', 'error');
      setCalculation({ loading: false });
    }
  };

  const markers = [];
  if (origin?.lat) markers.push({ lat: origin.lat, lng: origin.lng, type: 'hub', label: 'Origin Hub' });
  if (customerPin?.lat) markers.push({ lat: customerPin.lat, lng: customerPin.lng, type: 'pin', label: 'Your Delivery Pin' });

  const fee = Number(calculation.total_delivery_fee ?? 0);
  const distance = Number(calculation.distance_km ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">Delivery Fee Calculator</h2>
        <p className="text-sm text-ink-400">Click the map to preview your exact last-mile rate.</p>
      </div>

      {/* Map */}
      <div className="card !p-0 overflow-hidden" style={{ height: 300 }}>
        <DeliveryMap
          origin={origin?.lat ? [origin.lng, origin.lat] : undefined}
          destination={customerPin?.lat ? [customerPin.lng, customerPin.lat] : undefined}
          routeGeometry={calculation.route_geometry}
          onPick={onMapPick}
        />
      </div>

      {/* Municipality selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {['Naga City', 'Iriga City', 'Bula', 'Pili'].map((m) => (
          <button
            key={m}
            onClick={() => setMunicipality(m)}
            className={`chip whitespace-nowrap ${
              municipality === m ? 'bg-bayan-600 text-white' : 'bg-white text-ink-500 border border-ink-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Quote result */}
      <div className="card p-5 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <span className="stat-label">Estimated Distance</span>
            <span className="text-2xl font-black text-ink-800">{distance} <span className="text-base font-bold text-ink-400">km</span></span>
          </div>
          <div className="text-right">
            <span className="stat-label">Doorstep Surcharge</span>
            <span className="text-3xl font-black text-bayan-600">
              {calculation.loading ? <Spinner /> : `₱${fee}`}
            </span>
          </div>
        </div>

        {!calculation.loading && calculation.total_delivery_fee !== undefined && (
          <>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <span className="w-1.5 h-1.5 rounded-full bg-bayan-500" />
                Base fare <b className="ml-auto text-ink-700">₱{calculation.base_fare}</b>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <span className="w-1.5 h-1.5 rounded-full bg-bayan-500" />
                Per-km surcharge <b className="ml-auto text-ink-700">₱{calculation.per_km_surcharge}</b>
              </div>
              {calculation.applied_surge > 1 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Surge multiplier <b className="ml-auto">×{calculation.applied_surge}</b>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <span className="w-1.5 h-1.5 rounded-full bg-bayan-500" />
                ETA (1.3× buffer) <b className="ml-auto text-ink-700">{calculation.eta_minutes}–{calculation.eta_max_minutes} mins</b>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-xs font-bold">
              <span className="text-green-700">Rider earns <span className="text-base">₱{calculation.rider_share}</span></span>
              <span className="text-ink-400">Platform <span className="text-ink-600">₱{calculation.platform_share}</span></span>
            </div>
          </>
        )}

        <button
          onClick={calculateDynamicFee}
          disabled={calculation.loading || !customerPin}
          className="btn-primary mt-4 flex items-center justify-center gap-2"
        >
          {calculation.loading ? (
            <><Spinner size="sm" className="!text-white" /> Calculating real road route…</>
          ) : customerPin ? (
            <><TagIcon className="w-4 h-4" /> Calculate Exact Delivery Fee</>
          ) : (
            <><MapPinIcon className="w-4 h-4" /> Tap the map to drop your pin</>
          )}
        </button>
      </div>
    </div>
  );
}
