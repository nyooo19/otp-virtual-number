import { query, getConnection } from '../config/database.js';
import { formatResponse, formatErrorResponse } from '../utils/formatter.js';
import { OtpProviderFactory } from '../providers/OtpProviderFactory.js';
import logger from '../config/logger.js';

export class OtpController {
  static async getCountries(req, res, next) {
    try {
      const countries = await query('SELECT * FROM countries WHERE is_active = TRUE');
      return res.json(formatResponse(countries));
    } catch (error) {
      next(error);
    }
  }

  static async getServices(req, res, next) {
    try {
      const services = await query('SELECT * FROM otp_services WHERE is_active = TRUE');
      return res.json(formatResponse(services));
    } catch (error) {
      next(error);
    }
  }

  static async getOperators(req, res, next) {
    try {
      const { country_id } = req.query;

      if (!country_id) {
        return res.status(400).json(
          formatErrorResponse('country_id diperlukan', 400)
        );
      }

      const operators = await query(
        'SELECT * FROM operators WHERE country_id = ? AND is_active = TRUE',
        [country_id]
      );

      return res.json(formatResponse(operators));
    } catch (error) {
      next(error);
    }
  }

  static async getPricing(req, res, next) {
    try {
      const { country_id, service_id, operator_id } = req.query;

      if (!country_id || !service_id || !operator_id) {
        return res.status(400).json(
          formatErrorResponse('country_id, service_id, dan operator_id diperlukan', 400)
        );
      }

      const pricing = await query(`
        SELECT p.*, 
               s.name as service_name,
               c.name as country_name,
               o.name as operator_name
        FROM otp_pricing p
        JOIN otp_services s ON p.service_id = s.id
        JOIN countries c ON p.country_id = c.id
        JOIN operators o ON p.operator_id = o.id
        WHERE p.country_id = ? AND p.service_id = ? AND p.operator_id = ? AND p.is_active = TRUE
      `, [country_id, service_id, operator_id]);

      if (pricing.length === 0) {
        return res.status(404).json(
          formatErrorResponse('Pricing tidak ditemukan', 404)
        );
      }

      return res.json(formatResponse(pricing[0]));
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req, res, next) {
    const connection = await getConnection();
    try {
      const userId = req.user.id;
      const { country_id, service_id, operator_id } = req.body;

      // Get user balance
      const users = await query('SELECT balance FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      const userBalance = parseFloat(users[0].balance);

      // Get pricing
      const pricing = await query(`
        SELECT p.*, s.code as service_code, o.code as operator_code, prov.code as provider_code
        FROM otp_pricing p
        JOIN otp_services s ON p.service_id = s.id
        JOIN operators o ON p.operator_id = o.id
        JOIN otp_providers prov ON prov.id = 1
        WHERE p.country_id = ? AND p.service_id = ? AND p.operator_id = ? AND p.is_active = TRUE
      `, [country_id, service_id, operator_id]);

      if (pricing.length === 0) {
        return res.status(404).json(
          formatErrorResponse('Pricing tidak ditemukan', 404)
        );
      }

      const price = parseFloat(pricing[0].sell_price);

      if (userBalance < price) {
        return res.status(400).json(
          formatErrorResponse('Saldo tidak cukup', 400)
        );
      }

      // Check active orders limit
      const activeOrders = await query(
        'SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND status IN ("pending", "received")',
        [userId]
      );

      const MAX_ACTIVE_ORDERS = parseInt(process.env.MAX_ACTIVE_ORDERS || '5');
      if (activeOrders[0].count >= MAX_ACTIVE_ORDERS) {
        return res.status(400).json(
          formatErrorResponse(`Maksimal ${MAX_ACTIVE_ORDERS} order aktif`, 400)
        );
      }

      // Get provider and create order
      const provider = OtpProviderFactory.getProvider(pricing[0].provider_code);
      const providerOrder = await provider.createOrder(
        '1234567890', // Phone number placeholder
        pricing[0].country_id,
        pricing[0].service_code,
        pricing[0].operator_code
      );

      // Begin transaction
      await connection.beginTransaction();

      // Create order in database
      await connection.query(`
        INSERT INTO otp_orders 
        (user_id, pricing_id, provider_order_id, status, price, provider_name, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, pricing[0].id, providerOrder.orderId, 'pending', price, pricing[0].provider_code, providerOrder.expiresAt]);

      const orders = await connection.query('SELECT LAST_INSERT_ID() as id');
      const orderId = orders[0][0].id;

      // Deduct balance
      await connection.query(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [price, userId]
      );

      // Create transaction record
      await connection.query(`
        INSERT INTO transactions 
        (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'order', price, userBalance, userBalance - price, orderId, 'otp_order', `Order OTP #${orderId}`]);

      await connection.commit();
      connection.release();

      logger.info('OTP order created', { orderId, userId, price });

      return res.status(201).json(
        formatResponse({ id: orderId, status: 'pending', price }, 'Order berhasil dibuat', 201)
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      next(error);
    }
  }

  static async getOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const orders = await query(`
        SELECT o.*, 
               s.name as service_name,
               c.name as country_name,
               op.name as operator_name
        FROM otp_orders o
        JOIN otp_pricing p ON o.pricing_id = p.id
        JOIN otp_services s ON p.service_id = s.id
        JOIN countries c ON p.country_id = c.id
        JOIN operators op ON p.operator_id = op.id
        WHERE o.id = ? AND o.user_id = ?
      `, [orderId, userId]);

      if (orders.length === 0) {
        return res.status(404).json(
          formatErrorResponse('Order tidak ditemukan', 404)
        );
      }

      return res.json(formatResponse(orders[0]));
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req, res, next) {
    const connection = await getConnection();
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const orders = await query(
        'SELECT * FROM otp_orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json(
          formatErrorResponse('Order tidak ditemukan', 404)
        );
      }

      const order = orders[0];

      if (!['pending', 'received'].includes(order.status)) {
        return res.status(400).json(
          formatErrorResponse('Order tidak dapat dibatalkan', 400)
        );
      }

      // Cancel with provider
      try {
        const provider = OtpProviderFactory.getProvider(order.provider_name);
        await provider.cancelOrder(order.provider_order_id);
      } catch (error) {
        logger.warn('Failed to cancel with provider', { error: error.message });
      }

      // Begin transaction
      await connection.beginTransaction();

      // Update order status
      await connection.query(
        'UPDATE otp_orders SET status = ? WHERE id = ?',
        ['cancelled', orderId]
      );

      // Refund balance
      await connection.query(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [order.price, userId]
      );

      // Create refund transaction
      const users = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
      const newBalance = parseFloat(users[0][0].balance);

      await connection.query(`
        INSERT INTO transactions 
        (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'refund', order.price, newBalance - order.price, newBalance, orderId, 'otp_order', `Refund Order OTP #${orderId}`]);

      await connection.commit();
      connection.release();

      logger.info('OTP order cancelled', { orderId, userId });

      return res.json(
        formatResponse(null, 'Order berhasil dibatalkan')
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      next(error);
    }
  }
}