export class BasePaymentGateway {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async createPayment(amount, orderId, customerEmail) {
    throw new Error('createPayment method must be implemented');
  }

  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus method must be implemented');
  }

  async cancelPayment(paymentId) {
    throw new Error('cancelPayment method must be implemented');
  }

  async refundPayment(paymentId, amount) {
    throw new Error('refundPayment method must be implemented');
  }

  async verifyWebhookSignature(payload, signature) {
    throw new Error('verifyWebhookSignature method must be implemented');
  }
}