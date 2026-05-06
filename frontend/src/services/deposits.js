import api from './api.js';

export const depositService = {
  createDeposit: (amount, paymentGateway) => {
    return api.post('/api/deposits/create', { amount, payment_gateway: paymentGateway });
  },

  getDeposit: (depositId) => {
    return api.get(`/api/deposits/${depositId}`);
  },

  getDepositHistory: (page = 1, limit = 20) => {
    return api.get('/api/deposits/history', { params: { page, limit } });
  },
};