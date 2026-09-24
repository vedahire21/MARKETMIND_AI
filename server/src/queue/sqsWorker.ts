import { prisma } from '../shared/prisma';

export interface SQSMessagePayload {
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  timestamp: string;
}

export class SQSWorker {
  /**
   * Processes SQS message event idempotently.
   * Verifies ProcessedEvent table prior to performing actions.
   */
  static async processEvent(message: SQSMessagePayload) {
    const existing = await prisma.processedEvent.findUnique({
      where: { eventId: message.eventId }
    });

    if (existing) {
      return { status: 'SKIPPED', message: 'Event already processed' };
    }

    await prisma.$transaction(async (tx) => {
      switch (message.eventType) {
        case 'ORDER_CREATED':
          // Log order creation metric
          await tx.auditLog.create({
            data: {
              actorId: message.payload.customerId,
              action: 'ORDER_CREATED_EVENT',
              details: message.payload
            }
          });
          break;

        case 'PAYMENT_SUCCESSFUL':
          // Enqueue analytics notification
          await tx.auditLog.create({
            data: {
              actorId: message.payload.orderId,
              action: 'PAYMENT_SUCCESSFUL_EVENT',
              details: message.payload
            }
          });
          break;

        default:
          break;
      }

      // Mark event as processed in ProcessedEvent table
      await tx.processedEvent.create({
        data: { eventId: message.eventId }
      });
    });

    return { status: 'PROCESSED', eventId: message.eventId };
  }
}
