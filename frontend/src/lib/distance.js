import { distance, point } from '@turf/turf';

/**
 * Delivery distance & fee utilities.
 */

// Maximum delivery radius from the hub. Beyond this we treat the destination
// as outside the service area instead of quoting an absurd linear fee.
export const MAX_DELIVERY_KM = 100;

/**
 * Straight-line (Haversine) distance in kilometers via Turf.js.
 * @param {[number, number]} coords1 [lng, lat]
 * @param {[number, number]} coords2 [lng, lat]
 */
export function calculateDirectDistance(coords1, coords2) {
  if (!coords1 || !coords2) return 0;
  return distance(point(coords1), point(coords2), { units: 'kilometers' });
}

/**
 * Fetch driving distance from the free OSRM public API.
 * @param {[number, number]} origin [lng, lat]
 * @param {[number, number]} destination [lng, lat]
 * @returns {Promise<{distanceKm:number,durationMins:number,geometry:number[][]}>}
 */
export async function fetchDrivingDistance(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM request failed');
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('No route found');
    const route = data.routes[0];
    const geometry = route.geometry?.coordinates || []; // [[lng,lat],...]
    return {
      distanceKm: route.distance / 1000,
      durationMins: Math.round(route.duration / 60),
      geometry,
    };
  } catch (err) {
    // Fallback: straight-line distance if OSRM is unreachable
    const dist = calculateDirectDistance(origin, destination);
    return { distanceKm: dist, durationMins: Math.round((dist / 25) * 60), geometry: [origin, destination] };
  }
}

/**
 * Delivery fee: ₱40 for the first 2 km, then ₱10 per additional km.
 * @param {number} distanceKm
 */
export function calculateDeliveryFee(distanceKm) {
  const BASE_FEE = 40;
  const BASE_DISTANCE_KM = 2;
  const PER_KM_RATE = 10;
  const surcharge = distanceKm > BASE_DISTANCE_KM ? (distanceKm - BASE_DISTANCE_KM) * PER_KM_RATE : 0;
  return Math.round(BASE_FEE + surcharge);
}

/**
 * Format a fee summary line, e.g. "Est. Distance: 3.4 km | Delivery Fee: ₱54".
 */
export function formatFeeSummary(distanceKm, fee) {
  return `Est. Distance: ${Number(distanceKm).toFixed(1)} km | Delivery Fee: ₱${fee}`;
}