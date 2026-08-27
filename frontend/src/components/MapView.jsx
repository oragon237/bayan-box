import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ICONS = {
  hub: L.divIcon({
    className: '',
    html: '<div style="width:18px;height:18px;border-radius:9999px;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  }),
  rider: L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;border-radius:9999px;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  }),
  dest: L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:9999px;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  }),
  pin: L.divIcon({
    className: '',
    html: '<div style="width:12px;height:12px;border-radius:9999px;background:#673de6;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  }),
};

/**
 * Low-bandwidth Leaflet/OSM map (FR-MAP-001).
 * @param {Array<{lat:number,lng:number,type:string,label?:string}>} markers
 */
export default function MapView({ markers = [], center, onPick, className = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    mapRef.current = map;

    L.tileLayer(OSM_TILES, { maxZoom: 19 }).addTo(map);

    // Fallback for Leaflet default icon paths
    L.Icon.Default.prototype.options = {
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    };

    if (onPick) {
      map.on('click', (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous marker layer
    if (layerRef.current) layerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    if (markers.length === 0) return;

    markers.forEach((m) => {
      const icon = ICONS[m.type] || ICONS.pin;
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layer);
      if (m.label) marker.bindPopup(m.label);
    });

    // Fit bounds
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });

    if (!center && markers.length === 1) map.setZoom(14);
  }, [markers, center]);

  return <div ref={containerRef} className={`leaflet-container ${className}`} />;
}
