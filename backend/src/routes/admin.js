import express from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authAdmin, checkRole } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.use(authAdmin, checkRole(['admin', 'super_admin']));

router.get('/dashboard', AdminController.getDashboard);

// User management
router.get('/users', AdminController.getUsers);
router.patch('/users/:userId/ban', AdminController.banUser);
router.patch('/users/:userId/unban', AdminController.unbanUser);
router.patch('/users/:userId/balance', validate(schemas.updateUserBalance), AdminController.adjustBalance);

// Orders & Deposits
router.get('/orders', AdminController.getOrders);
router.get('/deposits', AdminController.getDeposits);

// Services
router.get('/services', AdminController.getServices);
router.post('/services', AdminController.createService);
router.put('/services/:serviceId', AdminController.updateService);
router.delete('/services/:serviceId', AdminController.deleteService);

// Settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

export default router;