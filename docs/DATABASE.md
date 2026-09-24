# MarketMind AI - Database Architecture & Schema Specification

## 1. Relational Model Rationale
MarketMind AI uses **PostgreSQL 16** with **Prisma ORM**. E-commerce domain data consists of interdependent entities requiring ACID transactions, strict foreign key constraints, and multi-table joins (Users, Sellers, Products, Inventory, Orders, OrderItems, Payments, Refunds, Reviews, Outbox).

## 2. Core ER Schema Design Overview

```
User (1) ─── (0..1) Seller Profile
 User (1) ─── (0..*) Order
 Seller (1) ─── (0..*) Product
 Product (1) ─── (1..*) ProductVariant
 ProductVariant (1) ─── (1..1) Inventory
 Order (1) ─── (1..*) OrderItem
 Order (1) ─── (1..*) Payment
 Order (1) ─── (0..*) Refund
 Product (1) ─── (0..*) Review
```

## 3. Key Entities Summary

- **User**: `id`, `email`, `passwordHash`, `role` (`CUSTOMER`, `SELLER`, `ADMIN`), `createdAt`.
- **Seller**: `id`, `userId`, `storeName`, `kycStatus`, `rating`.
- **Product**: `id`, `sellerId`, `title`, `slug`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `categoryId`.
- **ProductVariant**: `id`, `productId`, `sku`, `price` (`DECIMAL(12,2)`), `attributes` (JSONB).
- **Inventory**: `id`, `variantId`, `quantity`, `reservedQuantity`, `reorderThreshold`.
- **Order**: `id`, `orderNumber`, `customerId`, `status` (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `totalAmount`, `idempotencyKey`.
- **OrderItem**: `id`, `orderId`, `variantId`, `quantity`, `unitPrice`.
- **Payment**: `id`, `orderId`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `status` (`PENDING`, `SUCCESS`, `FAILED`), `amount`.
- **Outbox**: `id`, `aggregateType`, `aggregateId`, `eventType`, `payload` (JSONB), `status` (`PENDING`, `PROCESSED`, `FAILED`), `createdAt`.
- **ProcessedEvents**: `eventId` (Primary Key), `processedAt`.

## 4. Transactional Outbox Flow

1. When an Order is created or Payment succeeds, the application opens a Prisma transaction.
2. The domain tables (`Order`, `Payment`, `Inventory`) are updated.
3. An `Outbox` record is created in the SAME transaction.
4. If DB commit succeeds, outbox worker reads `PENDING` outbox entries, publishes to AWS SQS, and marks outbox as `PROCESSED`.
5. Ensures **Zero Lost Events** even if SQS or network temporarily fails.
