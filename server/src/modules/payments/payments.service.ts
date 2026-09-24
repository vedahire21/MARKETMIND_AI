import crypto from 'crypto';
import { prisma } from '../../shared/prisma';
import { InventoryService } from '../inventory/inventory.service';
import Razorpay from 'razorpay';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_12345';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_12345';

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

export class PaymentsService {
  /**
   * HMAC SHA256 timing-safe signature comparison
   */
  static verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string, secret: string = RAZORPAY_KEY_SECRET): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify Webhook Body Signature
   */
  static verifyWebhookSignature(rawBody: string, signature: string, secret: string = RAZORPAY_WEBHOOK_SECRET): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }

  static async createRazorpayOrder(orderId: string, customerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { items: true }
    });

    if (!order) {
      throw { status: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    if (order.status !== 'PENDING') {
      throw { status: 400, code: 'INVALID_ORDER_STATE', message: `Cannot initiate payment for order in '${order.status}' status` };
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    let razorpayOrderId: string;

    // Use SDK in production, or fallback to deterministic mock order in testing
    try {
      if (process.env.NODE_ENV === 'production') {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.orderNumber,
          notes: { orderId: order.id, customerId }
        });
        razorpayOrderId = rzpOrder.id;
      } else {
        razorpayOrderId = `order_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
      }
    } catch (err) {
      razorpayOrderId = `order_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId,
        amount: order.totalAmount,
        status: 'PENDING'
      }
    });

    return {
      paymentId: payment.id,
      razorpayOrderId: payment.razorpayOrderId,
      amount: Number(payment.amount),
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber
    };
  }

  static async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const isValid = this.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      throw { status: 400, code: 'INVALID_SIGNATURE', message: 'Payment verification failed due to signature mismatch' };
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { order: { include: { items: true } } }
    });

    if (!payment) {
      throw { status: 404, code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' };
    }

    if (payment.status === 'SUCCESS') {
      return { success: true, message: 'Payment already verified', orderId: payment.orderId };
    }

    // Execute Transaction: Update Payment -> Confirm Order -> Deduct Inventory -> Outbox Event
    await prisma.$transaction(async (tx) => {
      // 1. Update Payment Record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: 'SUCCESS'
        }
      });

      // 2. Update Order Status
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' }
      });

      // 3. Convert RESERVED inventory to DEDUCTED
      for (const item of payment.order.items) {
        await InventoryService.deductStock(item.variantId, item.quantity, tx);
      }

      // 4. Outbox Event
      await tx.outbox.create({
        data: {
          aggregateType: 'Payment',
          aggregateId: payment.id,
          eventType: 'PAYMENT_SUCCESSFUL',
          payload: {
            orderId: payment.orderId,
            razorpayPaymentId,
            amount: Number(payment.amount)
          },
          status: 'PENDING'
        }
      });
    });

    return { success: true, message: 'Payment verified and order confirmed', orderId: payment.orderId };
  }

  static async handleWebhook(eventPayload: any, signature: string, eventId: string) {
    // 1. Idempotency Check
    const existingEvent = await prisma.processedEvent.findUnique({
      where: { eventId }
    });

    if (existingEvent) {
      return { status: 'SKIPPED', message: 'Event already processed' };
    }

    const rawPayloadString = JSON.stringify(eventPayload);
    const isValid = this.verifyWebhookSignature(rawPayloadString, signature);

    if (!isValid && process.env.NODE_ENV === 'production') {
      throw { status: 400, code: 'INVALID_WEBHOOK_SIGNATURE', message: 'Webhook signature verification failed' };
    }

    const { event, payload } = eventPayload;

    if (event === 'payment.captured') {
      const razorpayPaymentId = payload.payment.entity.id;
      const razorpayOrderId = payload.payment.entity.order_id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } }
      });

      if (payment && payment.status !== 'SUCCESS') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { razorpayPaymentId, status: 'SUCCESS' }
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' }
          });

          for (const item of payment.order.items) {
            await InventoryService.deductStock(item.variantId, item.quantity, tx);
          }

          await tx.processedEvent.create({
            data: { eventId }
          });
        });
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: { include: { items: true } } }
      });

      if (payment && payment.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' }
          });

          for (const item of payment.order.items) {
            await InventoryService.releaseStock(item.variantId, item.quantity, tx);
          }

          await tx.processedEvent.create({
            data: { eventId }
          });
        });
      }
    }

    return { status: 'PROCESSED', event };
  }
}
