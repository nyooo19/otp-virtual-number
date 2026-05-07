import express from 'express';
import { DepositController } from '../controllers/DepositController.js';
import { auth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { verifyWebhookSignature } from '../middleware/apiKey.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post(
  '/webhook/tripay',
  verifyWebhookSignature(process.env.TRIPAY_WEBHOOK_SECRET),
  DepositController.webhookTripay
);

router.post(
  '/webhook/qrispy',
  verifyWebhookSignature(process.env.QRISPY_WEBHOOK_SECRET),
  DepositController.webhookQrispy
);

router.use(auth);

router.post('/create', validate(schemas.createDeposit), DepositController.createDeposit);
router.get('/:depositId', DepositController.getDeposit);
router.get('/history', DepositController.getDepositHistory);

export default router;