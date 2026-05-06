import { query } from '../config/database.js';
import { formatResponse, formatErrorResponse } from '../utils/formatter.js';
import logger from '../config/logger.js';

export class UserController {
  static async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user data
      const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      const user = users[0];

      // Get order count
      const orders = await query(
        'SELECT COUNT(*) as total FROM otp_orders WHERE user_id = ?',
        [userId]
      );

      // Get deposit count
      const deposits = await query(
        'SELECT COUNT(*) as total, SUM(amount) as total_amount FROM deposits WHERE user_id = ? AND status = "success"',
        [userId]
      );

      // Get active orders
      const activeOrders = await query(
        'SELECT COUNT(*) as total FROM otp_orders WHERE user_id = ? AND status IN ("pending", "received")',
        [userId]
      );

      // Get recent transactions
      const transactions = await query(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      return res.json(
        formatResponse({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: parseFloat(user.balance),
          },
          stats: {
            total_orders: orders[0].total,
            total_deposits: deposits[0].total_amount || 0,
            active_orders: activeOrders[0].total,
          },
          recent_transactions: transactions,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const transactions = await query(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
        [userId]
      );

      return res.json(
        formatResponse({
          transactions,
          pagination: {
            page,
            limit,
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const orders = await query(`
        SELECT o.*, 
               s.code as service_code, s.name as service_name,
               c.code as country_code, c.name as country_name,
               op.code as operator_code, op.name as operator_name
        FROM otp_orders o
        JOIN otp_pricing op_p ON o.pricing_id = op_p.id
        JOIN otp_services s ON op_p.service_id = s.id
        JOIN countries c ON op_p.country_id = c.id
        JOIN operators op ON op_p.operator_id = op.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      const countResult = await query(
        'SELECT COUNT(*) as total FROM otp_orders WHERE user_id = ?',
        [userId]
      );

      return res.json(
        formatResponse({
          orders,
          pagination: {
            page,
            limit,
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit),
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const users = await query(
        'SELECT id, username, email, balance, referral_code, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      return res.json(
        formatResponse(users[0])
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { username } = req.body;

      if (username) {
        // Check if username is unique
        const existing = await query(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );

        if (existing.length > 0) {
          return res.status(400).json(
            formatErrorResponse('Username sudah digunakan', 400)
          );
        }

        await query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
      }

      logger.info('User profile updated', { userId });

      return res.json(
        formatResponse(null, 'Profile berhasil diupdate')
      );
    } catch (error) {
      next(error);
    }
  }
}