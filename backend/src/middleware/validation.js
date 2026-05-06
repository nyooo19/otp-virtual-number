import Joi from 'joi';
import { formatErrorResponse } from '../utils/formatter.js';

export const schemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createDeposit: Joi.object({
    amount: Joi.number().positive().required(),
    payment_gateway: Joi.string().valid('tripay', 'qrispy').required(),
  }),

  createOtpOrder: Joi.object({
    country_id: Joi.number().positive().required(),
    service_id: Joi.number().positive().required(),
    operator_id: Joi.number().positive().required(),
  }),

  updateUserBalance: Joi.object({
    user_id: Joi.number().positive().required(),
    amount: Joi.number().required(),
    type: Joi.string().valid('add', 'reduce').required(),
    reason: Joi.string().required(),
  }),
};

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {});
      return res.status(400).json(
        formatErrorResponse('Validation Error', 400, errors)
      );
    }

    req.body = value;
    next();
  };
};