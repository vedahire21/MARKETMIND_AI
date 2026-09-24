# Security Guidelines

## Security Requirements
1. **Authentication & RBAC**:
   - JWT authentication with HTTP-only, Secure, SameSite refresh cookies.
   - Strict Role-Based Access Control (`CUSTOMER`, `SELLER`, `ADMIN`).
2. **Payment Security (Razorpay)**:
   - Verify `x-razorpay-signature` on incoming webhooks using `crypto.createHmac('sha256', secret)` and `timingSafeEqual`.
   - Webhook handlers must be idempotent: store processed `event_id` in Redis/DB with 7-day TTL.
3. **Data Protection**:
   - Sensitive credentials in Secrets Manager / `.env`.
   - Inputs sanitized against XSS and SQL Injection via Prisma parameterized queries and Zod schema validation.
   - Rate limiting enforced on login, checkout, and AI agent routes via Redis sliding window.
