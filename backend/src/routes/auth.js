import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { validate, schemas } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', loginLimiter, validate(schemas.register), AuthController.register);
router.post('/login', loginLimiter, validate(schemas.login), AuthController.login);
router.post('/admin/login', loginLimiter, validate(schemas.login), AuthController.adminLogin);
router.get('/me', AuthController.me);
router.post('/logout', AuthController.logout);

export default router;