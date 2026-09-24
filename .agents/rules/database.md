# Database Standards & Guidelines

## Core Principles
1. **Primary Store**: PostgreSQL managed via Prisma ORM.
2. **Schema Integrity**:
   - Foreign key constraints must be strictly enforced.
   - Enums must be used for finite status sets (`OrderStatus`, `PaymentStatus`, `Role`, `TicketStatus`, `AnomalyType`).
   - Standard timestamp fields (`createdAt`, `updatedAt`) are mandatory on all tables.
3. **Indexing Strategy**:
   - Add B-Tree indexes on foreign keys (`userId`, `sellerId`, `orderId`, `productId`).
   - Add composite indexes for common filter combinations (e.g., `[sellerId, status, createdAt]`).
4. **Concurrency & Locking**:
   - Inventory decrements during order creation must use optimistic locking or atomic database operations (`decrement: quantity`) to prevent overselling.
   - Financial & Payment records must use `DECIMAL(12,2)` (never floats).
