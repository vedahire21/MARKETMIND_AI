# MarketMind AI - System Design Interview Defense Guide

This document equips you with battle-tested responses for system design and architecture interviews when presenting MarketMind AI.

---

## 1. Core Architecture Questions

### Q: "Why build a Modular Monolith instead of Microservices?"
> *"For a marketplace platform at this scale, microservices introduce cross-service network hops, distributed transaction complexity (Saga pattern overhead), and high deployment costs. By enforcing strict domain boundaries in a modular monolith, we get clean module isolation and ACID database guarantees in PostgreSQL. If a specific service like AI sentiment processing or search indexing requires separate scaling, we can easily extract it into a microservice without refactoring domain models."*

### Q: "Why PostgreSQL over MongoDB for e-commerce?"
> *"E-commerce workflows—orders, payments, inventory reservations, refunds—are fundamentally relational and require ACID compliance. PostgreSQL provides foreign key constraints, transactional locking (`SELECT FOR UPDATE`), decimal precision for financial arithmetic, and B-Tree indexing. MongoDB's document model makes multi-table integrity and financial reconciliation complex and prone to data drift."*

---

## 2. Payments & Event Driven Questions

### Q: "How do you handle a payment scenario where the customer's browser crashes right after paying on Razorpay?"
> *"Our architecture never relies solely on frontend payment callbacks. When an order is initialized, a server-side pending order and Razorpay order ID are generated. When payment succeeds on Razorpay's infrastructure, an asynchronous webhook (`payment.captured`) is sent directly to our backend server. The webhook verifies the HMAC-SHA256 signature, checks idempotency in Redis/DB, and transitions the order state to `CONFIRMED` regardless of client status."*

### Q: "What if SQS delivers a message twice?"
> *"Standard SQS queues guarantee at-least-once delivery. To make consumers idempotent, every message includes an `idempotency_key` or event ID. Workers query a `ProcessedEvents` table in PostgreSQL inside a database transaction. If the key exists, the worker skips execution and acknowledges the message. If not, it executes business logic and inserts the key atomically."*

---

## 3. AI & Safety Questions

### Q: "How do you prevent an LLM from hallucinating prices or modifying inventory directly?"
> *"We enforce strict isolation between deterministic commerce systems and AI systems. Deterministic code handles pricing, payments, inventory deductions, and order updates. AI operates strictly via allowlisted tool calls with Zod schema validation, or generates read-only summaries/explanations. For instance, the Business Analyst agent cannot write raw SQL; it invokes predefined parameterized TypeScript functions like `getRevenueByProduct()`. Additionally, Amazon Bedrock Guardrails filter out prompt injection and sensitive data leaks."*
