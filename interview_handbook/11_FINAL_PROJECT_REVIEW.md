# MarketMind AI — Senior Engineer Final Project Review & Interview Master Guide

## 1. What the Project Actually Does
MarketMind AI is a full-stack, enterprise-grade e-commerce marketplace and autonomous merchant operations platform. It combines a high-concurrency deterministic commerce engine (handling product variants, inventory reservation, checkout, and Razorpay payment reconciliation) with an intelligent operations layer powered by Amazon Bedrock (Seller Copilot, RAG Customer Support, Statistical Demand Forecasting, and Metric Anomaly Detection).

---

## 2. 3-Minute Interview Pitch
> "MarketMind AI is an enterprise marketplace and operations platform engineered with a strict separation between deterministic commerce and non-deterministic GenAI.
>
> On the commerce side, we built a modular monolith on Node.js and TypeScript backed by PostgreSQL 16. To prevent flash-sale overselling, we implemented pessimistic inventory reservation with ACID transaction locks. For financial transactions, we integrated Razorpay where orders are initiated server-side in integer paise, and payment callbacks and webhooks are verified using constant-time HMAC SHA256 comparisons (`crypto.timingSafeEqual`) with an idempotent event store.
>
> On the event-driven side, we solved the dual-write problem using the Transactional Outbox pattern. State mutations commit an outbox event atomically, which is asynchronously published to Amazon SQS and consumed idempotently by background workers.
>
> On the AI side, we implemented ADR-009 for AI State Isolation. We orchestrate Anthropic Claude 3 models via Amazon Bedrock with Bedrock Guardrails. Our Seller Copilot generates listings in DRAFT-only state, requiring human approval before publishing. Our Customer Support Agent uses Bedrock Knowledge Bases (OpenSearch Serverless RAG) combined with allowlisted read-only tools that only accept regex-validated IDs.
>
> The system is containerized with multi-stage Alpine Docker builds, tested with 180 unit and integration tests across 17 suites, and provisioned on AWS using Terraform with a 3-tier VPC, ALB, and auto-scaling ECS Fargate."

---

## 3. Top 10 Core Architectural Interview Questions & Defenses

### Q1: Why did you build a Modular Monolith instead of Microservices?
- **Ideal Answer**: "E-commerce core operations (checking stock, creating orders, emitting outbox events) require absolute ACID transactional consistency. Microservices force you into distributed transactions, eventual consistency anomalies, or complex Saga orchestrations. By building a modular monolith with strict domain boundaries, we get single-transaction ACID guarantees within PostgreSQL while maintaining clean separation of concerns. If a specific module like recommendations needs independent scaling later, its boundary is already established."

### Q2: How do you prevent flash-sale overselling under high concurrency?
- **Ideal Answer**: "We use database-level pessimistic locking via Prisma's interactive transaction (`prisma.$transaction`). When a customer initiates checkout, we query the `Inventory` table, check that `availableQuantity = quantity - reservedQuantity >= requestedQuantity`, and increment `reservedQuantity` inside the lock. If stock is insufficient, the transaction throws `INSUFFICIENT_STOCK` (400) and aborts cleanly. In our load tests simulating 200 concurrent requests against 50 units, exactly 50 succeeded and 150 were rejected, with remaining stock staying strictly at 0."

### Q3: Why do you verify Razorpay payments using `crypto.timingSafeEqual`?
- **Ideal Answer**: "Standard string equality (`===`) short-circuits on the first mismatched byte, creating measurable nanosecond timing variations. Attackers can exploit this side-channel timing attack to brute-force valid signatures. `crypto.timingSafeEqual` executes in constant time regardless of where bytes differ, eliminating the side-channel vulnerability."

### Q4: What is the Transactional Outbox pattern and why did you use it?
- **Ideal Answer**: "It solves the distributed dual-write problem where an application needs to update a database and publish a message to a queue (like SQS). If you write to DB and then send to SQS, an SQS network failure leaves the system out of sync. With the outbox pattern, we insert the event into an `Outbox` table within the same database transaction as the order. A background publisher reads pending events and delivers them to SQS with deduplication IDs, ensuring at-least-once delivery with zero data loss."

### Q5: How do you handle duplicate SQS messages or replayed webhooks?
- **Ideal Answer**: "We implement idempotent consumer verification. Every incoming message or webhook has a unique identifier (`eventId`). Before executing any business logic, our worker queries the `ProcessedEvent` table. If the ID exists, it skips processing immediately. If not, it executes the operation and records the `eventId` in the same transaction."

### Q6: What is ADR-009 (AI State Isolation) and why is it critical?
- **Ideal Answer**: "LLMs are probabilistic and prone to hallucinations and prompt injection. ADR-009 dictates that AI models can NEVER directly write to production orders, update pricing, or mutate inventory. In our Seller Copilot, generated listings are forced to `status = DRAFT` and cannot go live until an authenticated seller reviews and explicitly approves them. For customer support, tools are strictly read-only with regex parameter validation (`^ord-[a-zA-Z0-9_-]+$`)."

### Q7: Why not use an LLM directly to rank recommendations?
- **Ideal Answer**: "Using an LLM to rank thousands of catalog items introduces high latency (>2-3 seconds), excessive token expenses, and hallucination risks where the LLM might suggest non-existent or out-of-stock items. We use a hybrid approach: PostgreSQL deterministically filters in-stock candidates and computes an algorithmic score based on ratings and price affinity; the LLM is only used to generate personalized, explainable rationale tags for the top candidates."

### Q8: How is the AWS network perimeter secured in Terraform?
- **Ideal Answer**: "We implement a 3-tier VPC architecture across two Availability Zones. Public subnets hold only the ALB and NAT Gateways. Private subnets hold our ECS Fargate tasks with no public IPs. Isolated subnets hold Amazon RDS PostgreSQL with zero internet gateway or NAT route. Security groups enforce least-privilege: the ALB accepts 80/443 from the internet; ECS accepts port 4000 only from the ALB; and RDS accepts port 5432 only from the ECS tasks."

### Q9: What happens if AWS Bedrock is throttled or goes down?
- **Ideal Answer**: "The platform is designed with graceful degradation. If Bedrock API calls fail or timeout, our AI service catches the exception and immediately invokes a deterministic fallback handler. The recommendation engine returns rule-based trending items, and the customer support agent provides canned policy guidance with live tracking links, preventing user-facing HTTP 500 crashes."

### Q10: How do you ensure zero-downtime rolling deployments on ECS?
- **Ideal Answer**: "We configure ECS deployment circuit breakers with automatic rollback in Terraform. When a new task definition is pushed to ECR, ECS spins up new Fargate containers in private subnets. The ALB routes health check probes to `/health`. Only after the new tasks pass the healthy threshold does the ALB redirect traffic and drain old containers. If the new containers fail health checks within 5 minutes, ECS terminates them and automatically reverts to the previous revision."
