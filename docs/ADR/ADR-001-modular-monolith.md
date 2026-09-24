# ADR-001: Adopt Modular Monolith Architecture

## Status
Accepted

## Context
E-commerce applications often fall into the trap of early microservices splitting, resulting in distributed transaction overhead, network latency, difficult local debugging, and operational complexity.

## Decision
We choose a **Modular Monolith** structure for MarketMind AI. Domain modules (`catalog`, `orders`, `payments`, `inventory`, `analytics`, `ai`) are strictly decoupled in source code folders with explicit interface barriers.

## Consequences
- Single deployment artifact simplify CI/CD and hosting costs.
- ACID transactions are maintained across related domain models within PostgreSQL.
- Easy transition to microservices if individual sub-domains require independent scaling in the future.
