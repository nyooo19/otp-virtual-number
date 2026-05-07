import { query, getConnection } from '../config/database.js';
import { formatResponse, formatErrorResponse } from '../utils/formatter.js';
import { PaymentGatewayFactory } from '../payments/PaymentGatewayFactory.js';
import { generateTransactionId } from '../utils/helpers.js';
import logger from '../config/logger.js';

export class DepositController {
  static async createDeposit(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, payment_gateway } = req.body;

      const MIN_DEPOSIT = parseInt(process.env.MIN_DEPOSIT_AMOUNT || '10000');
      if (amount < MIN_DEPOSIT) {
        return res.status(400).json(
          formatErrorResponse(`Minimal deposit ${MIN_DEPOSIT}`, 400)
        );
      }

      // Get payment gateway
      const gateway = PaymentGatewayFactory.getGateway(payment_gateway);

      // Get user data
      const users = await query('SELECT email, username FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      const user = users[0];

      // Create payment
      const payment = await gateway.createPayment(
        amount,
        generateTransactionId(),
        user.email,
        user.username
      );

      // Store deposit in database
      await query(`
        INSERT INTO deposits 
        (user_id, transaction_id, amount, status, payment_gateway, gateway_reference, qris_url, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, payment.paymentId, amount, 'pending', payment_gateway, payment.paymentId, payment.qrisUrl, payment.expiresAt]);

      logger.info('Deposit created', { userId, amount, paymentId: payment.paymentId });

      return res.status(201).json(
        formatResponse({
          payment_id: payment.paymentId,
          qris_url: payment.qrisUrl,
          qris_string: payment.qrisString,
          amount: amount,
          expires_at: payment.expiresAt,
        }, 'Deposit berhasil dibuat', 201)
      );
    } catch (error) {
      next(error);
    }
  }

  static async getDeposit(req, res, next) {
    try {
      const { depositId } = req.params;
      const userId = req.user.id;

      const deposits = await query(
        'SELECT * FROM deposits WHERE id = ? AND user_id = ?',
        [depositId, userId]
      );

      if (deposits.length === 0) {
        return res.status(404).json(
          formatErrorResponse('Deposit tidak ditemukan', 404)
        );
      }

      return res.json(formatResponse(deposits[0]));
    } catch (error) {
      next(error);
    }
  }

  static async getDepositHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const deposits = await query(
        'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      const countResult = await query(
        'SELECT COUNT(*) as total FROM deposits WHERE user_id = ?',
        [userId]
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

  static async webhookTripay(req, res, next) {
    const connection = await getConnection();
    try {
      const { TripayGateway } = await import('../payments/TripayGateway.js');
      const gateway = new TripayGateway();

      // Verify signature
      const signature = req.headers['x-webhook-signature'];
      if (!gateway.verifyWebhookSignature(req.body, signature)) {
        return res.status(401).json(
          formatErrorResponse('Webhook signature tidak valid', 401)
        );
      }

      const payload = gateway.parseWebhookPayload(req.body);

      // Begin transaction
      await connection.beginTransaction();

      // Find deposit
      const deposits = await connection.query(
        'SELECT * FROM deposits WHERE gateway_reference = ?',
        [payload.paymentRef]
      );

      if (deposits.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json(
          formatErrorResponse('Deposit tidak ditemukan', 404)
        );
      }

      const deposit = deposits[0][0];
      const userId = deposit.user_id;

      if (payload.status === 'success') {
        // Update deposit status
        await connection.query(
          'UPDATE deposits SET status = ?, paid_at = NOW() WHERE id = ?',
          ['success', deposit.id]
        );

        // Add balance to user
        await connection.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [deposit.amount, userId]
        );

        // Create transaction record
        const users = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
        const newBalance = parseFloat(users[0][0].balance);

        await connection.query(`
          INSERT INTO transactions 
          (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, 'deposit', deposit.amount, newBalance - deposit.amount, newBalance, deposit.id, 'deposit', `Deposit via ${payload.paymentRef}`]);
      } else if (payload.status === 'failed' || payload.status === 'expired') {
        await connection.query(
          'UPDATE deposits SET status = ? WHERE id = ?',
          [payload.status, deposit.id]
        );
      }

      await connection.commit();
      connection.release();

      logger.info('Tripay webhook processed', { depositId: deposit.id, status: payload.status });

      return res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      connection.release();
      logger.error('Tripay webhook error', { error: error.message });
      next(error);
    }
  }

  static async webhookQrispy(req, res, next) {
    const connection = await getConnection();
    try {
      const { QrisyGateway } = await import('../payments/QrisyGateway.js');
      const gateway = new QrisyGateway();

      // Verify signature
      const signature = req.headers['x-webhook-signature'];
      if (!gateway.verifyWebhookSignature(req.body, signature)) {
        return res.status(401).json(
          formatErrorResponse('Webhook signature tidak valid', 401)
        );
      }

      const payload = gateway.parseWebhookPayload(req.body);

      // Begin transaction
      await connection.beginTransaction();

      // Find deposit
      const deposits = await connection.query(
        'SELECT * FROM deposits WHERE gateway_reference = ?',
        [payload.paymentId]
      );

      if (deposits.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json(
          formatErrorResponse('Deposit tidak ditemukan', 404)
        );
      }

      const deposit = deposits[0][0];
      const userId = deposit.user_id;

      if (payload.status === 'success') {
        // Update deposit status
        await connection.query(
          'UPDATE deposits SET status = ?, paid_at = NOW() WHERE id = ?',
          ['success', deposit.id]
        );

        // Add balance to user
        await connection.query(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [deposit.amount, userId]
        );

        // Create transaction record
        const users = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
        const newBalance = parseFloat(users[0][0].balance);

        await connection.query(`
          INSERT INTO transactions 
          (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, 'deposit', deposit.amount, newBalance - deposit.amount, newBalance, deposit.id, 'deposit', `Deposit via ${payload.paymentId}`]);
      } else if (payload.status === 'failed' || payload.status === 'expired') {
        await connection.query(
          'UPDATE deposits SET status = ? WHERE id = ?',
          [payload.status, deposit.id]
        );
      }

      await connection.commit();
      connection.release();

      logger.info('QRISPY webhook processed', { depositId: deposit.id, status: payload.status });

      return res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      connection.release();
      logger.error('QRISPY webhook error', { error: error.message });
      next(error);
    }
  }
}