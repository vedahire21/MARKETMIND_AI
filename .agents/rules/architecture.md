# Architectural Standards Rule

## Core Principles
1. **Modular Monolith**: Code must be separated into explicit domain modules in `server/src/modules/`. Cross-module calls should happen via explicit service methods or SQS messages.
2. **Transactional Outbox Pattern**: State changes requiring asynchronous downstream actions (e.g., sending emails, running AI review analysis, processing stock re-evaluations) must write an event to an `Outbox` table within the primary database transaction.
3. **Idempotent Queue Workers**: SQS handlers must verify idempotency using Redis or PostgreSQL atomic locks (`idempotency_key` unique constraints) prior to executing business logic.
4. **Clean Code & Layering**:
   - Controller Layer: Request validation, authentication parsing, response formatting.
   - Service Layer: Business logic, domain invariants, outbox event generation.
   - Data Access Layer: Prisma queries, index optimization.
