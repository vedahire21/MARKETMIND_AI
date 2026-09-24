import { prisma } from '../../shared/prisma';
import { InventoryService } from '../inventory/inventory.service';
import { CartService } from '../cart/cart.service';
import { z } from 'zod';
import { CheckoutSchema } from './orders.schema';

type CheckoutInput = z.infer<typeof CheckoutSchema>;

export class OrdersService {
  static async checkout(customerId: string, input: CheckoutInput) {
    // 1. Idempotency Check
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true, payments: true }
    });

    if (existingOrder) {
      return { order: existingOrder, isDuplicate: true };
    }

    // 2. Fetch variants & calculate total in decimal
    const variantIds = input.items.map(i => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } }
    });

    if (variants.length !== input.items.length) {
      throw { status: 400, code: 'INVALID_VARIANTS', message: 'One or more requested product variants do not exist' };
    }

    let totalAmount = 0;
    const orderItemsData = input.items.map(item => {
      const variant = variants.find(v => v.id === item.variantId)!;
      const unitPrice = Number(variant.price);
      totalAmount += unitPrice * item.quantity;
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice
      };
    });

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Execute Transaction: Create Order + Reserve Stock + Write Outbox Event
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Reserve stock for each item
      for (const item of input.items) {
        await InventoryService.reserveStock(item.variantId, item.quantity, tx);
      }

      // 3b. Create Pending Order record
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          totalAmount,
          idempotencyKey: input.idempotencyKey,
          status: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      // 3c. Write event to Transactional Outbox
      await tx.outbox.create({
        data: {
          aggregateType: 'Order',
          aggregateId: newOrder.id,
          eventType: 'ORDER_CREATED',
          payload: {
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            customerId: newOrder.customerId,
            totalAmount: Number(newOrder.totalAmount),
            items: orderItemsData
          },
          status: 'PENDING'
        }
      });

      return newOrder;
    });

    // Clear customer cart after checkout order creation
    await CartService.clearCart(customerId);

    return { order: result, isDuplicate: false };
  }

  static async getCustomerOrders(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { title: true } } }
            }
          }
        },
        payments: true
      }
    });
  }

  static async getOrderById(orderId: string, customerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { title: true } } }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      throw { status: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    return order;
  }
}
