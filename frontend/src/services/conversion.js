import client from '../api/client.js';

const KEY = 'habi_conversion_session';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign'];
export function conversionContext() {
  try {
    let context = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!context || Date.now() - context.started > 86400000) {
      context = { session_id: crypto.randomUUID(), started: Date.now() };
      const params = new URLSearchParams(window.location.search);
      for (const field of FIELDS) {
        // Campaign labels only; do not capture URLs, queries, contact details or addresses.
        const value = params.get(field);
        if (value && /^[a-zA-Z0-9_. -]{1,80}$/.test(value)) context[field] = value;
      }
      sessionStorage.setItem(KEY, JSON.stringify(context));
    }
    const { started, ...payload } = context;
    return payload;
  } catch { return null; }
}

export function track(event, properties = {}) {
  try {
    if (localStorage.getItem('bayanbox_demo') === '1') return;
    const context = conversionContext();
    if (!context) return;
    client.post('/conversions', { ...context, event_id: crypto.randomUUID(), event, ...properties }).catch(() => {});
  } catch { /* Tracking must never interrupt shopping, even if storage is blocked. */ }
}
