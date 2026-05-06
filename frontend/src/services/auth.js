import api from './api.js';

export const authService = {
  register: (username, email, password) => {
    return api.post('/api/auth/register', { username, email, password });
  },

  login: (email, password) => {
    return api.post('/api/auth/login', { email, password });
  },

  getMe: () => {
    return api.get('/api/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  adminLogin: (email, password) => {
    return api.post('/api/admin/login', { email, password });
  },
};