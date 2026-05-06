export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isPasswordStrong = (password) => {
  return password.length >= 8;
};

export const isValidPhoneNumber = (phone) => {
  const regex = /^(\+|0)[0-9]{9,15}$/;
  return regex.test(phone);
};