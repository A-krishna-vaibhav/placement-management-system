const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, token, headers: customHeaders = {} } = options;

  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body && method !== 'GET') config.body = JSON.stringify(body);

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

  verifyLoginOTP: (token, otp) =>
    apiRequest('/verify-login-otp', { method: 'POST', token, body: { otp } }),

  forgotPassword: (email) =>
    apiRequest('/forgot-password', { method: 'POST', body: { email } }),

  getProfile: (token) =>
    apiRequest('/me', { token }),
};

/* ─── Reference API (public) ─── */
export const referenceAPI = {
  getSchools: () =>
    apiRequest('/reference/schools'),

  getDepartments: (schoolId) =>
    apiRequest(`/reference/departments?schoolId=${encodeURIComponent(schoolId)}`),
};

/* ─── Admin API ─── */
export const adminAPI = {
  listUsers: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`, { token });
  },

  updateUserRole: (token, userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, { method: 'PATCH', token, body: { role } }),

  updateUserStatus: (token, userId, status) =>
    apiRequest(`/admin/users/${userId}/status`, { method: 'PATCH', token, body: { status } }),

  deleteUser: (token, userId) =>
    apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token }),

  provisionFaculty: (token, payload) =>
    apiRequest('/admin/faculty', { method: 'POST', token, body: payload }),

  provisionTPO: (token, payload) =>
    apiRequest('/admin/tpo', { method: 'POST', token, body: payload }),

  approveCompany: (token, userId) =>
    apiRequest(`/admin/companies/${userId}/approve`, { method: 'POST', token }),

  rejectCompany: (token, userId, reason) =>
    apiRequest(`/admin/companies/${userId}/reject`, { method: 'POST', token, body: { reason } }),
};

/* ─── Declaration API ─── */
export const declarationAPI = {
  getCurrent: (token) =>
    apiRequest('/declarations/current', { token }),

  sign: (token, payload) =>
    apiRequest('/declarations/sign', { method: 'POST', token, body: payload }),

  getMySigned: (token) =>
    apiRequest('/declarations/my', { token }),
};

/* ─── Student Profile API ─── */
export const studentProfileAPI = {
  get: (token) =>
    apiRequest('/profile', { token }),

  update: (token, payload) =>
    apiRequest('/profile', { method: 'PATCH', token, body: payload }),

  uploadResume: (token, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return fetch(`${API_URL}/profile/resume`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) { const e = new Error(data.message || 'Upload failed'); e.status = r.status; throw e; }
      return data;
    });
  },

  deleteResume: (token, versionId) =>
    apiRequest(`/profile/resume/${versionId}`, { method: 'DELETE', token }),
};

/* ─── Company API ─── */
export const companyAPI = {
  getProfile: (token) =>
    apiRequest('/company/profile', { token }),

  updateProfile: (token, payload) =>
    apiRequest('/company/profile', { method: 'PATCH', token, body: payload }),
};

/* ─── Job API ─── */
export const jobAPI = {
  create: (token, payload) =>
    apiRequest('/jobs', { method: 'POST', token, body: payload }),

  list: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/jobs${query ? `?${query}` : ''}`, { token });
  },

  get: (token, jobId) =>
    apiRequest(`/jobs/${jobId}`, { token }),

  approve: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/approve`, { method: 'PATCH', token }),

  reject: (token, jobId, reason) =>
    apiRequest(`/jobs/${jobId}/reject`, { method: 'PATCH', token, body: { reason } }),

  close: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/close`, { method: 'PATCH', token }),

  withdraw: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/withdraw`, { method: 'PATCH', token }),

  listApplications: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/applications`, { token }),

  updateApplicationStatus: (token, jobId, appId, status, note) =>
    apiRequest(`/jobs/${jobId}/applications/${appId}/status`, {
      method: 'PATCH', token, body: { status, note },
    }),
};

/* ─── Application API ─── */
export const applicationAPI = {
  apply: (token, jobId, payload) =>
    apiRequest(`/jobs/${jobId}/apply`, { method: 'POST', token, body: payload }),

  listMine: (token) =>
    apiRequest('/applications', { token }),

  withdraw: (token, appId) =>
    apiRequest(`/applications/${appId}/withdraw`, { method: 'PATCH', token }),
};

/* ─── Stats API ─── */
export const statsAPI = {
  get: (token) => apiRequest('/stats', { token }),
};

export default apiRequest;
