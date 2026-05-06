import axios from 'axios';
import { BasePaymentGateway } from './BasePaymentGateway.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
import crypto from 'crypto';

dotenv.config();

const API_URL = process.env.QRISPY_API_URL || 'https://api.qrispy.id';
const API_KEY = process.env.QRISPY_API_KEY;
const WEBHOOK_SECRET = process.env.QRISPY_WEBHOOK_SECRET;

export class QrisyGateway extends BasePaymentGateway {
  constructor() {
    super(API_KEY);
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createPayment(amount, orderId, customerEmail, customerName = 'User') {
    try {
      const response = await this.client.post('/api/v1/qris/create', {
        external_id: orderId,
        amount: Math.round(amount),
        customer: {
          email: customerEmail,
          name: customerName,
        },
        description: `Deposit untuk user ${orderId}`,
        expiry_time: 30, // minutes
      });

      logger.info('QRISPY payment created', { paymentRef: response.data.id });

      return {
        paymentId: response.data.id,
        qrisUrl: response.data.qr_image_url,
        qrisString: response.data.qr_string,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        amount: response.data.amount,
        status: 'pending',
      };
    } catch (error) {
      logger.error('QRISPY create payment error', { error: error.message });
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/api/v1/qris/${paymentId}`);
      
      const data = response.data;
      let status = 'pending';

      if (data.status === 'PAID' || data.status === 'success') {
        status = 'success';
      } else if (data.status === 'EXPIRED') {
        status = 'expired';
      } else if (data.status === 'FAILED' || data.status === 'failed') {
        status = 'failed';
      }

      return {
        paymentId: data.id,
        status: status,
        amount: data.amount,
        paidAmount: data.paid_amount || 0,
        paidAt: data.paid_at ? new Date(data.paid_at) : null,
      };
    } catch (error) {
      logger.error('QRISPY get payment status error', { error: error.message });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async cancelPayment(paymentId) {
    try {
      await this.client.post(`/api/v1/qris/${paymentId}/cancel`);
      logger.info('QRISPY payment cancelled', { paymentId });
      return { success: true };
    } catch (error) {
      logger.error('QRISPY cancel payment error', { error: error.message });
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  async refundPayment(paymentId, amount) {
    try {
      await this.client.post(`/api/v1/qris/${paymentId}/refund`, {
        amount: Math.round(amount),
      });
      logger.info('QRISPY payment refunded', { paymentId, amount });
      return { success: true };
    } catch (error) {
      logger.error('QRISPY refund payment error', { error: error.message });
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  parseWebhookPayload(payload) {
    return {
      paymentId: payload.id,
      status: payload.status === 'PAID' || payload.status === 'success' ? 'success' : payload.status.toLowerCase(),
      amount: payload.amount,
      paidAmount: payload.paid_amount || 0,
      externalId: payload.external_id,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : null,
    };
  }
}