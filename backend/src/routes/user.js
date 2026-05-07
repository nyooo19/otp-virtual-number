import express from 'express';
import { UserController } from '../controllers/UserController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/dashboard', UserController.getDashboard);
router.get('/transactions', UserController.getTransactions);
router.get('/orders', UserController.getOrders);
router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);

export default router;