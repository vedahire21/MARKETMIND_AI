# ADR-002: Use PostgreSQL Instead of MongoDB

## Status
Accepted

## Context
Many MERN stack projects use MongoDB out of convention. However, e-commerce data structures (Users, Products, Variants, Inventory, Orders, Payments, Refunds) are inherently relational with strict integrity constraints.

## Decision
We choose **PostgreSQL 16** with **Prisma ORM** as our primary datastore.

## Rationale
- E-commerce transactions require ACID guarantees, foreign keys, and strict schema validation.
- Complex analytical queries (e.g. seller revenue breakdowns, inventory forecasting) are significantly more performant with SQL aggregations and composite B-Tree indexes.
- JSONB columns provide document store flexibility when storing dynamic product attributes without sacrificing relational integrity.
