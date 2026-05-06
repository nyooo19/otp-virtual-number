import api from './api.js';

export const userService = {
  getDashboard: () => {
    return api.get('/api/user/dashboard');
  },

  getTransactions: (page = 1, limit = 20) => {
    return api.get('/api/user/transactions', { params: { page, limit } });
  },

  getOrders: (page = 1, limit = 20) => {
    return api.get('/api/user/orders', { params: { page, limit } });
  },

  getProfile: () => {
    return api.get('/api/user/profile');
  },

  updateProfile: (data) => {
    return api.patch('/api/user/profile', data);
  },
};