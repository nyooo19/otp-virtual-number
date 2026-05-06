import api from './api.js';

export const otpService = {
  getCountries: () => {
    return api.get('/api/otp/countries');
  },

  getServices: () => {
    return api.get('/api/otp/services');
  },

  getOperators: (countryId) => {
    return api.get(`/api/otp/operators?country_id=${countryId}`);
  },

  getPricing: (countryId, serviceId, operatorId) => {
    return api.get('/api/otp/pricing', {
      params: { country_id: countryId, service_id: serviceId, operator_id: operatorId },
    });
  },

  createOrder: (countryId, serviceId, operatorId) => {
    return api.post('/api/otp/order', { country_id: countryId, service_id: serviceId, operator_id: operatorId });
  },

  getOrder: (orderId) => {
    return api.get(`/api/otp/order/${orderId}`);
  },

  cancelOrder: (orderId) => {
    return api.post(`/api/otp/order/${orderId}/cancel`);
  },

  resendOtp: (orderId) => {
    return api.post(`/api/otp/order/${orderId}/resend`);
  },
};