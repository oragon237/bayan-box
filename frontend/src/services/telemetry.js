/**
 * GPS telemetry watcher (FR-MAP-002).
 * Pushes a new coordinate batch to the server only when the device detects
 * movement exceeding 50 metres, reducing mobile data consumption. Falls back
 * to the offline queue when the network is unavailable.
 */

import { enqueueAction } from './offlineQueue.js';
import client from '../api/client.js';

const MOVEMENT_THRESHOLD = 50; // metres
const FLUSH_INTERVAL = 30_000; // flush every 30s even if movement is small

let watcherId = null;
let lastPosition = null;
let pendingPoints = [];
let lastFlush = 0;

/**
 * Start the high-accuracy GPS watcher. Returns a cleanup function.
 * @param {number} riderId
 * @param {(positions: Array) => void} [onSync] — optional progress callback
 */
export function startTelemetry(riderId, onSync) {
  if (!navigator.geolocation) {
    console.warn('Geolocation not available on this device.');
    return () => {};
  }

  const flush = async () => {
    if (pendingPoints.length === 0) return;

    const batch = pendingPoints.splice(0);
    pendingPoints = [];

    if (navigator.onLine) {
      try {
        await client.post('/rider/telemetry', { points: batch });
        onSync?.(batch);
      } catch (err) {
        // Offline: queue for background sync
        await enqueueAction({ type: 'telemetry', payload: batch });
      }
    } else {
      await enqueueAction({ type: 'telemetry', payload: batch });
    }
  };

  // Periodic flush timer
  const tick = setInterval(flush, FLUSH_INTERVAL);

  watcherId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      const now = Date.now();

      // Check 50m threshold
      if (lastPosition) {
        const dist = haversine(lastPosition.lat, lastPosition.lng, latitude, longitude);
        if (dist < MOVEMENT_THRESHOLD) return;
      }

      lastPosition = { lat: latitude, lng: longitude };

      pendingPoints.push({
        latitude,
        longitude,
        accuracy_m: accuracy || 0,
        speed_mps: speed || null,
        heading_deg: heading || null,
        recorded_at: new Date().toISOString(),
      });
    },
    (err) => console.warn('GPS error:', err.message),
    {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000,
    },
  );

  // Flush on page unload
  const unload = () => {
    flush();
    clearInterval(tick);
  };
  window.addEventListener('beforeunload', unload);

  return () => {
    if (watcherId !== null) navigator.geolocation.clearWatch(watcherId);
    clearInterval(tick);
    window.removeEventListener('beforeunload', unload);
  };
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}