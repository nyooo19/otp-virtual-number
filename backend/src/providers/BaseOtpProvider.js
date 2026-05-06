export class BaseOtpProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async createOrder(phone, country, service, operator) {
    throw new Error('createOrder method must be implemented');
  }

  async getOrderStatus(orderId) {
    throw new Error('getOrderStatus method must be implemented');
  }

  async cancelOrder(orderId) {
    throw new Error('cancelOrder method must be implemented');
  }

  async resendOtp(orderId) {
    throw new Error('resendOtp method must be implemented');
  }

  async getBalance() {
    throw new Error('getBalance method must be implemented');
  }

  async listServices(country) {
    throw new Error('listServices method must be implemented');
  }
}