# MarketMind AI - AI Capabilities & Agent Specifications

MarketMind AI implements 7 specialized AI capabilities built on Amazon Bedrock (Claude 3.5 Sonnet / Haiku), Bedrock Knowledge Bases, and Bedrock Guardrails.

---

## Capabilities Breakdown

### 1. Seller Copilot
- **Goal**: Generate high-converting product listings from minimal seller inputs.
- **Workflow**: Seller inputs rough title/notes -> Bedrock formats structured JSON with Title, Detailed Description, Feature Bullet Points, Tags, SEO Meta Title, Meta Description.
- **Human-in-the-Loop**: Draft status in DB; seller must approve or edit before item becomes `ACTIVE`.

### 2. Customer Support RAG Agent
- **Goal**: Answer customer queries on orders, shipping, and store policies 24/7.
- **Architecture**:
  - **Intent Detection**: Categorizes query (`ORDER_STATUS`, `STORE_POLICY`, `GENERAL_INQUIRY`).
  - **RAG Policy Vector Search**: Queries Amazon Bedrock Knowledge Base (OpenSearch Serverless vector index of return/refund/shipping policies).
  - **Allowlisted Tool Executions**:
    - `getOrderDetails(orderId, customerId)`
    - `getShippingStatus(trackingNumber)`
    - `createSupportTicket(customerId, category, message)`
  - **Safety**: Bedrock Guardrails filter out PII disclosure, competitor mentions, and prompt injection attempts.

### 3. Hybrid Recommendation Engine
- **Goal**: Provide personalized product recommendations with dynamic AI-generated explanations.
- **Workflow**:
  1. **Candidate Retrieval (Deterministic)**: Queries co-purchased items, top category products, and user browsing history from Postgres/Redis.
  2. **Deterministic Ranking**: Sorts candidates based on popularity score + affinity weight.
  3. **AI Explanation Generation**: Takes top 3 recommended items + user context -> Bedrock generates a 1-sentence personalized explanation (e.g. *"Recommended because you recently bought a Sony Alpha Camera"*).

### 4. Inventory Intelligence Agent
- **Goal**: Prevent stockouts and overstock costs.
- **Workflow**:
  1. **Statistical Forecasting**: Calculates 30-day moving average and trend velocity from past sales data.
  2. **Stockout Risk Engine**: Determines days-of-inventory remaining based on current stock and lead time.
  3. **LLM Explanation**: Bedrock translates raw forecasting numbers into actionable seller advice with recommended reorder dates and quantities.

### 5. Review Intelligence
- **Goal**: Summarize customer reviews and identify actionable product improvements.
- **Workflow**:
  1. SQS worker batches 50+ reviews for a product.
  2. Extracts overall sentiment, positive themes, and negative friction points.
  3. **Traceability**: Every extracted theme includes array references to exact `review_id` items so sellers can verify feedback sources.

### 6. Business Analyst Agent
- **Goal**: Allow sellers and admins to query business performance in natural language.
- **Architecture**:
  - User prompt: *"What were my top 3 highest grossing products in August?"*
  - **Tool Routing (NO RAW SQL)**: Intent parser maps query to allowlisted analytical functions:
    - `getRevenueByProduct({ sellerId, startDate, endDate, limit })`
    - `getSalesByRegion({ sellerId, period })`
    - `getRefundRates({ sellerId })`
  - Function executes against PostgreSQL via Prisma.
  - LLM formats tabular result into a concise executive summary.

### 7. Anomaly Investigator
- **Goal**: Automatically spot unusual business events (e.g., sudden refund spikes, price setting anomalies).
- **Workflow**:
  1. Statistical monitor flags metric standard deviation (>3x baseline).
  2. Bedrock Agent aggregates audit logs, order histories, and product change events into an anomaly evidence graph.
  3. Produces a investigation summary report for admin review.
