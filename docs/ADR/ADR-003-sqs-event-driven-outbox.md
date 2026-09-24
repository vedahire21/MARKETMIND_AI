# ADR-003: SQS Queue & Transactional Outbox Pattern

## Status
Accepted

## Context
Asynchronous jobs (order confirmation emails, AI review batching, stock level re-calculation) must run reliably without blocking user HTTP requests or suffering from dual-write data loss.

## Decision
We implement **AWS SQS** queues coupled with a **Transactional Outbox Pattern** in PostgreSQL.

## Rationale
- AWS SQS standard queues provide scalable, managed, pay-per-use message queueing with Dead Letter Queues (DLQ).
- The Outbox table ensures that database state updates and event dispatching occur atomically in a single database transaction.
- Consumers verify message `idempotency_key` values to handle standard SQS at-least-once delivery guarantees.
