import { query } from '../config/database.js';
import { formatErrorResponse } from '../utils/formatter.js';
import crypto from 'crypto';

export const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json(
        formatErrorResponse('API Key tidak ditemukan', 401)
      );
    }

    const keys = await query(
      'SELECT * FROM reseller_api_keys WHERE api_key = ? AND is_active = TRUE',
      [apiKey]
    );

    if (keys.length === 0) {
      return res.status(401).json(
        formatErrorResponse('API Key tidak valid', 401)
      );
    }

    const apiKeyData = keys[0];

    // Check IP whitelist if configured
    if (apiKeyData.whitelist_ips) {
      const whitelist = JSON.parse(apiKeyData.whitelist_ips);
      const clientIp = req.ip;
      if (!whitelist.includes(clientIp)) {
        return res.status(403).json(
          formatErrorResponse('IP tidak dalam whitelist', 403)
        );
      }
    }

    req.apiKey = apiKeyData;
    req.apiKeyId = apiKeyData.id;
    req.userId = apiKeyData.user_id;
    next();
  } catch (error) {
    return res.status(500).json(
      formatErrorResponse(error.message, 500)
    );
  }
};

export const verifyWebhookSignature = (secret) => {
  return (req, res, next) => {
    try {
      const signature = req.headers['x-webhook-signature'];
      if (!signature) {
        return res.status(401).json(
          formatErrorResponse('Webhook signature tidak ditemukan', 401)
        );
      }

      const hash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
        return res.status(401).json(
          formatErrorResponse('Webhook signature tidak valid', 401)
        );
      }

      next();
    } catch (error) {
      return res.status(500).json(
        formatErrorResponse(error.message, 500)
      );
    }
  };
};