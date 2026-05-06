import { query } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateAdminToken } from '../utils/jwt.js';
import { formatResponse, formatErrorResponse } from '../utils/formatter.js';
import { generateReferralCode } from '../utils/helpers.js';
import logger from '../config/logger.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json(
          formatErrorResponse('Email atau username sudah terdaftar', 400)
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      const referralCode = generateReferralCode(Date.now());

      // Create user
      await query(
        'INSERT INTO users (username, email, password_hash, referral_code) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, referralCode]
      );

      logger.info('User registered', { email, username });

      return res.status(201).json(
        formatResponse(null, 'Registrasi berhasil, silakan login', 201)
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const users = await query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json(
          formatErrorResponse('Email atau password salah', 401)
        );
      }

      const user = users[0];

      // Check if banned
      if (user.is_banned) {
        return res.status(403).json(
          formatErrorResponse(`User telah di-ban. Alasan: ${user.banned_reason}`, 403)
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json(
          formatErrorResponse('Email atau password salah', 401)
        );
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      // Update last login
      await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      // Store session
      await query(
        'INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)',
        [user.id, token, req.ip, req.get('user-agent')]
      );

      logger.info('User logged in', { email });

      return res.json(
        formatResponse(
          {
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              balance: user.balance,
              referral_code: user.referral_code,
            },
          },
          'Login berhasil'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find admin
      const admins = await query(
        'SELECT * FROM admins WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (admins.length === 0) {
        return res.status(401).json(
          formatErrorResponse('Email atau password salah', 401)
        );
      }

      const admin = admins[0];

      // Verify password
      const isPasswordValid = await comparePassword(password, admin.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json(
          formatErrorResponse('Email atau password salah', 401)
        );
      }

      // Generate token
      const token = generateAdminToken({
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      });

      // Store session
      await query(
        'INSERT INTO admin_sessions (admin_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?)',
        [admin.id, token, req.ip, req.get('user-agent')]
      );

      logger.info('Admin logged in', { email });

      return res.json(
        formatResponse(
          {
            token,
            admin: {
              id: admin.id,
              username: admin.username,
              email: admin.email,
              role: admin.role,
            },
          },
          'Login berhasil'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);

      if (user.length === 0) {
        return res.status(404).json(
          formatErrorResponse('User tidak ditemukan', 404)
        );
      }

      return res.json(
        formatResponse({
          id: user[0].id,
          username: user[0].username,
          email: user[0].email,
          balance: user[0].balance,
          referral_code: user[0].referral_code,
          created_at: user[0].created_at,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await query(
          'UPDATE user_sessions SET is_active = FALSE WHERE token = ?',
          [token]
        );
      }

      logger.info('User logged out', { userId: req.user.id });

      return res.json(
        formatResponse(null, 'Logout berhasil')
      );
    } catch (error) {
      next(error);
    }
  }
}