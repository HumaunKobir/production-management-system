const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (response.status === 401) {
    const error = new Error('Unauthenticated');
    error.status = 401;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  getCsrfCookie: () => fetch('/sanctum/csrf-cookie', { credentials: 'include' }),

  login: async (body) => {
    await api.getCsrfCookie();
    return request('/login', { method: 'POST', body: JSON.stringify(body) });
  },

  logout: () => request('/logout', { method: 'POST' }),
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
