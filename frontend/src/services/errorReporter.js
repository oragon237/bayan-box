import client from '../api/client.js';

let lastSent = {};

export function reportClientError(details) {
  const message = String(details?.message || details?.name || 'Unknown error');
  const key = message + (details?.url || '');
  const now = Date.now();

  if (lastSent[key] && now - lastSent[key] < 10000) {
    return;
  }
  lastSent[key] = now;

  try {
    client
      .post('/errors/report', {
        message,
        source: details?.source || 'client',
        line: details?.line || null,
        column: details?.column || null,
        stack: details?.stack ? String(details.stack).slice(0, 2000) : null,
        url: details?.url || window.location.href,
      })
      .catch(() => {});
  } catch {
    // never let error reporting break the app
  }
}
