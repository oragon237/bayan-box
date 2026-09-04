import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapView from './MapView.jsx';

// Reliable OpenStreetMap raster tile style (no API key, widely reachable).
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const DEFAULT_CENTER = [123.1948, 13.6218]; // [lng, lat] Naga default
const DEFAULT_ZOOM = 12;
const EMPTY_MARKERS = [];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pinEl(emoji, bg, badge) {
  const el = document.createElement('div');
  el.className = 'flex flex-col items-center pointer-events-none select-none';
  el.innerHTML = `<span class="flex items-center justify-center w-9 h-9 rounded-full ${bg} text-white text-base shadow-lg">${emoji}</span>`
    + (badge ? `<span class="mt-0.5 rounded-full bg-white text-ink-700 text-[9px] font-bold leading-none px-1.5 py-0.5 shadow whitespace-nowrap">${esc(badge)}</span>` : '');
  return el;
}

// Accept both numeric and string ("13.74650030") coords from API payloads;
// reject anything non-finite so MapLibre never receives NaN.
function toCoord(lngLat) {
  if (!lngLat || lngLat.length < 2) return undefined;
  const lng = Number(lngLat[0]);
  const lat = Number(lngLat[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
  return [lng, lat];
}

// MapLibre v6 needs WebGL2; Firefox more often runs without it (software
// fallback, driver blocklists, disabled acceleration). Pre-check so we can
// degrade to the Leaflet renderer instead of crashing the page.
function supportsWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * MapLibre map with merchant / customer / rider markers, a route polyline,
 * and auto-fit bounds. Uses OSM raster tiles (no API key).
 * Falls back to the Leaflet-based MapView when WebGL2 is unavailable.
 *
 * @param {[number, number]} [origin] [lng, lat]
 * @param {[number, number]} [destination] [lng, lat]
 * @param {[number, number]} [rider] [lng, lat]
 * @param {number[][]} [routeGeometry]
 * @param {Array<{ lngLat: [number, number], emoji?: string, color?: string, name?: string, label?: string }>} [extraMarkers] `name` renders a permanent tag under the icon, `label` the click popup
 */
export default function DeliveryMap({
  origin,
  destination,
  rider,
  routeGeometry,
  extraMarkers = EMPTY_MARKERS,
  onPick,
  className = 'w-full h-56 rounded-2xl',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [gpuOk, setGpuOk] = useState(supportsWebGL2);

  // Serialize coords so callers passing fresh inline arrays (or string
  // numbers from the API) don't trigger a redraw/fitBounds on every render.
  const coordKey = JSON.stringify([
    toCoord(origin) || null,
    toCoord(destination) || null,
    toCoord(rider) || null,
    (routeGeometry || []).map(toCoord),
    extraMarkers.map((m) => [toCoord(m.lngLat) || null, m.emoji, m.color, m.name, m.label]),
  ]);

  const fallbackMarkers = useMemo(() => {
    const list = [];
    const push = (lngLat, type, label) => {
      const c = toCoord(lngLat);
      if (c) list.push({ lng: c[0], lat: c[1], type, label });
    };
    push(origin, 'hub', 'Pickup');
    push(destination, 'dest', 'Drop-off');
    push(rider, 'rider', 'Rider');
    extraMarkers.forEach((m) => push(m.lngLat, m.emoji === '🛵' ? 'rider' : 'pin', m.label));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordKey]);

  useEffect(() => {
    if (!gpuOk || !containerRef.current || mapRef.current) return;

    const container = containerRef.current;
    if (container.clientHeight === 0) {
      container.style.minHeight = '200px';
    }

    let map;
    try {
      map = new maplibregl.Map({
        container,
        style: OSM_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
        renderWorldCopies: false,
      });
    } catch {
      // GPUInitializationError (v6.7+): the context vanished between the
      // pre-check and construction — degrade instead of crashing the page.
      setGpuOk(false);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // MapLibre v6 is WebGL2-only; some Firefox builds/drivers fail to create
    // the context at style-load time even when the probe above passed. Catch
    // the runtime GPU error and fall back to the Leaflet renderer.
    map.on('error', (e) => {
      const msg = String(e?.error?.message || e || '');
      if (/webgl|GPU|context|canvas/i.test(msg)) {
        setGpuOk(false);
      }
    });

    const resizeTimer = setTimeout(() => map.resize(), 300);

    if (onPick) {
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onPick({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });
    }

    return () => {
      clearTimeout(resizeTimer);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [gpuOk]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const boundsPts = [];
      const add = (lngLat, emoji, bg, popup, badge) => {
        const coord = toCoord(lngLat);
        if (!coord) return;
        const marker = new maplibregl.Marker({ element: pinEl(emoji, bg, badge) }).setLngLat(coord);
        if (popup) marker.setPopup(new maplibregl.Popup({ offset: 16 }).setText(popup));
        marker.addTo(map);
        markersRef.current.push(marker);
        boundsPts.push(coord);
      };

      add(origin, '🏪', 'bg-bayan-600', 'Pickup');
      add(destination, '🏠', 'bg-amber-500', 'Drop-off');
      add(rider, '🛵', rider ? 'bg-blue-600' : 'bg-ink-400', 'Rider');
      extraMarkers.forEach((m) => add(m.lngLat, m.emoji || '📍', m.color || 'bg-ink-700', m.label, m.name || m.label));

      const sourceId = 'route-line';
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const rawCoords = routeGeometry?.length
        ? routeGeometry
        : origin && destination
          ? [origin, destination]
          : [];
      const coords = rawCoords.map(toCoord).filter(Boolean);
      if (coords.length >= 2) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#673de6', 'line-width': 4, 'line-opacity': 0.85 },
        });
      }

      try {
        if (boundsPts.length >= 2) {
          const bounds = new maplibregl.LngLatBounds();
          boundsPts.forEach((m) => bounds.extend(m));
          map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
        } else if (boundsPts.length === 1) {
          map.easeTo({ center: boundsPts[0], zoom: 14, duration: 400 });
        }
      } catch {
        // Ignore impossible fits (oversized padding vs container); keep markers.
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
    // coordKey compares values, not array identity: a fresh inline array
    // with unchanged numbers no longer re-fits (and re-jumps) the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordKey]);


  if (!gpuOk) {
    if (fallbackMarkers.length === 0) {
      return <div className={`flex items-center justify-center bg-ink-50 text-ink-400 text-xs ${className}`}>Map unavailable</div>;
    }
    return <MapView markers={fallbackMarkers} onPick={onPick} className={`${className} !min-h-0`} />;
  }

  return <div ref={containerRef} className={className} style={{ width: '100%' }} />;
}
