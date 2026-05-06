import axios from 'axios';
import { BaseOtpProvider } from './BaseOtpProvider.js';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

const API_URL = process.env.HERO_SMS_API_URL || 'https://api.herosms.com';

export class HeroSmsProvider extends BaseOtpProvider {
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
      const response = await this.client.post('/api/v1/order/new', {
        number: phone,
        service: service,
        country: country,
        operator: operator,
      });

      logger.info('HeroSms order created', { orderId: response.data.id });
      
      return {
        orderId: response.data.id,
        phone: response.data.number,
        status: 'pending',
        price: response.data.price,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch (error) {
      logger.error('HeroSms create order error', { error: error.message });
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/api/v1/order/status/${orderId}`);
      
      let status = 'pending';
      let otp = null;

      if (response.data.status === 'received') {
        status = 'received';
        otp = response.data.code;
      } else if (response.data.status === 'expired') {
        status = 'expired';
      } else if (response.data.status === 'cancelled') {
        status = 'cancelled';
      }

      return {
        orderId: orderId,
        status: status,
        otp: otp,
        phone: response.data.number,
      };
    } catch (error) {
      logger.error('HeroSms get order status error', { error: error.message });
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      await this.client.post(`/api/v1/order/cancel/${orderId}`);
      logger.info('HeroSms order cancelled', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('HeroSms cancel order error', { error: error.message });
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      await this.client.post(`/api/v1/order/resend/${orderId}`);
      logger.info('HeroSms OTP resent', { orderId });
      return { success: true };
    } catch (error) {
      logger.error('HeroSms resend OTP error', { error: error.message });
      throw new Error(`Failed to resend OTP: ${error.message}`);
    }
  }

  async getBalance() {
    try {
      const response = await this.client.get('/api/v1/user/balance');
      return {
        balance: response.data.balance,
        currency: 'IDR',
      };
    } catch (error) {
      logger.error('HeroSms get balance error', { error: error.message });
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async listServices(country) {
    try {
      const response = await this.client.get(`/api/v1/services?country=${country}`);
      return response.data || [];
    } catch (error) {
      logger.error('HeroSms list services error', { error: error.message });
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }
}