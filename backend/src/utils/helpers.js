import crypto from 'crypto';

export const generateReferralCode = (userId) => {
  return 'REF' + userId.toString().padStart(6, '0') + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const generateApiKey = () => {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
};

export const generateApiSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

export const generateTransactionId = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return 'TRX' + timestamp + random;
};

export const generateOrderId = () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return 'ORD' + timestamp + random;
};

export const calculateMarkupPrice = (costPrice, markupPercent) => {
  return costPrice * (1 + markupPercent / 100);
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, maxRetries = 3, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(delayMs * (i + 1));
    }
  }
};