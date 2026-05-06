import axios from 'axios';
import { BaseOtpProvider } from './BaseOtpProvider.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

const API_URL = process.env.NOKOSMURAH_API_URL || 'https://api.nokosmurah.com';

export class NokosmurahProvider extends BaseOtpProvider {
  constructor(apiKey) {
    super(apiKey);
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrder(phone, country, service, operator) {
    try {
      const response = await this.client.post('/api/order/create', {
        phone: phone,
        service: service,
        country: country,
        operator: operator,
      });

      logger.info('Nokosmurah order created', { orderId: response.data.order_id });
      
      return {
        orderId: response.data.order_id,
        phone: response.data.phone,
        status: 'pending',
        price: response.data.price,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Nokosmurah create order error', { error: error.message });
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/api/order/status/${orderId}`);
      
      let status = 'pending';
      let otp = null;

      if (response.data.status === 'completed') {
        status = 'received';
        otp = response.data.otp_code;
      } else if (response.data.status === 'expired') {
        status = 'expired';
      } else if (response.data.status === 'cancelled') {
        status = 'cancelled';
      }

      return {
        orderId: orderId,
        status: status,
        otp: otp,
        phone: response.data.phone,
      };
    } catch (error) {
      logger.error('Nokosmurah get order status error', { error: error.message });
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      await this.client.post(`/api/order/cancel/${orderId}`);
      logger.info('Nokosmurah order cancelled', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('Nokosmurah cancel order error', { error: error.message });
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      await this.client.post(`/api/order/resend/${orderId}`);
      logger.info('Nokosmurah OTP resent', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('Nokosmurah resend OTP error', { error: error.message });
      throw new Error(`Failed to resend OTP: ${error.message}`);
    }
  }

  async getBalance() {
    try {
      const response = await this.client.get('/api/user/balance');
      return {
        balance: response.data.balance,
        currency: 'IDR',
      };
    } catch (error) {
      logger.error('Nokosmurah get balance error', { error: error.message });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async listServices(country) {
    try {
      const response = await this.client.get(`/api/services?country=${country}`);
      return response.data || [];
    } catch (error) {
      logger.error('Nokosmurah list services error', { error: error.message });
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }
}