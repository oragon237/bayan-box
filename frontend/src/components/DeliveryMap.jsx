import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

/**
 * Reusable MapLibre map with merchant (store) + customer (home) markers,
 * a route polyline, and auto-fit bounds. Uses OSM raster tiles for reliable
 * rendering without an API key.
 */
export default function DeliveryMap({ origin, destination, routeGeometry, onPick, className = 'w-full h-56 rounded-2xl' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const container = containerRef.current;
    // Force a concrete height so MapLibre never initializes with 0 size
    if (container.clientHeight === 0) {
      container.style.minHeight = '200px';
    }

    const map = new maplibregl.Map({
      container,
      style: OSM_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      renderWorldCopies: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // Recalculate size after layout settles (fixes blank maps)
    const resizeTimer = setTimeout(() => map.resize(), 300);

    if (onPick) {
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onPick({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });
    }

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      const existing = document.querySelectorAll('.bayan-marker');
      existing.forEach((el) => el.remove());

      const markers = [];
      if (origin) {
        const el = document.createElement('div');
        el.className = 'bayan-marker flex items-center justify-center w-9 h-9 rounded-full bg-bayan-600 text-white text-base shadow-lg';
        el.textContent = '🏪';
        new maplibregl.Marker({ element: el }).setLngLat(origin).addTo(map);
        markers.push(origin);
      }
      if (destination) {
        const el = document.createElement('div');
        el.className = 'bayan-marker flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white text-base shadow-lg';
        el.textContent = '🏠';
        new maplibregl.Marker({ element: el }).setLngLat(destination).addTo(map);
        markers.push(destination);
      }

      const sourceId = 'route-line';
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const coords = routeGeometry?.length ? routeGeometry : origin && destination ? [origin, destination] : [];
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

      if (markers.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        markers.forEach((m) => bounds.extend(m));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [origin, destination, routeGeometry]);

  return <div ref={containerRef} className={className} style={{ width: '100%' }} />;
}