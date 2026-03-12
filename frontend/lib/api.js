import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  loginWithPhone: (credentials) => api.post('/auth/login-phone', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Vehicle API
export const vehicleAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { currentStatus: status }),
  getStats: () => api.get('/vehicles/stats'),
  uploadDocument: (id, formData) => api.post(`/vehicles/${id}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (id, documentType) => api.delete(`/vehicles/${id}/delete-document/${documentType}`),
};

// Fleet Owner API
export const fleetOwnerAPI = {
  getAll: (params) => api.get('/fleet-owners', { params }),
  getById: (id) => api.get(`/fleet-owners/${id}`),
  getStatement: (id) => api.get(`/fleet-owners/${id}/statement`),
  create: (data) => api.post('/fleet-owners', data),
  update: (id, data) => api.put(`/fleet-owners/${id}`, data),
  delete: (id) => api.delete(`/fleet-owners/${id}`),
  getVehicles: (id) => api.get(`/fleet-owners/${id}/vehicles`),
};

// Driver API
export const driverAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getStats: () => api.get('/drivers/stats'),
  uploadDocument: (id, formData) => api.post(`/drivers/${id}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (id, documentType) => api.delete(`/drivers/${id}/delete-document/${documentType}`),
};

// Client API
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  getStatement: (id) => api.get(`/clients/${id}/statement`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
};

// Trip API
export const tripAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  updateStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }),
  updateActualPod: (id, actualPodAmt, paymentType, notes) => 
    api.patch(`/trips/${id}/actual-pod`, { actualPodAmt, paymentType, notes }),
  getStats: () => api.get('/trips/stats'),
};

// City API
export const cityAPI = {
  getAll: (params) => api.get('/cities', { params }),
  getById: (id) => api.get(`/cities/${id}`),
  create: (data) => api.post('/cities', data),
};

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getByVehicle: (vehicleId, params) => api.get(`/expenses/vehicle/${vehicleId}`, { params }),
  getStats: (params) => api.get('/expenses/stats', { params }),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Activity Logs API
export const logsAPI = {
  getAll: (params) => api.get('/logs', { params }),
  getRecent: (limit) => api.get('/logs/recent', { params: { limit } }),
  getStats: (params) => api.get('/logs/stats', { params }),
  getByUser: (userId, limit) => api.get(`/logs/user/${userId}`, { params: { limit } }),
  getByModule: (module, limit) => api.get(`/logs/module/${module}`, { params: { limit } }),
  export: (params) => api.get('/logs/export', { params, responseType: 'blob' }),
  cleanup: (days) => api.delete('/logs/cleanup', { params: { days } }),
};

// Reports API
export const reportsAPI = {
  getReports: () => api.get('/reports'),
  getProfitBreakdown: () => api.get('/reports/profit-breakdown'),
  getMaintenanceCosts: () => api.get('/reports/maintenance'),
  getPODReports: (params) => api.get('/reports/pods', { params }),
  getClientPendingReport: () => api.get('/reports/client-pending'),
  getFleetPendingReport: () => api.get('/reports/fleet-pending'),
};

// Trip Expense API
export const tripExpenseAPI = {
  create: (data) => api.post('/trip-expenses', data),
  getByTrip: (tripId) => api.get(`/trip-expenses/trip/${tripId}`),
  delete: (id) => api.delete(`/trip-expenses/${id}`),
};

// Trip Advance API
export const tripAdvanceAPI = {
  create: (data) => api.post('/trip-advances', data),
  getByTrip: (tripId) => api.get(`/trip-advances/trip/${tripId}`),
  delete: (id) => api.delete(`/trip-advances/${id}`),
};

// Client Payment API
export const clientPaymentAPI = {
  create: (data) => api.post('/client-payments', data),
  getByTripAndClient: (tripId, clientId) => api.get(`/client-payments/trip/${tripId}/client/${clientId}`),
  delete: (id) => api.delete(`/client-payments/${id}`),
};

// Client Expense API
export const clientExpenseAPI = {
  create: (data) => api.post('/client-expenses', data),
  getByTripAndClient: (tripId, clientId) => api.get(`/client-expenses/trip/${tripId}/client/${clientId}`),
  delete: (id) => api.delete(`/client-expenses/${id}`),
};

// Collection Memo API
export const collectionMemoAPI = {
  create: (data) => api.post('/collection-memos', data),
  update: (id, data) => api.put(`/collection-memos/${id}`, data),
  getByTrip: (tripId) => api.get(`/collection-memos/trip/${tripId}`),
  getById: (id) => api.get(`/collection-memos/${id}`),
  delete: (id) => api.delete(`/collection-memos/${id}`),
};

// Balance Memo API
export const balanceMemoAPI = {
  create: (data) => api.post('/balance-memos', data),
  update: (id, data) => api.put(`/balance-memos/${id}`, data),
  getByTrip: (tripId) => api.get(`/balance-memos/trip/${tripId}`),
  getById: (id) => api.get(`/balance-memos/${id}`),
  delete: (id) => api.delete(`/balance-memos/${id}`),
};




// Client POD API
export const clientPODAPI = {
  create: (data) => api.post('/client-pods', data),
  update: (id, data) => api.put(`/client-pods/${id}`, data),
  getByTripAndClient: (tripId, clientId) => api.get(`/client-pods/trip/${tripId}/client/${clientId}`),
  getById: (id) => api.get(`/client-pods/${id}`),
  delete: (id) => api.delete(`/client-pods/${id}`),
  deleteDocument: (podId, documentId) => api.delete(`/client-pods/${podId}/document/${documentId}`),
  uploadDocument: (id, formData) => api.post(`/client-pods/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Adjustment Payment API
export const adjustmentPaymentAPI = {
  create: (data) => api.post('/adjustment-payments', data),
  getByTripAndClient: (tripId, clientId) => api.get(`/adjustment-payments/trip/${tripId}/client/${clientId}`),
  getByClient: (clientId) => api.get(`/adjustment-payments/client/${clientId}`),
  delete: (id) => api.delete(`/adjustment-payments/${id}`),
};

// Driver Calculation API
export const driverCalculationAPI = {
  create: (data) => api.post('/driver-calculations', data),
  getByDriver: (driverId) => api.get(`/driver-calculations/driver/${driverId}`),
  getById: (id) => api.get(`/driver-calculations/${id}`),
  update: (id, data) => api.put(`/driver-calculations/${id}`, data),
  delete: (id) => api.delete(`/driver-calculations/${id}`),
};

// User API (for sub-admin management)
export const userAPI = {
  getAll: () => api.get('/auth/users'),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  delete: (id) => api.delete(`/auth/users/${id}`),
};
