import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticateJWT } from '../../shared/authMiddleware';
import { validateSchema } from '../../shared/validate';
import { CreatePaymentOrderSchema, VerifyPaymentSchema } from './payments.schema';

const router = Router();

// Protected Endpoints
router.post('/create-order', authenticateJWT, validateSchema(CreatePaymentOrderSchema), PaymentsController.createRazorpayOrder);
router.post('/verify', authenticateJWT, validateSchema(VerifyPaymentSchema), PaymentsController.verifyPayment);

// Asynchronous Webhook Endpoint (Public, verified via Razorpay HMAC Signature header)
router.post('/webhook', PaymentsController.handleWebhook);

export default router;
