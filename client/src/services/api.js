const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal API Request Wrapper with Token and Tenant Interceptors
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('servora_token');
  const activeBranchId = localStorage.getItem('servora_active_branch_id');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeBranchId) {
    headers['x-branch-id'] = activeBranchId;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Handle CSV or non-JSON downloads
    if (response.headers.get('content-type')?.includes('text/csv')) {
      return response.blob();
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status === 401 && !endpoint.includes('/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('servora_token');
      localStorage.removeItem('servora_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
