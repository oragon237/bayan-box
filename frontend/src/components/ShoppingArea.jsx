import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useShoppingArea } from '../hooks/useShoppingArea.js';
import { track } from '../services/conversion.js';

export default function ShoppingArea() {
  const [area, setArea] = useShoppingArea();
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    client.get('/products/locations').then(({ data }) => setLocations(data)).catch(() => setError(true));
  }, []);
  const cities = [...new Set([...locations.map((row) => row.city), area.city].filter(Boolean))];
  const barangays = [...new Set([...locations.filter((row) => row.city === area.city).map((row) => row.barangay), area.barangay].filter(Boolean))];
  const change = (next) => { setArea(next); track('select_area'); };
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-3 space-y-2" aria-label="Shopping area">
      <p className="text-sm font-bold text-ink-800">Shop by store location</p>
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-36 text-xs text-ink-600">Municipality / city
          <select className="field w-full" value={area.city} onChange={(e) => change({ city: e.target.value, barangay: '' })}>
            <option value="">All locations</option>{cities.map((city) => <option key={city}>{city}</option>)}
          </select>
        </label>
        <label className="flex-1 min-w-36 text-xs text-ink-600">Barangay
          <select className="field w-full" disabled={!area.city} value={area.barangay} onChange={(e) => change({ ...area, barangay: e.target.value })}>
            <option value="">All barangays</option>{barangays.map((barangay) => <option key={barangay}>{barangay}</option>)}
          </select>
        </label>
      </div>
      <p className="text-[11px] text-ink-500">Filters stores only. Delivery availability and fees depend on your checkout address.</p>
      {error && <p className="text-xs text-red-600">Could not load locations. You can still browse all locations.</p>}
    </section>
  );
}
