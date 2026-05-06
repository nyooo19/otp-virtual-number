import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: windowMs,
  max: maxRequests,
  message: 'Terlalu banyak request, coba lagi nanti',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiKeyLimiter = (rateLimit_val, windowSeconds) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    max: rateLimit_val,
    message: 'Rate limit exceeded',
    standardHeaders: false,
    legacyHeaders: false,
  });
};