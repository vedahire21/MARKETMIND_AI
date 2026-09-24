# Razorpay Payment Architecture & Edge Case Defense

## 1. Flow Diagram

```
Customer              Frontend                 Server                  Razorpay API
   │                     │                       │                           │
   ├── Checkout ────────►│                       │                           │
   │                     ├── POST /orders ──────►│                           │
   │                     │                       ├── Create Pending Order    │
   │                     │                       ├── Create Razorpay Order ─►│
   │                     │                       │◄── Return order_id ──────┤
   │                     │◄── order_id + key ────┤                           │
   │                     │                       │                           │
   │◄── Launch Modal ────┤                       │                           │
   ├── Pays on Modal ───►│                       │                           │
   │                     ├── POST /verify ──────►│                           │
   │                     │                       ├── HMAC SHA256 Verify      │
   │                     │                       ├── Process Order           │
   │                     │                       │                           │
   │                     │                       │◄── Async Webhook Event ───┤
   │                     │                       │    (payment.captured)     │
   │                     │                       ├── Check Idempotency Key  │
   │                     │                       └── Finalize Order State    │
```

## 2. Server-Side HMAC Signature Verification Code Pattern

```typescript
import crypto from 'crypto';

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(razorpaySignature)
  );
}
```

## 3. Interview Edge Case Defenses

### Q1: What if customer pays on Razorpay but their browser tab crashes before `/verify` call?
**Defense**: The Razorpay Webhook `payment.captured` fires asynchronously from Razorpay servers directly to our backend endpoint. The order is updated to `CONFIRMED` via the webhook even if the frontend never responds.

### Q2: What if the webhook arrives twice?
**Defense**: Every incoming webhook includes a unique `x-razorpay-event-id` or signature payload. The webhook route checks Redis / PostgreSQL `ProcessedEvents` table. If the event ID exists, it immediately returns `200 OK` without re-processing.

### Q3: What if the webhook arrives BEFORE the frontend payment callback `/verify`?
**Defense**: The order status update is wrapped in a database lock/transaction (`SELECT ... FOR UPDATE` or Prisma atomic updates). If status is already `PAID`, subsequent calls simply log and return the current order status safely without duplicate operations.

### Q4: What if Razorpay payment succeeds but internal DB stock deduction fails?
**Defense**: Order creation locks inventory in a `RESERVED` state with a TTL (e.g. 15 minutes). If payment fails or times out, stock reservation is released. If payment succeeds, `RESERVED` stock is converted to `DEDUCTED` in a single transaction.
