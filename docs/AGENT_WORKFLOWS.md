# MarketMind AI — AI Agent Workflows & Multi-Agent Architecture

## 1. System Overview

MarketMind AI features four specialized AI systems operating under **ADR-009 (AI State Isolation)**:
1. **Seller Copilot Agent**: Product title, SEO description, tags, and suggested pricing generator with mandatory human approval.
2. **Customer Support Agent**: Amazon Bedrock RAG agent with allowlisted, read-only tools for order tracking, FAQ lookup, and return policy resolution.
3. **Hybrid Recommendation Engine**: High-speed deterministic vector/category scoring coupled with LLM explainability generation.
4. **Anomaly Investigator**: Real-time sales velocity & conversion rate monitoring with AI root-cause diagnostics.

---

## 2. Multi-Agent Orchestration & Isolation Boundaries

```
[ User Request ]
       │
       ▼
┌─────────────────────────┐
│ Express API Gateway     │
│ - JWT Authentication    │
│ - Zod Schema Validation │
│ - Rate Limiting         │
└────────────┬────────────┘
             │
      ┌──────┴───────────────────────────┐
      ▼                                  ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│ Core Commerce Engine    │   │ AI Agent Orchestration    │
│ (ACID Transactions)     │   │ (Amazon Bedrock / Claude) │
│ - Orders / Inventory    │   │ - Guardrails (PII/Prompt) │
│ - Payments (HMAC SHA256)│   │ - Read-Only Tool Invocation│
│ - SQS Outbox Dispatch   │   │ - DRAFT Mutation Only     │
└────────────┬────────────┘   └─────────────┬─────────────┘
             │                              │
             └──────────────┬───────────────┘
                            ▼
              ┌───────────────────────────┐
              │ Amazon RDS PostgreSQL     │
              │ - Foreign Keys            │
              │ - Pessimistic Locks       │
              └───────────────────────────┘
```

---

## 3. Agent 1: Seller Copilot

### Workflow
1. **Trigger**: Seller supplies raw bullet points or rough specifications.
2. **Inference**: Invokes `anthropic.claude-3-haiku` / `sonnet` via Amazon Bedrock with system prompt enforcing markdown product listings, SEO keyword inclusion, and pricing band calculation.
3. **Safety Check**: Bedrock Guardrails scan for banned keywords, competitor defamation, and contact info leakage.
4. **Persistence**: Saved to `Product` table with `status = DRAFT`.
5. **Approval**: Must be reviewed, edited, or clicked "Approve Listing" by the seller. No listing ever goes live automatically.

---

## 4. Agent 2: Customer Support Agent (Amazon Bedrock RAG)

### Workflow
1. **Trigger**: Customer submits inquiry in chat widget.
2. **Bedrock Knowledge Base**: Queries Amazon Bedrock Knowledge Base (OpenSearch Serverless vector store) containing indexed return policies, shipping FAQs, and warranty terms.
3. **Tool Execution (Allowlisted)**:
   - Tool 1: `lookupOrderStatus(orderId: string)`
   - Tool 2: `checkDeliveryTracking(orderId: string)`
   - Schema enforcement: Inputs validated against regex `^ord-[a-zA-Z0-9_-]+$`. No dynamic query generation.
4. **Response Formulation**: Combines RAG policy excerpts with live order status from the deterministic database slice.

---

## 5. Agent 3: Hybrid Recommendation Engine

### Workflow
1. **Deterministic Candidate Selection**:
   - Queries products in the same category or with shared tags.
   - Computes weighted score: `Score = 0.4 * Rating + 0.3 * Popularity + 0.3 * PriceAffinity`.
   - Filters out out-of-stock items (`stock > 0`).
2. **AI Explainability**:
   - Generates personalized reason tags: "Frequently bought with your wireless setup", "Top-rated companion item".

---

## 6. Agent 4: Anomaly Investigator

### Workflow
1. **Statistical Detection**:
   - Calculates moving average and standard deviation over rolling 24-hour windows.
   - Flags anomalies when metric deviation exceeds Z-score threshold (Z > 2.5).
2. **AI Root-Cause Diagnostics**:
   - Gathers contextual signals (cart abandonments, payment gateway error rates, inventory changes).
   - Generates natural language incident summary: *"Sudden 42% drop in checkout completions detected between 14:00-15:00 UTC correlates with 3 consecutive payment gateway timeout alerts."*
