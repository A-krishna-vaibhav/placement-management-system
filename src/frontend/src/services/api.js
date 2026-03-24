/**
 * API Service
 * ───────────
 * Axios-like wrapper around fetch for backend communication.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, token, headers: customHeaders = {} } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/* ─── Auth API ─── */
export const authAPI = {
  register: (payload) =>
    apiRequest('/register', { method: 'POST', body: payload }),

  login: (token) =>
    apiRequest('/login', { method: 'POST', token }),

  verifyEmail: (token) =>
    apiRequest('/verify-email', { token }),

  forgotPassword: (email) =>
    apiRequest('/forgot-password', { method: 'POST', body: { email } }),

  getProfile: (token) =>
    apiRequest('/me', { token }),
};

/* ─── Admin API ─── */
export const adminAPI = {
  listUsers: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`, { token });
  },

  updateUserRole: (token, userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      token,
      body: { role },
    }),

  updateUserStatus: (token, userId, status) =>
    apiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      token,
      body: { status },
    }),

  deleteUser: (token, userId) =>
    apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
      token,
    }),
};

export default apiRequest;
