import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/database.js';
import { formatErrorResponse } from '../utils/formatter.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(
        formatErrorResponse('Token tidak ditemukan', 401)
      );
    }

    const decoded = verifyToken(token);
    
    // Check if user exists and not banned
    const users = await query('SELECT * FROM users WHERE id = ? AND is_banned = FALSE', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json(
        formatErrorResponse('User tidak ditemukan atau telah di-ban', 401)
      );
    }

    req.user = { ...decoded, ...users[0] };
    next();
  } catch (error) {
    return res.status(401).json(
      formatErrorResponse(error.message, 401)
    );
  }
};

export const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(
        formatErrorResponse('Token tidak ditemukan', 401)
      );
    }

    const decoded = verifyToken(token);
    
    // Check if admin exists and active
    const admins = await query('SELECT * FROM admins WHERE id = ? AND is_active = TRUE', [decoded.id]);
    
    if (admins.length === 0) {
      return res.status(401).json(
        formatErrorResponse('Admin tidak ditemukan atau tidak aktif', 401)
      );
    }

    req.admin = { ...decoded, ...admins[0] };
    next();
  } catch (error) {
    return res.status(401).json(
      formatErrorResponse(error.message, 401)
    );
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json(
        formatErrorResponse('Anda tidak memiliki akses ke resource ini', 403)
      );
    }
    next();
  };
};