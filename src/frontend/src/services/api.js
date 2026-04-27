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

  listPendingCompanies: (token) =>
    apiRequest('/admin/companies/pending', { token }),

  approveCompany: (token, companyId) =>
    apiRequest(`/admin/companies/${companyId}/approve`, { method: 'PATCH', token }),

  rejectCompany: (token, companyId, reason) =>
    apiRequest(`/admin/companies/${companyId}/reject`, { method: 'PATCH', token, body: { reason } }),
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

  assign: (token, jobId, schoolIds) =>
    apiRequest(`/jobs/${jobId}/assign`, { method: 'PATCH', token, body: { schoolIds } }),

  suggestedSchools: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/suggested-schools`, { token }),

  facultyApprove: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/faculty-approve`, { method: 'PATCH', token }),

  facultyReject: (token, jobId, reason) =>
    apiRequest(`/jobs/${jobId}/faculty-reject`, { method: 'PATCH', token, body: { reason } }),

  listApplications: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/applications`, { token }),

  updateApplicationStatus: (token, jobId, appId, status, note) =>
    apiRequest(`/jobs/${jobId}/applications/${appId}/status`, {
      method: 'PATCH', token, body: { status, note },
    }),

  getResume: (token, jobId, appId) =>
    apiRequest(`/jobs/${jobId}/applications/${appId}/resume`, { token }),
};

/* ─── Application API ─── */
export const applicationAPI = {
  apply: async (token, jobId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const r = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    });
    const data = await r.json();
    if (!r.ok) {
      const e = new Error(data.message || 'Application failed');
      e.status = r.status;
      e.data = data;
      throw e;
    }
    return data;
  },

  listMine: (token) =>
    apiRequest('/applications', { token }),

  withdraw: (token, appId) =>
    apiRequest(`/applications/${appId}/withdraw`, { method: 'PATCH', token }),
};

/* ─── Faculty API ─── */
export const facultyAPI = {
  getMyJobs: (token) =>
    apiRequest('/faculty/jobs', { token }),
};

/* ─── Exam Schedule API ─── */
export const examAPI = {
  // Company
  request: (token, jobId, body) =>
    apiRequest(`/jobs/${jobId}/exam-schedule`, { method: 'POST', token, body }),

  updateLink: (token, scheduleId, examLink) =>
    apiRequest(`/exam-schedules/${scheduleId}/exam-link`, { method: 'PATCH', token, body: { examLink } }),

  getByJob: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/exam-schedule`, { token }),

  // TPO / Admin
  forward: (token, scheduleId) =>
    apiRequest(`/exam-schedules/${scheduleId}/forward`, { method: 'PATCH', token }),

  finalize: (token, scheduleId, body) =>
    apiRequest(`/exam-schedules/${scheduleId}/finalize`, { method: 'PATCH', token, body }),

  assignVenue: (token, scheduleId, body) =>
    apiRequest(`/exam-schedules/${scheduleId}/assign-venue`, { method: 'PATCH', token, body }),

  cancel: (token, scheduleId, reason) =>
    apiRequest(`/exam-schedules/${scheduleId}/cancel`, { method: 'PATCH', token, body: { reason } }),

  // Faculty
  facultyConfirm: (token, scheduleId, body) =>
    apiRequest(`/exam-schedules/${scheduleId}/faculty-confirm`, { method: 'PATCH', token, body }),

  // Shared read
  list: (token) =>
    apiRequest('/exam-schedules', { token }),

  get: (token, scheduleId) =>
    apiRequest(`/exam-schedules/${scheduleId}`, { token }),

  // Student
  myExams: (token) =>
    apiRequest('/my-exams', { token }),
};

/* ─── Interview API ─── */
export const interviewAPI = {
  // Company
  request: (token, jobId, body) =>
    apiRequest(`/jobs/${jobId}/interview-request`, { method: 'POST', token, body }),

  updateCommonLink: (token, scheduleId, commonLink) =>
    apiRequest(`/interview-schedules/${scheduleId}/common-link`, { method: 'PATCH', token, body: { commonLink } }),

  updateSlotLink: (token, slotId, link) =>
    apiRequest(`/interview-slots/${slotId}/link`, { method: 'PATCH', token, body: { link } }),

  // TPO / Admin
  forward: (token, scheduleId) =>
    apiRequest(`/interview-schedules/${scheduleId}/forward`, { method: 'PATCH', token }),

  schedule: (token, scheduleId, body) =>
    apiRequest(`/interview-schedules/${scheduleId}/schedule`, { method: 'PATCH', token, body }),

  cancel: (token, scheduleId, reason) =>
    apiRequest(`/interview-schedules/${scheduleId}/cancel`, { method: 'PATCH', token, body: { reason } }),

  complete: (token, scheduleId) =>
    apiRequest(`/interview-schedules/${scheduleId}/complete`, { method: 'PATCH', token }),

  // Faculty
  facultyConfirm: (token, scheduleId, body) =>
    apiRequest(`/interview-schedules/${scheduleId}/faculty-confirm`, { method: 'PATCH', token, body }),

  // Student
  bookSlot: (token, slotId) =>
    apiRequest(`/interview-slots/${slotId}/book`, { method: 'POST', token }),

  cancelSlot: (token, slotId) =>
    apiRequest(`/interview-slots/${slotId}/book`, { method: 'DELETE', token }),

  myInterviews: (token) =>
    apiRequest('/my-interviews', { token }),

  // Shared reads
  getByJob: (token, jobId) =>
    apiRequest(`/jobs/${jobId}/interview-schedule`, { token }),

  list: (token) =>
    apiRequest('/interview-schedules', { token }),

  get: (token, scheduleId) =>
    apiRequest(`/interview-schedules/${scheduleId}`, { token }),

  listSlots: (token, scheduleId) =>
    apiRequest(`/interview-schedules/${scheduleId}/slots`, { token }),
};

/* ─── Announcement API ─── */
export const announcementAPI = {
  list: (token) =>
    apiRequest('/announcements', { token }),

  create: (token, payload) =>
    apiRequest('/announcements', { method: 'POST', token, body: payload }),

  remove: (token, id) =>
    apiRequest(`/announcements/${id}`, { method: 'DELETE', token }),
};

/* ─── Stats API ─── */
export const statsAPI = {
  get: (token) => apiRequest('/stats', { token }),
};

export default apiRequest;
