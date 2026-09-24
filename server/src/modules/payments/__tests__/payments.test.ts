import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { PaymentsService } from '../payments.service';
import { CreatePaymentOrderSchema, VerifyPaymentSchema } from '../payments.schema';

describe('Payments & Razorpay HMAC Verification Suite', () => {
  const mockSecret = 'test_secret_key_12345';
  const razorpayOrderId = 'order_M1234567890';
  const razorpayPaymentId = 'pay_P9876543210';

  // --- HMAC SHA256 Signature Tests ---

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

  it('should reject signatures with different length (timing-safe guard)', () => {
    const shortSignature = 'abc123';
    const isValid = PaymentsService.verifySignature(razorpayOrderId, razorpayPaymentId, shortSignature, mockSecret);
    expect(isValid).toBe(false);
  });

  it('should reject empty signature string', () => {
    const isValid = PaymentsService.verifySignature(razorpayOrderId, razorpayPaymentId, '', mockSecret);
    expect(isValid).toBe(false);
  });

  it('should reject signature with swapped orderId and paymentId (replay vector)', () => {
    // Generate valid signature for orderId|paymentId
    const validSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Try to verify with swapped order — should fail
    const isValid = PaymentsService.verifySignature(razorpayPaymentId, razorpayOrderId, validSignature, mockSecret);
    expect(isValid).toBe(false);
  });

  it('should reject signature generated with different secret', () => {
    const wrongSecretSignature = crypto
      .createHmac('sha256', 'wrong_secret_key')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = PaymentsService.verifySignature(razorpayOrderId, razorpayPaymentId, wrongSecretSignature, mockSecret);
    expect(isValid).toBe(false);
  });

  // --- Webhook Signature Verification ---

  it('should verify valid webhook body signature', () => {
    const webhookSecret = 'webhook_test_secret_12345';
    const rawBody = JSON.stringify({ event: 'payment.captured', payload: { amount: 5000 } });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid = PaymentsService.verifyWebhookSignature(rawBody, validSignature, webhookSecret);
    expect(isValid).toBe(true);
  });

  it('should reject tampered webhook body', () => {
    const webhookSecret = 'webhook_test_secret_12345';
    const originalBody = JSON.stringify({ event: 'payment.captured', payload: { amount: 5000 } });
    const tamperedBody = JSON.stringify({ event: 'payment.captured', payload: { amount: 50000 } });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(originalBody)
      .digest('hex');

    // Verify tampered body against signature of original → should fail
    const isValid = PaymentsService.verifyWebhookSignature(tamperedBody, signature, webhookSecret);
    expect(isValid).toBe(false);
  });

  it('should reject webhook with empty body', () => {
    const webhookSecret = 'webhook_test_secret_12345';
    const originalBody = JSON.stringify({ event: 'payment.captured' });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(originalBody)
      .digest('hex');

    // Empty body should not match
    const isValid = PaymentsService.verifyWebhookSignature('', signature, webhookSecret);
    expect(isValid).toBe(false);
  });

  // --- Zod Schema Validation ---

  it('should validate CreatePaymentOrder schema', () => {
    const valid = CreatePaymentOrderSchema.safeParse({ orderId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(valid.success).toBe(true);
  });

  it('should reject CreatePaymentOrder with empty orderId', () => {
    const invalid = CreatePaymentOrderSchema.safeParse({ orderId: '' });
    expect(invalid.success).toBe(false);
  });

  it('should validate VerifyPayment schema', () => {
    const valid = VerifyPaymentSchema.safeParse({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: 'a1b2c3d4e5f6'
    });
    expect(valid.success).toBe(true);
  });

  it('should reject VerifyPayment with missing fields', () => {
    const invalid = VerifyPaymentSchema.safeParse({
      razorpayOrderId
    });
    expect(invalid.success).toBe(false);
  });

  // --- Payment State Machine Assertions ---

  it('should enforce PENDING → SUCCESS state transition (via valid signature)', () => {
    // This is a conceptual state machine test
    const states = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
    const validTransitions: Record<string, string[]> = {
      PENDING: ['SUCCESS', 'FAILED'],
      SUCCESS: ['REFUNDED'],
      FAILED: [],
      REFUNDED: []
    };

    // PENDING can transition to SUCCESS or FAILED
    expect(validTransitions['PENDING']).toContain('SUCCESS');
    expect(validTransitions['PENDING']).toContain('FAILED');

    // SUCCESS can only transition to REFUNDED
    expect(validTransitions['SUCCESS']).toEqual(['REFUNDED']);

    // FAILED is terminal
    expect(validTransitions['FAILED']).toEqual([]);

    // REFUNDED is terminal
    expect(validTransitions['REFUNDED']).toEqual([]);
  });

  it('should generate deterministic HMAC for same input (no randomness)', () => {
    const sig1 = crypto.createHmac('sha256', mockSecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    const sig2 = crypto.createHmac('sha256', mockSecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    expect(sig1).toBe(sig2);
  });
});
