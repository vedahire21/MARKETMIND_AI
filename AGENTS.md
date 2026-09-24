# MarketMind AI - Persistent Workspace Rules & Engineering Standards

Welcome to the **MarketMind AI** repository. This document defines the core architecture principles, directory layout, operational workflows, and agent execution guidelines for building this enterprise-grade AI marketplace and business operations platform.

---

## 1. Architectural Philosophy

1. **Deterministic Core Commerce, AI-Assisted Operations**:
   - Commerce transactions (pricing, inventory deductions, payment reconciliation, authorization, order transitions) are executed ONLY by deterministic application logic with ACID database constraints.
   - AI models (via Amazon Bedrock / Claude / RAG) act as intelligent advisors, content generators, analytics natural-language parsers, and support interfaces. **AI NEVER directly mutates database records without strict schema validation, allowlisted tool calling, or explicit user/seller approval.**

2. **Modular Monolith First**:
   - The application is built as a clean modular monolith structured by domain context (`catalog`, `orders`, `payments`, `inventory`, `analytics`, `ai`).
   - Domain boundaries communicate via internal service interfaces or asynchronous SQS events.

3. **Asynchronous & Idempotent Event Processing**:
   - Order processing, notifications, review sentiment analysis, and inventory re-calculations use **SQS queues + transactional outbox pattern**.
   - All event consumers MUST be strictly **idempotency-key verified** before mutating state.

4. **Razorpay Production Payment Flow**:
   - Frontend never asserts payment success directly.
   - Orders are created server-side in `PENDING` state. Razorpay HMAC SHA256 signatures and asynchronous webhooks handle final status transitions (`PAID`, `FAILED`).

---

## 2. Directory Structure

```
MarketMindAI/
├── AGENTS.md
├── .agents/
│   └── rules/
│       ├── architecture.md
│       ├── database.md
│       ├── ai.md
│       ├── security.md
│       └── testing.md
├── docs/
│   ├── PRD.md
│   ├── DRD.md
│   ├── AI_AGENT_SPEC.md
│   ├── AGENT_WORKFLOWS.md
│   ├── API_SPEC.md
│   ├── DATABASE.md
│   ├── AWS_DEVOPS.md
│   ├── SECURITY.md
│   ├── TEST_PLAN.md
│   ├── ROADMAP.md
│   ├── INTERVIEW_DEFENSE.md
│   ├── ANTIGRAVITY_WORK_PLAN.md
│   └── ADR/
│       ├── ADR-001-modular-monolith.md
│       ├── ADR-002-postgres-over-mongodb.md
│       ├── ADR-003-sqs-event-driven-outbox.md
│       ├── ADR-004-ecs-fargate-over-eks.md
│       ├── ADR-005-amazon-bedrock-rag.md
│       ├── ADR-006-deterministic-recommendations.md
│       ├── ADR-007-statistical-forecasting.md
│       ├── ADR-008-razorpay-signature-and-webhooks.md
│       └── ADR-009-ai-state-isolation.md
├── infra/
│   ├── terraform/
│   └── docker/
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── catalog/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── inventory/
│   │   │   ├── analytics/
│   │   │   └── ai/
│   │   ├── shared/
│   │   ├── queue/
│   │   └── index.ts
│   ├── prisma/
│   └── package.json
└── client/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   ├── services/
    │   └── styles/
    └── package.json
```

---

## 3. Rules & Guidelines for Agents

When implementing features in this workspace:
- **Always adhere to TypeScript strict mode**.
- **Never bypass Prisma schema type definitions**.
- **All API routes must use Zod or Joi validation for request payloads**.
- **Payment endpoints must verify Razorpay HMAC signatures using timing-safe comparisons (`crypto.timingSafeEqual`)**.
- **AI agents must use allowlisted schemas for tools; never pass arbitrary SQL strings or unbounded query objects to LLMs**.
- **Maintain unit & integration tests for all domain logic**.
