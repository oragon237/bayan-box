import { fetchDrivingDistance } from './distance.js';

/**
 * Geocode a free-text address into coordinates using OpenStreetMap Nominatim.
 * Free, no API key. Returns { lat, lng } or null.
 *
 * Implements progressive fallback: if the full address fails, strips
 * the most specific component (e.g. "Zone 4B, Tara, Sipocot" → "Tara, Sipocot")
 * and retries up to the municipality level. Helps rural barangay/purok
 * addresses that Nominatim may not have at full granularity.
 */
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;

  const candidates = buildFallbackCandidates(address);

  for (let i = 0; i < candidates.length; i++) {
    const result = await tryGeocode(candidates[i]);
    if (result) return result;
    // Nominatim rate limit: 1 request/second
    if (i < candidates.length - 1) await sleep(1100);
  }

  return null;
}

/**
 * Build an array of address strings from most specific to least, so we can
 * fall back progressively.
 *
 * "Zone 4B, Tara, Sipocot, Camarines Sur"
 *   → ["Zone 4B, Tara, Sipocot, Camarines Sur",
 *      "Tara, Sipocot, Camarines Sur",
 *      "Sipocot, Camarines Sur",
 *      "Sipocot"]
 */
function buildFallbackCandidates(address) {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return [address];

  const candidates = [];
  for (let start = 0; start < parts.length; start++) {
    candidates.push(parts.slice(start).join(', '));
  }
  // Deduplicate (in case slicing produces identical strings)
  return [...new Set(candidates)];
}

async function tryGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json', 'User-Agent': 'HABI/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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