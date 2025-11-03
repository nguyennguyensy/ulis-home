import { AUTH_PATTERNS, AUTH_ERRORS } from './authConstants';

export const validateEmail = (email) => {
  if (!email) return AUTH_ERRORS.REQUIRED;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return AUTH_ERRORS.INVALID_EMAIL;
  return null;
};

export const validateEmailEdu = (email) => {
  if (!email) return AUTH_ERRORS.REQUIRED;
  if (!AUTH_PATTERNS.EMAIL_EDU.test(email)) return AUTH_ERRORS.INVALID_EMAIL_EDU;
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return AUTH_ERRORS.REQUIRED;
  if (!AUTH_PATTERNS.PHONE.test(phone)) return AUTH_ERRORS.INVALID_PHONE;
  return null;
};

export const validateIdCard = (idCard) => {
  if (!idCard) return AUTH_ERRORS.REQUIRED;
  if (!AUTH_PATTERNS.ID_CARD.test(idCard)) return AUTH_ERRORS.INVALID_ID_CARD;
  return null;
};

export const validatePassword = (password) => {
  if (!password) return AUTH_ERRORS.REQUIRED;
  if (password.length < 6) return AUTH_ERRORS.PASSWORD_MIN_LENGTH;
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return AUTH_ERRORS.REQUIRED;
  if (password !== confirmPassword) return AUTH_ERRORS.PASSWORD_MISMATCH;
  return null;
};

export const validateRequired = (value, fieldName = 'Trường này') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return AUTH_ERRORS.REQUIRED;
  }
  return null;
};

export const validateAge = (age) => {
  if (!age) return AUTH_ERRORS.REQUIRED;
  const numAge = parseInt(age);
  if (isNaN(numAge) || numAge < 18) return AUTH_ERRORS.AGE_MIN;
  return null;
};

export const validatePrice = (price) => {
  if (!price) return AUTH_ERRORS.REQUIRED;
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) return AUTH_ERRORS.PRICE_MIN;
  return null;
};

export const validateForm = (fields) => {
  const errors = {};
  let isValid = true;

  Object.keys(fields).forEach(key => {
    const { value, validator } = fields[key];
    const error = validator(value);
    if (error) {
      errors[key] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};