import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_ADMIN_EXPIRE = process.env.JWT_ADMIN_EXPIRE || '30d';

export const generateToken = (payload, options = {}) => {
  const expiresIn = options.expiresIn || JWT_EXPIRE;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const generateAdminToken = (payload, options = {}) => {
  const expiresIn = options.expiresIn || JWT_ADMIN_EXPIRE;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token telah kadaluarsa');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token tidak valid');
    }
    throw error;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};

export const refreshToken = (oldToken) => {
  const decoded = decodeToken(oldToken);
  if (!decoded) {
    throw new Error('Token tidak valid');
  }
  
  const { id, email, username, role } = decoded;
  return generateToken({ id, email, username, role });
};