import express from 'express';
import { OtpController } from '../controllers/OtpController.js';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.get('/countries', OtpController.getCountries);
router.get('/services', OtpController.getServices);
router.get('/operators', OtpController.getOperators);
router.get('/pricing', OtpController.getPricing);

router.use(auth);

router.post('/order', validate(schemas.createOtpOrder), OtpController.createOrder);
router.get('/order/:orderId', OtpController.getOrder);
router.post('/order/:orderId/cancel', OtpController.cancelOrder);

export default router;