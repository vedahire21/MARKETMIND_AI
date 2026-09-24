# ADR-008: Server-Side Razorpay Verification & Asynchronous Webhooks

## Status
Accepted

## Context
Frontends cannot be trusted to confirm financial transactions. Client network drops or client-side tampering can compromise payment state.

## Decision
All Razorpay orders are initialized server-side. Final status transitions require **HMAC SHA256 signature verification** and **Asynchronous Webhooks** (`payment.captured`, `payment.failed`).

## Rationale
- Webhooks guarantee payment status synchronization even if the user closes their browser modal immediately after payment.
- HMAC SHA256 timing-safe verification guarantees payload authenticity from Razorpay servers.
