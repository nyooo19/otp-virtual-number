import { query, getConnection } from '../config/database.js';
import { formatResponse, formatErrorResponse } from '../utils/formatter.js';
import { hashPassword } from '../utils/hash.js';
import logger from '../config/logger.js';

export class AdminController {
  static async getDashboard(req, res, next) {
    try {
      // Total users
      const userStats = await query('SELECT COUNT(*) as total, SUM(balance) as total_balance FROM users WHERE is_banned = FALSE');
      
      // Total orders today
      const ordersToday = await query(
        'SELECT COUNT(*) as total, SUM(price) as total_revenue FROM otp_orders WHERE DATE(created_at) = CURDATE()'
      );
      
      // Total deposits today
      const depositsToday = await query(
        'SELECT COUNT(*) as total, SUM(amount) as total_amount FROM deposits WHERE DATE(created_at) = CURDATE() AND status = "success"'
      );
      
      // Pending deposits
      const pendingDeposits = await query(
        'SELECT COUNT(*) as total FROM deposits WHERE status = "pending" AND expires_at > NOW()'
      );
      
      // Revenue this month
      const monthlyRevenue = await query(
        'SELECT SUM(price) as total FROM otp_orders WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())'
      );
      
      // Active orders
      const activeOrders = await query(
        'SELECT COUNT(*) as total FROM otp_orders WHERE status IN ("pending", "received")'
      );
      
      // Recent transactions
      const recentTransactions = await query(
        'SELECT u.username, t.type, t.amount, t.created_at FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 10'
      );

      return res.json(
        formatResponse({
          stats: {
            total_users: userStats[0].total,
            total_user_balance: userStats[0].total_balance || 0,
            orders_today: ordersToday[0].total,
            revenue_today: ordersToday[0].total_revenue || 0,
            deposits_today: depositsToday[0].total,
            deposits_amount_today: depositsToday[0].total_amount || 0,
            pending_deposits: pendingDeposits[0].total,
            monthly_revenue: monthlyRevenue[0].total || 0,
            active_orders: activeOrders[0].total,
          },
          recent_transactions: recentTransactions,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';
      const offset = (page - 1) * limit;

      const searchQuery = search ? `WHERE username LIKE ? OR email LIKE ?` : '';
      const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];

      const users = await query(`
        SELECT id, username, email, balance, is_banned, created_at FROM users
        ${searchQuery}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, params);

      const countParams = search ? [`%${search}%`, `%${search}%`] : [];
      const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${searchQuery}`,
        countParams
      );

      return res.json(
        formatResponse({
          users,
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

  static async banUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      await query(
        'UPDATE users SET is_banned = TRUE, banned_reason = ?, banned_at = NOW() WHERE id = ?',
        [reason || 'Alasan tidak disebutkan', userId]
      );

      logger.info('User banned', { userId, reason, adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'User berhasil di-ban')
      );
    } catch (error) {
      next(error);
    }
  }

  static async unbanUser(req, res, next) {
    try {
      const { userId } = req.params;

      await query(
        'UPDATE users SET is_banned = FALSE, banned_reason = NULL, banned_at = NULL WHERE id = ?',
        [userId]
      );

      logger.info('User unbanned', { userId, adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'User berhasil di-unban')
      );
    } catch (error) {
      next(error);
    }
  }

  static async adjustBalance(req, res, next) {
    const connection = await getConnection();
    try {
      const { userId } = req.params;
      const { amount, type, reason } = req.body;

      await connection.beginTransaction();

      const users = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
      if (users[0].length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      const balanceBefore = parseFloat(users[0][0].balance);
      let balanceAfter = balanceBefore;

      if (type === 'add') {
        balanceAfter = balanceBefore + amount;
      } else if (type === 'reduce') {
        balanceAfter = balanceBefore - amount;
        if (balanceAfter < 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json(
            formatErrorResponse('Saldo akan negatif', 400)
          );
        }
      }

      await connection.query(
        'UPDATE users SET balance = ? WHERE id = ?',
        [balanceAfter, userId]
      );

      const transactionType = type === 'add' ? 'manual_add' : 'manual_reduce';
      await connection.query(`
        INSERT INTO transactions
        (user_id, type, amount, balance_before, balance_after, reference_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, transactionType, amount, balanceBefore, balanceAfter, 'admin_action', reason]);

      await connection.commit();
      connection.release();

      logger.info('User balance adjusted', { userId, type, amount, reason, adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'Saldo user berhasil diupdate')
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      next(error);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const offset = (page - 1) * limit;

      const statusFilter = status ? 'WHERE o.status = ?' : '';
      const params = status ? [status, limit, offset] : [limit, offset];

      const orders = await query(`
        SELECT o.*, u.username, s.name as service_name, c.name as country_name
        FROM otp_orders o
        JOIN users u ON o.user_id = u.id
        JOIN otp_pricing p ON o.pricing_id = p.id
        JOIN otp_services s ON p.service_id = s.id
        JOIN countries c ON p.country_id = c.id
        ${statusFilter}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, params);

      const countParams = status ? [status] : [];
      const countResult = await query(
        `SELECT COUNT(*) as total FROM otp_orders ${statusFilter}`,
        countParams
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

  static async getDeposits(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      const offset = (page - 1) * limit;

      const statusFilter = status ? 'WHERE d.status = ?' : '';
      const params = status ? [status, limit, offset] : [limit, offset];

      const deposits = await query(`
        SELECT d.*, u.username, u.email
        FROM deposits d
        JOIN users u ON d.user_id = u.id
        ${statusFilter}
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `, params);

      const countParams = status ? [status] : [];
      const countResult = await query(
        `SELECT COUNT(*) as total FROM deposits ${statusFilter}`,
        countParams
      );

      return res.json(
        formatResponse({
          deposits,
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

  static async getServices(req, res, next) {
    try {
      const services = await query('SELECT * FROM otp_services ORDER BY category');
      return res.json(formatResponse(services));
    } catch (error) {
      next(error);
    }
  }

  static async createService(req, res, next) {
    try {
      const { code, name, description, category, is_active } = req.body;

      const result = await query(
        'INSERT INTO otp_services (code, name, description, category, is_active) VALUES (?, ?, ?, ?, ?)',
        [code, name, description || '', category, is_active !== false]
      );

      logger.info('Service created', { code, name, adminId: req.admin.id });

      return res.status(201).json(
        formatResponse({ id: result.insertId }, 'Service berhasil dibuat', 201)
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req, res, next) {
    try {
      const { serviceId } = req.params;
      const { code, name, description, category, is_active } = req.body;

      await query(
        'UPDATE otp_services SET code = ?, name = ?, description = ?, category = ?, is_active = ? WHERE id = ?',
        [code, name, description || '', category, is_active, serviceId]
      );

      logger.info('Service updated', { serviceId, adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'Service berhasil diupdate')
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteService(req, res, next) {
    try {
      const { serviceId } = req.params;

      await query('DELETE FROM otp_services WHERE id = ?', [serviceId]);

      logger.info('Service deleted', { serviceId, adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'Service berhasil dihapus')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req, res, next) {
    try {
      const settings = await query('SELECT * FROM settings');
      
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.setting_key] = s.setting_value;
      });

      return res.json(formatResponse(settingsObj));
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(req.body)) {
        await connection.query(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, String(value)]
        );
      }

      await connection.commit();
      connection.release();

      logger.info('Settings updated', { adminId: req.admin.id });

      return res.json(
        formatResponse(null, 'Settings berhasil diupdate')
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      next(error);
    }
  }
}