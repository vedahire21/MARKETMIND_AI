# MarketMind AI — Event-Driven Architecture & Transactional Outbox

## 1. Why the Transactional Outbox Pattern? (ADR-003)

### The Dual-Write Problem
When an order is created, the system must perform two actions:
1. Update the database (`INSERT INTO "Order"`).
2. Publish an event to the message broker (`sqs.sendMessage()`).

If the database commit succeeds but the network to SQS fails, the event is lost forever (inconsistent state). If the message is sent first but the database rollback triggers, downstream consumers process phantom orders.

### The Solution: Transactional Outbox
Both the `Order` record and the `Outbox` event record are committed inside a **single ACID database transaction**. If the transaction fails, neither is saved. If it succeeds, the event is guaranteed to exist.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant API as Orders API
    participant DB as PostgreSQL Database
    participant Outbox as Outbox Table
    participant Poller as OutboxPublisher
    participant SQS as AWS SQS Queue
    participant Worker as SQSWorker
    participant Processed as ProcessedEvent Table

    Customer->>API: POST /api/v1/orders/checkout
    activate API
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO "Order" (status: PENDING)
    API->>Outbox: INSERT INTO "Outbox" (status: PENDING, payload: {...})
    API->>DB: COMMIT TRANSACTION
    API-->>Customer: Order Created (HTTP 201)
    deactivate API

    loop Every 5 seconds (Background Poller)
        Poller->>Outbox: SELECT * FROM "Outbox" WHERE status = 'PENDING' LIMIT 20
        Outbox-->>Poller: Returns pending events
        Poller->>SQS: SendMessageCommand (QueueUrl, Payload, DeduplicationId)
        SQS-->>Poller: ACK (MessageId)
        Poller->>Outbox: UPDATE "Outbox" SET status = 'PROCESSED'
    end

    loop Asynchronous Consumer
        SQS->>Worker: ReceiveMessagesCommand
        Worker->>Processed: SELECT * FROM "ProcessedEvent" WHERE eventId = message.id
        alt Already Processed (Duplicate Delivery)
            Worker-->>SQS: DeleteMessage (Skipped safely)
        else First Delivery
            Worker->>DB: Apply domain side-effects (Metrics / Inventory / Notifications)
            Worker->>Processed: INSERT INTO "ProcessedEvent" (eventId)
            Worker-->>SQS: DeleteMessage
        end
    end
```

---

## 2. Idempotent Consumer Implementation (`server/src/queue/sqsWorker.ts`)

```typescript
static async processEvent(message: SQSMessagePayload) {
  // 1. Idempotency Check
  const existing = await prisma.processedEvent.findUnique({
    where: { eventId: message.eventId }
  });

  if (existing) {
    return { status: 'SKIPPED', message: 'Event already processed' };
  }

  // 2. Atomic Side-Effects + Idempotency Commit
  await prisma.$transaction(async (tx) => {
    switch (message.eventType) {
      case 'ORDER_CREATED':
        await tx.auditLog.create({
          data: { actorId: message.payload.customerId, action: 'ORDER_CREATED_EVENT', details: message.payload }
        });
        break;
      case 'PAYMENT_SUCCESSFUL':
        await tx.auditLog.create({
          data: { actorId: message.payload.orderId, action: 'PAYMENT_SUCCESSFUL_EVENT', details: message.payload }
        });
        break;
    }

    // 3. Mark Event Processed
    await tx.processedEvent.create({
      data: { eventId: message.eventId }
    });
  });

  return { status: 'PROCESSED', eventId: message.eventId };
}
```

---

## 3. Dead-Letter Queue (DLQ) & Poison Pill Handling
In `infra/terraform/s3.tf`:
- `maxReceiveCount = 3`: If a message triggers unexpected runtime exceptions or unhandled schema mismatches 3 consecutive times, AWS SQS automatically routes the message to `marketmind-order-dlq.fifo`.
- This prevents "poison pill" messages from perpetually blocking the queue.
