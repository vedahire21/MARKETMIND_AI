# ADR-009: Strict Isolation of AI Models from Direct State Mutation

## Status
Accepted

## Context
Allowing AI models direct database write access or raw SQL query execution opens catastrophic security, data integrity, and compliance vulnerabilities.

## Decision
AI agents operate in **Read-Only / Allowlisted Tool Mode**. All mutation proposals require explicit schema validation or Human-in-the-loop approval.

## Rationale
- Commerce invariants (prices, order statuses, inventory quantities) are owned by deterministic application code.
- Analytical queries use strict parameter objects (`getRevenueByProduct({ sellerId, startDate, endDate })`) instead of LLM-generated SQL strings.
- Seller Copilot listing suggestions remain in `DRAFT` state until explicitly published by human sellers.
