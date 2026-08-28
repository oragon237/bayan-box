import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TILE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER = [123.1948, 13.6218]; // [lng, lat] Naga default
const DEFAULT_ZOOM = 12;

/**
 * Reusable MapLibre map with merchant (store) + customer (home) markers,
 * a route polyline, and auto-fit bounds.
 *
 * @param {{origin?:[number,number], destination?:[number,number], routeGeometry?:[number,number][], className?:string}} props
 */
export default function DeliveryMap({ origin, destination, routeGeometry, onPick, className = 'w-full h-56 rounded-2xl' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // Click-to-pick a delivery pin
    if (onPick) {
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onPick({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers + route when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Wait for style to load
    const draw = () => {
      // Markers
      const existing = document.querySelectorAll('.bayan-marker');
      existing.forEach((el) => el.remove());

      const markers = [];
      if (origin) {
        const el = document.createElement('div');
        el.className = 'bayan-marker flex items-center justify-center w-9 h-9 rounded-full bg-bayan-600 text-white text-base shadow-lg';
        el.innerHTML = '🏪';
        new maplibregl.Marker({ element: el }).setLngLat(origin).addTo(map);
        markers.push(origin);
      }
      if (destination) {
        const el = document.createElement('div');
        el.className = 'bayan-marker flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white text-base shadow-lg';
        el.innerHTML = '🏠';
        new maplibregl.Marker({ element: el }).setLngLat(destination).addTo(map);
        markers.push(destination);
      }

      // Route line
      const sourceId = 'route-line';
      if (map.getSource(sourceId)) map.removeLayer('route-line-layer');
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const coords = routeGeometry?.length ? routeGeometry : (origin && destination ? [origin, destination] : []);
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

      // Fit bounds
      if (markers.length >= 2) {
        const bounds = new maplibregl.LngLatBounds();
        markers.forEach((m) => bounds.extend(m));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [origin, destination, routeGeometry]);

  return <div ref={containerRef} className={className} />;
}