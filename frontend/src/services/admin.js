import api from './api.js';

export const adminService = {
  getDashboard: () => {
    return api.get('/api/admin/dashboard');
  },

  getUsers: (page = 1, limit = 20) => {
    return api.get('/api/admin/users', { params: { page, limit } });
  },

  banUser: (userId, reason) => {
    return api.patch(`/api/admin/users/${userId}/ban`, { reason });
  },

  unbanUser: (userId) => {
    return api.patch(`/api/admin/users/${userId}/unban`);
  },

  adjustBalance: (userId, amount, type, reason) => {
    return api.patch(`/api/admin/users/${userId}/balance`, { amount, type, reason });
  },

  getOrders: (page = 1, limit = 20) => {
    return api.get('/api/admin/orders', { params: { page, limit } });
  },

  getDeposits: (page = 1, limit = 20) => {
    return api.get('/api/admin/deposits', { params: { page, limit } });
  },

  getServices: () => {
    return api.get('/api/admin/services');
  },

  createService: (data) => {
    return api.post('/api/admin/services', data);
  },

  updateService: (serviceId, data) => {
    return api.put(`/api/admin/services/${serviceId}`, data);
  },

  deleteService: (serviceId) => {
    return api.delete(`/api/admin/services/${serviceId}`);
  },

  getSettings: () => {
    return api.get('/api/admin/settings');
  },

  updateSettings: (settings) => {
    return api.put('/api/admin/settings', settings);
  },
};