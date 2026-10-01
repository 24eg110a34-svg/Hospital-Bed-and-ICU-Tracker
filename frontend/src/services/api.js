import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '/ws-hospital';

const TOKEN_KEY = 'hospital_token';
const USER_KEY = 'hospital_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};
export const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/* ---- backend reachability ---------------------------------------- */

let backendDown = false;
const statusListeners = new Set();

export const isBackendDown = () => backendDown;
export const onBackendStatus = (fn) => {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
};

const setBackendDown = (down) => {
  if (down === backendDown) return;
  backendDown = down;
  statusListeners.forEach((fn) => { try { fn(down); } catch { /* listener blew up */ } });
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    setBackendDown(false);
    return response;
  },
  (error) => {
    if (error.response) {
      setBackendDown(false);
      if (error.response.status === 401) {
        clearAuth();
        if (onUnauthorized) onUnauthorized();
      }
    } else if (!error.config?.skipReachabilityCheck) {
      setBackendDown(true);
    }
    return Promise.reject(error);
  }
);

/** Cheap liveness probe. A 401 still counts as "the server answered". */
export const pingBackend = () =>
  api.get('/auth/me', { timeout: 4000, skipReachabilityCheck: true })
    .then(() => true)
    .catch((err) => {
      setBackendDown(!err.response);
      return false;
    });

export const errorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond';
  if (!error?.response) return `Cannot reach the backend at ${API_BASE}`;
  return error?.message || fallback;
};

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const bedService = {
  getAll: () => api.get('/beds'),
  getById: (id) => api.get(`/beds/${id}`),
  getAvailable: () => api.get('/beds/available'),
  getByWard: (wardId) => api.get(`/beds/ward/${wardId}`),
  eligibility: (patientId) => api.get(`/beds/eligibility/${patientId}`),
  suitablePatients: (bedId) => api.get(`/beds/${bedId}/suitable-patients`),
  allocatePatient: (bedId, patientId) => api.post(`/beds/${bedId}/allocate-patient/${patientId}`),
  completeCleaning: (bedId) => api.post(`/beds/${bedId}/complete-cleaning`),
  discharge: (bedId) => api.post(`/beds/${bedId}/discharge`),
  history: (bedId) => api.get(`/beds/${bedId}/history`),
  allocate: (patientId, bedId) => api.post(`/beds/allocate?patientId=${patientId}&bedId=${bedId}`),
  release: (allocationId) => api.post(`/beds/release?allocationId=${allocationId}`),
  markAvailable: (bedId) => api.post(`/beds/available?bedId=${bedId}`),
  updateStatus: (bedId, status, notes) => api.put(`/beds/${bedId}/status`, { status, notes }),
};

export const patientService = {
  getAll: () => api.get('/patients/all'),
  getPaged: (page = 0, size = 50) => api.get('/patients', { params: { page, size } }),
  search: (params) => api.get('/patients/search', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  getByMrn: (mrn) => api.get(`/patients/mrn/${mrn}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  applyTriage: (id, triageLevel) => api.post(`/patients/${id}/triage`, { triageLevel }),
  updateStatus: (id, status) => api.put(`/patients/${id}/status`, { status }),
  recordVitals: (id, data) => api.post(`/patients/${id}/vitals`, data),
  getVitalsHistory: (id) => api.get(`/patients/${id}/vitals/history`),
  getTimeline: (id) => api.get(`/patients/${id}/timeline`),
  getWaiting: () => api.get('/patients/queue'),
  getTriageQueue: () => api.get('/patients/triage-queue'),
  getByStatus: (status) => api.get(`/patients/status/${status}`),
};

export const allocationService = {
  getAll: () => api.get('/allocations'),
  getActive: () => api.get('/allocations/active'),
  allocate: (patientId, bedId) => api.post(`/allocations?patientId=${patientId}&bedId=${bedId}`),
  discharge: (id) => api.post(`/allocations/${id}/discharge`),
};

export const reservationService = {
  getAll: () => api.get('/reservations'),
  reserve: (bedId, patientId) => api.post(`/reservations?bedId=${bedId}&patientId=${patientId}`),
  confirm: (id) => api.post(`/reservations/${id}/confirm`),
  cancel: (id) => api.post(`/reservations/${id}/cancel`),
};

export const ambulanceService = {
  getAll: () => api.get('/ambulances'),
  getById: (id) => api.get(`/ambulances/${id}`),
  create: (data) => api.post('/ambulances', data),
  update: (id, data) => api.put(`/ambulances/${id}`, data),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const commandCenterService = {
  getStats: () => api.get('/command-center/stats'),
};

export const analyticsService = {
  getAnalytics: () => api.get('/analytics'),
};

export const auditService = {
  getAll: () => api.get('/audit-logs'),
};

export const resourceService = {
  getAll: () => api.get('/resources'),
  getShortages: () => api.get('/resources/shortages'),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  remove: (id) => api.delete(`/resources/${id}`),
};

export const hospitalService = {
  getAll: () => api.get('/hospitals'),
  getById: (id) => api.get(`/hospitals/${id}`),
  getWards: (id) => api.get(`/hospitals/${id}/wards`),
};

export const wardService = {
  getAll: () => api.get('/wards'),
  getById: (id) => api.get(`/wards/${id}`),
};

export const simulationService = {
  emergencyPatient: () => api.post('/simulation/emergency-patient'),
  occupyBed: () => api.post('/simulation/occupy-bed'),
  reserveBed: () => api.post('/simulation/reserve-bed'),
  dischargePatient: () => api.post('/simulation/discharge-patient'),
  cleanBed: () => api.post('/simulation/clean-bed'),
  ambulanceArrival: () => api.post('/simulation/ambulance-arrival'),
};

export const BedService = bedService;
export const PatientService = patientService;
export const ReservationService = reservationService;
export const userService = authService;
