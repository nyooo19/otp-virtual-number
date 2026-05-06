export const formatCurrency = (amount, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date, locale = 'id-ID') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: statusCode < 400,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

export const formatErrorResponse = (message, statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};