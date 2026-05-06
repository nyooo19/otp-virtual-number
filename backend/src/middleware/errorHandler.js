import logger from '../config/logger.js';
import { formatErrorResponse } from '../utils/formatter.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.message === 'Validation Error') {
    return res.status(400).json(
      formatErrorResponse('Validation Error', 400, err.errors)
    );
  }

  if (err.message.includes('Token')) {
    return res.status(401).json(
      formatErrorResponse(err.message, 401)
    );
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json(
      formatErrorResponse(err.message, err.statusCode)
    );
  }

  return res.status(500).json(
    formatErrorResponse('Terjadi kesalahan di server', 500)
  );
};

export const notFoundHandler = (req, res) => {
  res.status(404).json(
    formatErrorResponse('Resource tidak ditemukan', 404)
  );
};