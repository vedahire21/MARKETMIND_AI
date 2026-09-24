import { z } from 'zod';

export const CreatePaymentOrderSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format')
});

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required')
});
