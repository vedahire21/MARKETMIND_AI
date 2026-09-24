# MarketMind AI - Detailed Architecture & Design Document (DRD)

## 1. System Topology

```
                       [ Customer / Seller / Admin ]
                                    │
                                HTTPS / TLS
                                    │
                          [ AWS CloudFront / WAF ]
                                    │
                       [ Application Load Balancer ]
                                    │
                       ┌────────────┴────────────┐
                       │   React SPA (Vite / TS) │
                       └────────────┬────────────┘
                                    │ REST APIs / JSON
                       ┌────────────▼────────────┐
                       │ Node.js + Express API   │
                       │   (Modular Monolith)    │
                       └────────────┬────────────┘
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────▼─────────┐       ┌────────▼─────────┐       ┌────────▼─────────┐
│  PostgreSQL 16   │       │   Redis 7 Cache  │       │  Amazon SQS      │
│  (RDS Primary)   │       │   & Rate Limiting│       │ (Async Outbox)   │
└──────────────────┘       └──────────────────┘       └────────┬─────────┘
                                                               │
                                                      ┌────────▼─────────┐
                                                      │ SQS Worker Nodes │
                                                      └────────┬─────────┘
                                                               │
                                                      ┌────────▼─────────┐
                                                      │  Amazon Bedrock  │
                                                      │ Guardrails / KB  │
                                                      └──────────────────┘
```

## 2. Core Architectural Guarantees

1. **State Isolation**:
   - Deterministic domain handlers govern order total calculation, stock decrements, and payment verification.
   - The AI subsystem has **zero raw write access** to PostgreSQL. All mutations recommended by AI must go through standard domain interfaces after user approval or validation.
2. **Transactional Outbox & Event Processing**:
   - Every mutation producing async events (e.g. `ORDER_PAID`, `REVIEW_SUBMITTED`, `INVENTORY_LOW`) creates an `Outbox` record inside the DB transaction.
   - A publisher process polls/pushes `Outbox` events to SQS standard queues.
   - SQS Worker checks `processed_events` table using `idempotency_key` (UUID) before taking action.
3. **Razorpay Asynchronous Resilience**:
   - Order creation generates a `PENDING` payment transaction server-side.
   - Payment completion is verified via Razorpay HMAC-SHA256 signature algorithm.
   - Webhook events (`payment.captured`, `payment.failed`) guarantee eventual consistency even if frontend disconnects.
