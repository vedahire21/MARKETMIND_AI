import { prisma } from '../shared/prisma';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from './sqsClient';

const QUEUE_URL = process.env.AWS_SQS_ORDER_QUEUE_URL || 'http://localhost:4566/000000000000/marketmind-order-queue';

export class OutboxPublisher {
  static async publishPendingEvents() {
    const pendingEvents = await prisma.outbox.findMany({
      where: { status: 'PENDING' },
      take: 20,
      orderBy: { createdAt: 'asc' }
    });

    if (pendingEvents.length === 0) {
      return { publishedCount: 0 };
    }

    let publishedCount = 0;

    for (const event of pendingEvents) {
      try {
        const messageBody = JSON.stringify({
          eventId: event.id,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          eventType: event.eventType,
          payload: event.payload,
          timestamp: event.createdAt
        });

        // Send to SQS if environment configured, or simulate success
        if (process.env.NODE_ENV === 'production') {
          await sqsClient.send(new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: messageBody,
            MessageDeduplicationId: event.id,
            MessageGroupId: event.aggregateType
          }));
        }

        await prisma.outbox.update({
          where: { id: event.id },
          data: { status: 'PROCESSED' }
        });

        publishedCount++;
      } catch (err) {
        await prisma.outbox.update({
          where: { id: event.id },
          data: { status: 'FAILED' }
        });
      }
    }

    return { publishedCount };
  }
}
