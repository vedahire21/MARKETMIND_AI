# AI Architecture & Safety Rules

## 7 Core Capabilities
1. **Seller Copilot**: Drafts product titles, descriptions, SEO tags. Must submit as a draft (`DRAFT` state); seller explicit click publishes.
2. **Customer Support RAG Agent**: Uses Bedrock Knowledge Base vector search + allowlisted tools (`getOrder()`, `getPolicy()`, `createTicket()`). Prompt injection filtered via Bedrock Guardrails.
3. **Recommendation Engine**: SQL/Vector hybrid candidate retrieval -> deterministic popularity/co-purchase score -> Top 5 products -> LLM explanation generation.
4. **Inventory Intelligence**: Holt-Winters / Moving Average statistical forecast -> LLM stockout risk and reorder summary generation.
5. **Review Intelligence**: Aggregates verified review ratings & text -> sentiment extraction -> links insights directly to original Review IDs.
6. **Business Analyst Agent**: Receives NL question -> selects from parameterized analytical tools (`getRevenueByProduct`, `getTopCategories`) -> executes predefined Prisma query -> formats response. **NO RAW SQL GENERATION**.
7. **Anomaly Investigator**: Scans transaction/refund/review logs for statistical spikes -> builds evidence timeline -> suggests human review actions.

## Safety & Governance
- Bedrock Guardrails configured for PII redaction, topic blocking (financial advice, off-platform transaction execution), and prompt injection defense.
- Every AI interaction logs input prompt tokens, output tokens, response time, guardrail trigger status, and correlation ID to CloudWatch / Audit DB.
