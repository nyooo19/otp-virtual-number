import axios from 'axios';
import { BaseOtpProvider } from './BaseOtpProvider.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

const API_URL = process.env.FIVESIM_API_URL || 'https://api.5sim.net';

export class FivesimProvider extends BaseOtpProvider {
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
      const response = await this.client.post('/api/v1/order/create', {
        phone: phone,
        product_id: `${country}:${operator}:${service}`,
      });

      logger.info('5Sim order created', { orderId: response.data.id });
      
      return {
        orderId: response.data.id,
        phone: response.data.phone,
        status: 'pending',
        price: response.data.price,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch (error) {
      logger.error('5Sim create order error', { error: error.message });
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/api/v1/order/status?id=${orderId}`);
      
      let status = 'pending';
      let otp = null;

      if (response.data.status === 'received') {
        status = 'received';
        otp = response.data.sms;
      } else if (response.data.status === 'timeout') {
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
      logger.error('5Sim get order status error', { error: error.message });
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      await this.client.post(`/api/v1/order/cancel?id=${orderId}`);
      logger.info('5Sim order cancelled', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('5Sim cancel order error', { error: error.message });
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      await this.client.post(`/api/v1/order/resend?id=${orderId}`);
      logger.info('5Sim OTP resent', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('5Sim resend OTP error', { error: error.message });
      throw new Error(`Failed to resend OTP: ${error.message}`);
    }
  }

  async getBalance() {
    try {
      const response = await this.client.get('/api/v1/user/profile');
      return {
        balance: response.data.balance,
        currency: 'USD',
      };
    } catch (error) {
      logger.error('5Sim get balance error', { error: error.message });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async listServices(country) {
    try {
      const response = await this.client.get(`/api/v1/products/list?country=${country}`);
      return response.data || [];
    } catch (error) {
      logger.error('5Sim list services error', { error: error.message });
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }
}