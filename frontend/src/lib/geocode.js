import { fetchDrivingDistance } from './distance.js';

/**
 * Geocode a free-text address into coordinates using OpenStreetMap Nominatim.
 * Free, no API key. Returns { lat, lng } or null.
 */
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(address)}`,
      { headers: { Accept: 'application/json', 'User-Agent': 'BeCoolBox/1.0' } },
    );
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Auto-fill coordinates from an address, then compute the delivery estimate.
 * Returns an updated state payload or null when geocoding fails.
 */
export async function autodetectDelivery(address, origin, previousCoords) {
  const coords = await geocodeAddress(address);
  if (!coords) return { coords: previousCoords, estimate: null, error: 'Could not find that address. Please enter coordinates manually.' };

  const route = await fetchDrivingDistance(origin, [coords.lng, coords.lat]);
  const fee = route.distanceKm > 2 ? Math.round(40 + (route.distanceKm - 2) * 10) : 40;

  return {
    coords,
    estimate: { distanceKm: route.distanceKm, durationMins: route.durationMins, fee, geometry: route.geometry },
    error: null,
  };
}