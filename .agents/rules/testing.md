# Testing Strategy & Rules

## Standard Testing Stack
1. **Backend Unit & Integration**: Vitest / Jest + Supertest with isolated test PostgreSQL container or mock DB.
2. **Payment & Webhook Tests**: Mock Razorpay HMAC signature generation to test valid, invalid, and duplicated webhook payloads.
3. **Queue & Idempotency Tests**: Verify worker handles duplicate SQS messages without double-deducting stock or double-confirming orders.
4. **Frontend Integration**: Playwright / Vitest for React components and critical paths (Login -> Cart -> Razorpay Mock Checkout -> Order Confirmation -> Seller Dashboard).
