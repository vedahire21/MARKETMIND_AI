import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { PaymentsService } from '../payments.service';
import { CreatePaymentOrderSchema, VerifyPaymentSchema } from '../payments.schema';

describe('Payments & Razorpay HMAC Verification Suite', () => {
  const mockSecret = 'test_secret_key_12345';
  const razorpayOrderId = 'order_M1234567890';
  const razorpayPaymentId = 'pay_P9876543210';

  it('should correctly verify valid HMAC SHA256 payment signature', () => {
    const validSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = PaymentsService.verifySignature(razorpayOrderId, razorpayPaymentId, validSignature, mockSecret);
    expect(isValid).toBe(true);
  });

  it('should reject tampered or invalid HMAC payment signature', () => {
    const tamperedSignature = '0000000000000000000000000000000000000000000000000000000000000000';
    const isValid = PaymentsService.verifySignature(razorpayOrderId, razorpayPaymentId, tamperedSignature, mockSecret);
    expect(isValid).toBe(false);
  });

  it('should validate CreatePaymentOrder schema', () => {
    const valid = CreatePaymentOrderSchema.safeParse({ orderId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(valid.success).toBe(true);
  });

  it('should validate VerifyPayment schema', () => {
    const valid = VerifyPaymentSchema.safeParse({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: 'a1b2c3d4e5f6'
    });
    expect(valid.success).toBe(true);
  });
});
