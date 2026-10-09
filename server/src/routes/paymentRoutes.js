import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate, requireTenant } from '../middleware/auth.js';

const router = express.Router();

// Public Webhook endpoint for Safepay callback
router.post('/webhook/safepay', express.json({ type: 'application/json' }), paymentController.handleSafepayWebhook);

// Protected endpoints
router.use(authenticate, requireTenant);

router.post('/initiate', paymentController.initiatePayment);
router.post('/confirm', paymentController.confirmPayment);
router.get('/history', paymentController.getPayments);

export default router;
