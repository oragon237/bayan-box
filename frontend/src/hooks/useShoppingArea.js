import { useSyncExternalStore } from 'react';
const KEY = 'habi_shopping_area';
const subscribe = (callback) => {
  window.addEventListener('habi:area', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('habi:area', callback); window.removeEventListener('storage', callback); };
};
const snapshot = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export function useShoppingArea() {
  const stored = useSyncExternalStore(subscribe, snapshot);
  let area = {};
  try { area = JSON.parse(stored || '{}'); } catch { /* Invalid saved preference: browse all. */ }
  if (!area || typeof area !== 'object') area = {};
  const city = typeof area.city === 'string' ? area.city : '';
  const barangay = city && typeof area.barangay === 'string' ? area.barangay : '';
  const setArea = (next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return; }
    window.dispatchEvent(new Event('habi:area'));
  };
  return [{ city, barangay }, setArea];
}

export const areaParams = (area) => area.city ? { city: area.city, barangay: area.barangay || undefined, exact_area: 1 } : {};
