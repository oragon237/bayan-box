import axios from 'axios';
import { isDemoMode, mockRequest } from './mock.js';

export const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // '' at root, '/habi' in a subfolder
export const API_URL = import.meta.env.VITE_API_URL || `${APP_BASE}/api`;

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Sanctum bearer token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bayanbox_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let axios set the multipart boundary for FormData uploads. Without this,
  // the instance's default `Content-Type: application/json` is kept and the
  // server receives an unparseable body (file appears "required").
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bayanbox_token');
    }
    if (err.response?.status === 503 && err.response?.data?.maintenance) {
      const target = `${APP_BASE}/maintenance`;
      if (!window.location.pathname.startsWith(target) && !window.location.pathname.startsWith(`${APP_BASE}/login`)) {
        window.location.assign(target);
      }
    }
    return Promise.reject(err);
  },
);

// ─── Demo mode: serve mock responses without a backend ──────────────────────
// Activate via the "Explore demo" button on the Auth screen, or by setting
// localStorage.bayanbox_demo = "1". Real API calls resume after clearing it.
const originalRequest = client.request.bind(client);

client.request = function (config) {
  if (isDemoMode()) {
    const url = config.url || '';
    const mock = mockRequest(url, config.method || 'get', config.data, config.params);
    if (mock) return mock;
  }
  return originalRequest(config);
};

export default client;
