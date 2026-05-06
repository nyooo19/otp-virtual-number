export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPER_ADMIN: 'super_admin',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const DEPOSIT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
};

export const TRANSACTION_TYPE = {
  DEPOSIT: 'deposit',
  ORDER: 'order',
  REFUND: 'refund',
  MANUAL_ADD: 'manual_add',
  MANUAL_REDUCE: 'manual_reduce',
  AFFILIATE: 'affiliate',
};

export const OTP_PROVIDERS = {
  FIVESIM: '5sim',
  HERO_SMS: 'hero_sms',
  NOKOSMURAH: 'nokosmurah',
};

export const PAYMENT_GATEWAYS = {
  TRIPAY: 'tripay',
  QRISPY: 'qrispy',
};