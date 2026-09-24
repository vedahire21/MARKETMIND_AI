# MarketMind AI — Enterprise Security, Threat Model & Compliance Guide

## 1. Executive Summary

MarketMind AI is designed with an **adversarial, defense-in-depth posture**. Security is baked into the foundation:
- Deterministic commerce transactions are completely isolated from non-deterministic AI agents (ADR-009).
- Payment reconciliation strictly mandates HMAC SHA256 timing-safe verification.
- Sensitive credentials reside in AWS Secrets Manager with zero secrets in source code.
- Network boundaries use a 3-tier VPC architecture with isolated subnets for the database layer.

---

## 2. Threat Modeling & OWASP Top 10 Mitigations

### 2.1 Injection (A03:2021)
- **SQL Injection**: All database operations use Prisma ORM with strongly-typed parameterized queries. Raw SQL execution is strictly forbidden in application and AI modules.
- **Prompt Injection & Jailbreak (AI)**:
  - LLM inputs pass through Amazon Bedrock Guardrails filtering PII, toxic content, and system prompt override attempts.
  - AI tools use strict Zod schemas with regex constraints (`/^ord-[a-zA-Z0-9_-]+$/`).
  - LLMs never execute arbitrary queries; only allowlisted read-only or draft-mutating tools can be invoked.

### 2.2 Broken Access Control (A01:2021)
- **Role-Based Access Control (RBAC)**:
  - Roles: `CUSTOMER`, `SELLER`, `ADMIN`.
  - Enforced via JWT authorization middleware with tamper-proof HMAC verification.
  - Tenant isolation: Sellers can only view/modify their own catalog items and order analytics (`where: { sellerId }`). Customers can only inspect their own orders.

### 2.3 Cryptographic Failures (A02:2021)
- Passwords hashed using `bcrypt` (work factor 12).
- JWT signed using HS256 with cryptographically random secrets (minimum 256 bits).
- All transit traffic encrypted via TLS 1.3 (ALB) and TLS in-flight to RDS.
- Storage encryption: S3 server-side encryption (SSE-S3/KMS), RDS storage encrypted with AWS KMS (`storage_encrypted = true`).

### 2.4 Identification & Authentication Failures (A07:2021)
- Short-lived Access Tokens (15 minutes).
- Refresh Tokens (7 days) with rotation and automatic invalidation upon logout.
- Multi-tier Rate Limiting:
  - Auth routes: 10 requests / 15 minutes to prevent credential stuffing.
  - API routes: 100 requests / 15 minutes.
  - AI endpoints: 20 requests / 15 minutes to prevent token abuse and DoS.

### 2.5 Software and Data Integrity Failures (A08:2021)
- **Razorpay HMAC SHA256 Webhook Verification**:
  - Signatures verified using `crypto.timingSafeEqual` preventing side-channel timing attacks.
  - Payment order amounts verified against database expected amounts (never trusted from client payloads).
  - Outbox pattern ensures atomic commits between state changes and asynchronous queue dispatches.

---

## 3. Network Architecture & Perimeter Security

1. **Tier 1 — Public Subnets**:
   - Only the AWS Application Load Balancer (ALB) resides here.
   - ALB Security Group accepts ports 80 (redirected to 443) and 443 from `0.0.0.0/0`.
2. **Tier 2 — Private Subnets**:
   - ECS Fargate tasks reside here with no public IPs.
   - Outbound internet access mediated strictly via dual NAT Gateways (for HA).
   - Inbound access permitted *only* from the ALB Security Group on container port 4000.
3. **Tier 3 — Isolated Database Subnets**:
   - Amazon RDS PostgreSQL resides on dedicated subnets with NO internet gateway or NAT route.
   - Inbound access permitted *only* from the ECS Tasks Security Group on port 5432.

---

## 4. AI Security & State Isolation (ADR-009)

1. **DRAFT-Only State Policy**:
   - Copilot listings created with `status: "DRAFT"`.
   - Cannot be set to `ACTIVE` without authenticated seller human approval via `approveListing()` endpoint.
2. **Read-Only Context Injection**:
   - Support agents receive deterministic database slices rather than full database connection handles.
3. **No Dynamic Code / Eval Execution**:
   - Neither the backend nor AI agents evaluate arbitrary code or run unverified scripts.

---

## 5. Security Incident Response & Audit Logging

- **Audit Trails**: All critical actions (logins, role changes, payment transitions, AI approvals) emit structured JSON audit logs recorded in Amazon CloudWatch.
- **Log Retention**: 30 days retention with encryption.
- **Vulnerability Scanning**: Docker images pushed to ECR undergo automated vulnerability scans (`scan_on_push = true`).
