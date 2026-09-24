# MarketMind AI — Master Test Plan & Quality Assurance Strategy

## 1. Quality Assurance Philosophy

MarketMind AI enforces **zero tolerance for commerce discrepancies and AI hallucinations**. All components undergo multi-layered testing:
1. **Unit Testing**: Isolated logic, mathematical calculations, deterministic scoring, JWT parsing.
2. **Integration Testing**: Transactions across modules, database state transitions, transactional outbox verification.
3. **Security Testing**: Cryptographic verification, HMAC replay attacks, timing attacks, prompt injection resistance, RBAC privilege boundaries.
4. **Concurrency & Race Conditions**: Pessimistic inventory locking under high concurrent checkout demand.
5. **End-to-End Testing**: Full customer and seller lifecycle workflows.
6. **Load & Stress Benchmarks**: High-throughput signature verification, token validation, and inventory contention.

---

## 2. Test Execution Matrix

| Test Suite | File Path | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Orders Integration** | `server/src/modules/orders/__tests__/orders.integration.test.ts` | Checkout pipeline, outbox events, paise conversions | **13/13 Passed** |
| **AI Safety & Isolation** | `server/src/modules/ai/__tests__/ai.safety.test.ts` | ADR-009 DRAFT policy, Bedrock prompt constraints, tool regex | **16/16 Passed** |
| **Razorpay Payment Security** | `server/src/modules/payments/__tests__/payments.test.ts` | HMAC SHA256 timing safety, replay attack prevention | **15/15 Passed** |
| **SQS Worker & Idempotency** | `server/src/queue/__tests__/sqsWorker.test.ts` | Dead-letter retry, duplicate message suppression | **13/13 Passed** |
| **Authentication & RBAC** | `server/src/modules/auth/__tests__/auth.security.test.ts` | JWT role claim verification, hierarchy, rate limits | **17/17 Passed** |
| **Inventory Concurrency** | `server/src/modules/inventory/__tests__/inventory.concurrency.test.ts` | Race condition prevention, zero overselling | **10/10 Passed** |
| **Product Catalog** | `server/src/modules/catalog/__tests__/catalog.test.ts` | Category hierarchy, filtering, pagination | **5/5 Passed** |
| **AI Copilot Core** | `server/src/modules/ai/__tests__/ai.test.ts` | Listing generator schema & tool calling | **4/4 Passed** |
| **E2E Full Lifecycle** | `server/src/__tests__/e2e.flow.test.ts` | Auth → Reserve → Pay → Outbox → AI → Support | **6/6 Passed** |
| **Orders Unit** | `server/src/modules/orders/__tests__/orders.test.ts` | Order status state machine transitions | **4/4 Passed** |
| **Rate Limiter** | `server/src/shared/__tests__/rateLimiter.test.ts` | IP-based request throttling & sliding window | **2/2 Passed** |
| **JWT Utilities** | `server/src/shared/__tests__/jwt.test.ts` | Token expiry, cryptographic signatures | **3/3 Passed** |
| **Review Sentiment** | `server/src/modules/reviews/__tests__/reviews.test.ts` | SQS review sentiment analysis processing | **3/3 Passed** |
| **Load & Benchmarks** | `server/src/__tests__/load.test.ts` | HMAC throughput (>1,000 ops/sec), token verification | **3/3 Passed** |
| **Analytics & Reporting** | `server/src/modules/analytics/__tests__/analytics.test.ts` | Aggregations, revenue metrics, seller isolation | **2/2 Passed** |
| **Total** | **15 Test Suites** | **Comprehensive System Coverage** | **116/116 Passed** |

---

## 3. Concurrency & Overselling Defenses

Under heavy flash-sale loads, multiple customers may simultaneously attempt to purchase the final unit of an item:
- **Strategy**: Pessimistic database locking via `SELECT ... FOR UPDATE` inside an interactive Prisma transaction.
- **Verification**: `inventory.concurrency.test.ts` and `load.test.ts` assert that out of 200 concurrent requests against 50 units, exactly 50 succeed, 150 are gracefully rejected, and final inventory count is 0 (never negative).

---

## 4. Continuous Integration Pipeline Verification

Every commit and pull request runs automated tests via GitHub Actions (`.github/workflows/ci-cd.yml`):
1. Node.js 20 environment initialization.
2. Dependency installation with npm cache.
3. Prisma client generation.
4. Vitest execution across all 15 test suites.
5. Docker multi-stage build validation for both Client and Server containers.
