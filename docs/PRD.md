# MarketMind AI - Product Requirements Document (PRD)

## 1. Executive Summary
**MarketMind AI** is an enterprise-grade multi-vendor e-commerce and business operations platform. It combines a high-performance deterministic commerce core (Node.js, PostgreSQL, Redis, AWS SQS) with 7 specialized Amazon Bedrock AI capabilities to automate seller catalog management, deliver intelligent RAG customer support, run deterministic product recommendations with AI explanations, generate statistical inventory forecasts, extract sentiment from reviews, query business analytics via natural language, and investigate operational anomalies.

## 2. Target Persona & Key Use Cases
1. **Customers**: Browse catalog, receive AI-explained personalized recommendations, purchase securely via Razorpay, track order status, and query the AI support bot for real-time order updates or store policies.
2. **Sellers**: Use AI Copilot to quickly draft enriched product listings (Title, Description, SEO), view statistical reorder forecasts, analyze customer feedback trends, and ask the Business Analyst agent questions about revenue performance.
3. **Admins / Operations**: Monitor platform-wide GMV, investigate system-flagged refund or inventory anomalies with AI root-cause analysis, manage RBAC permissions, and oversee platform health.

## 3. Product Features & Requirements Matrix

| Feature | Description | Architecture / Tech | Priority |
|---|---|---|---|
| Multi-Vendor Catalog | Product listings, variants, categories, search, filter | Postgres, Redis caching, React UI | Core |
| Cart & Checkout | Synchronous stock verification, transactional order reservation | Node.js, Prisma, Postgres Transaction | Core |
| Razorpay Payments | Server-side order creation, HMAC signature verification, webhooks | Razorpay Node SDK, Crypto, SQS webhook queue | Core |
| Async Order Outbox | Transactional Outbox pattern for downstream event notifications | SQS, Worker Process, Idempotency DB lock | Core |
| 1. Seller Copilot | AI product metadata drafting + seller review/publish flow | Amazon Bedrock (Claude 3.5 Sonnet), Zod JSON schema | AI Feature |
| 2. Customer Support RAG | Order tracking tool calling + Bedrock Knowledge Base policy search | Bedrock KB, Guardrails, Tool Execution engine | AI Feature |
| 3. Recommendation Engine | Hybrid SQL candidate retrieval + deterministic scoring + AI explanation | Postgres PGVector / Similarity + Bedrock | AI Feature |
| 4. Inventory Intelligence | Holt-Winters / Moving Average statistical forecast + AI stockout risk summary | Node.js Math engine + Bedrock | AI Feature |
| 5. Review Intelligence | Topic & sentiment extraction traceable to verified Review IDs | SQS worker batching + Bedrock summary | AI Feature |
| 6. Business Analyst Agent | Intent detection -> Parameterized tool query (`getRevenueByProduct`) -> AI summary | Allowlisted Prisma Analytics functions + Bedrock | AI Feature |
| 7. Anomaly Investigator | Automated refund/sales spike detection + AI evidence graph generation | Background SQS job + Bedrock reasoning | AI Feature |
