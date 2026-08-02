const API_BASE = import.meta.env.VITE_API_URL || '/api';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function getApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function getCsrfCookieUrl() {
  if (API_BASE.startsWith('http')) {
    return API_BASE.replace(/\/api\/?$/, '') + '/sanctum/csrf-cookie';
  }

  return `${window.location.origin}/sanctum/csrf-cookie`;
}

function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrf() {
  if (!getCsrfToken()) {
    await fetch(getCsrfCookieUrl(), { credentials: 'include' });
  }
}

async function request(path, options = {}, isRetry = false) {
  await ensureCsrf();

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(getApiUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
    const error = new Error('Unauthenticated. Please log in again.');
    error.status = 401;
    throw error;
  }

  if (response.status === 419 && !isRetry) {
    await fetch(getCsrfCookieUrl(), { credentials: 'include' });
    return request(path, options, true);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message
      || data?.errors?.email?.[0]
      || `Request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  getCsrfCookie: () => fetch(getCsrfCookieUrl(), { credentials: 'include' }),

  login: async (body) => {
    await api.getCsrfCookie();
    const result = await request('/login', { method: 'POST', body: JSON.stringify(body) });
    await api.getCsrfCookie();
    return result;
  },

  logout: async () => {
    await request('/logout', { method: 'POST' });
    await api.getCsrfCookie();
  },

  me: () => request('/me'),
  getDashboard: () => request('/dashboard'),

  getUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  getRawMaterials: () => request('/raw-materials'),
  createRawMaterial: (body) => request('/raw-materials', { method: 'POST', body: JSON.stringify(body) }),
  deleteRawMaterial: (id) => request(`/raw-materials/${id}`, { method: 'DELETE' }),

  getSemiFinished: () => request('/semi-finished-products'),
  createSemiFinished: (body) => request('/semi-finished-products', { method: 'POST', body: JSON.stringify(body) }),
  deleteSemiFinished: (id) => request(`/semi-finished-products/${id}`, { method: 'DELETE' }),

  getFinished: () => request('/finished-products'),
  createFinished: (body) => request('/finished-products', { method: 'POST', body: JSON.stringify(body) }),
  deleteFinished: (id) => request(`/finished-products/${id}`, { method: 'DELETE' }),

  getInventory: () => request('/inventory'),
  receiveRawMaterial: (body) => request('/inventory/receive', { method: 'POST', body: JSON.stringify(body) }),

  getProductionHistory: () => request('/production'),
  getProductionBatch: (id) => request(`/production/${id}`),
  startRawToSemi: (body) => request('/production/raw-to-semi', { method: 'POST', body: JSON.stringify(body) }),
  startSemiToFinished: (body) => request('/production/semi-to-finished', { method: 'POST', body: JSON.stringify(body) }),

  traceFinishedBatch: (id) => request(`/traceability/finished-batch/${id}`),
};
