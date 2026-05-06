import axios from 'axios';
import { BasePaymentGateway } from './BasePaymentGateway.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
import crypto from 'crypto';

dotenv.config();

const API_URL = process.env.TRIPAY_API_URL || 'https://api.tripay.co.id';
const API_KEY = process.env.TRIPAY_API_KEY;
const WEBHOOK_SECRET = process.env.TRIPAY_WEBHOOK_SECRET;

export class TripayGateway extends BasePaymentGateway {
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
      const response = await this.client.post('/api/v1/transaction/create', {
        method: 'QRIS',
        merchant_ref: orderId,
        amount: Math.round(amount),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: '',
        order_items: [
          {
            sku: 'DEPOSIT',
            name: 'Deposit Saldo',
            quantity: 1,
            price: Math.round(amount),
          },
        ],
        return_url: `${process.env.FRONTEND_URL}/deposits/callback`,
        expired_time: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        notes: `Deposit untuk user ${orderId}`,
      });

      logger.info('Tripay payment created', { paymentRef: response.data.data.reference });

      return {
        paymentId: response.data.data.reference,
        qrisUrl: response.data.data.qr_url,
        qrisString: response.data.data.qr_string,
        expiresAt: new Date(response.data.data.expired_time * 1000),
        amount: response.data.data.amount,
        status: 'pending',
      };
    } catch (error) {
      logger.error('Tripay create payment error', { error: error.message });
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentRef) {
    try {
      const response = await this.client.get(`/api/v1/transaction/detail/${paymentRef}`);
      
      const data = response.data.data;
      let status = 'pending';

      if (data.status === 'PAID') {
        status = 'success';
      } else if (data.status === 'EXPIRED') {
        status = 'expired';
      } else if (data.status === 'FAILED') {
        status = 'failed';
      }

      return {
        paymentId: data.reference,
        status: status,
        amount: data.amount,
        paidAmount: data.paid_amount,
        paidAt: data.paid_at ? new Date(data.paid_at * 1000) : null,
      };
    } catch (error) {
      logger.error('Tripay get payment status error', { error: error.message });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async cancelPayment(paymentRef) {
    try {
      await this.client.post(`/api/v1/transaction/cancel/${paymentRef}`);
      logger.info('Tripay payment cancelled', { paymentRef });
      return { success: true };
    } catch (error) {
      logger.error('Tripay cancel payment error', { error: error.message });
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  async refundPayment(paymentRef, amount) {
    try {
      await this.client.post(`/api/v1/transaction/refund/${paymentRef}`, {
        amount: Math.round(amount),
      });
      logger.info('Tripay payment refunded', { paymentRef, amount });
      return { success: true };
    } catch (error) {
      logger.error('Tripay refund payment error', { error: error.message });
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
      paymentRef: payload.reference,
      status: payload.status === 'PAID' ? 'success' : payload.status.toLowerCase(),
      amount: payload.amount,
      paidAmount: payload.paid_amount,
      merchantRef: payload.merchant_ref,
      paidAt: new Date(payload.paid_at * 1000),
    };
  }
}