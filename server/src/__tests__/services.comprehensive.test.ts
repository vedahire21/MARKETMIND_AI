import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { prisma } from '../shared/prisma';
import { AuthService } from '../modules/auth/auth.service';
import { CatalogService } from '../modules/catalog/catalog.service';
import { CartService } from '../modules/cart/cart.service';
import { OrdersService } from '../modules/orders/orders.service';
import { PaymentsService } from '../modules/payments/payments.service';
import { InventoryService } from '../modules/inventory/inventory.service';
import { ReviewsService } from '../modules/reviews/reviews.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { AIService } from '../modules/ai/ai.service';
import { SupportAgentService } from '../modules/ai/supportAgent.service';
import { RecommendationEngineService } from '../modules/ai/recommendationEngine.service';
import { InventoryIntelligenceService } from '../modules/ai/inventoryIntelligence.service';
import { AnomalyInvestigatorService } from '../modules/ai/anomalyInvestigator.service';
import { SQSWorker } from '../queue/sqsWorker';
import { OutboxPublisher } from '../queue/outboxPublisher';
import { hashPassword, comparePassword } from '../shared/hash';
import { generateAccessToken, verifyAccessToken } from '../shared/jwt';

describe('Comprehensive Domain Services & Functions Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. AuthService
  // =========================================================================
  describe('AuthService', () => {
    it('register throws 409 if user already exists', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: 'u1' } as any);
      await expect(
        AuthService.register({ email: 'exists@test.com', password: 'Password123!', name: 'User', role: 'CUSTOMER' })
      ).rejects.toMatchObject({ status: 409, code: 'USER_EXISTS' });
    });

    it('register creates customer, hashes password, and returns tokens', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.user, 'create').mockResolvedValueOnce({
        id: 'usr-new-1',
        email: 'new@test.com',
        name: 'New Customer',
        role: 'CUSTOMER',
        sellerProfile: null
      } as any);

      const result = await AuthService.register({
        email: 'new@test.com',
        password: 'Password123!',
        name: 'New Customer',
        role: 'CUSTOMER'
      });

      expect(result.user.id).toBe('usr-new-1');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('login throws 401 if user does not exist', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      await expect(
        AuthService.login({ email: 'notfound@test.com', password: 'Password123!' })
      ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('login throws 401 if password does not match', async () => {
      const realHash = await hashPassword('CorrectPassword123!');
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'u1',
        email: 'user@test.com',
        passwordHash: realHash
      } as any);

      await expect(
        AuthService.login({ email: 'user@test.com', password: 'WrongPassword123!' })
      ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    });

    it('login succeeds with correct password and returns tokens', async () => {
      const password = 'CorrectPassword123!';
      const realHash = await hashPassword(password);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'u1',
        email: 'user@test.com',
        name: 'User One',
        role: 'CUSTOMER',
        passwordHash: realHash,
        sellerProfile: null
      } as any);

      const result = await AuthService.login({ email: 'user@test.com', password });
      expect(result.user.id).toBe('u1');
      expect(result.accessToken).toBeDefined();
    });
  });

  // =========================================================================
  // 2. CatalogService
  // =========================================================================
  describe('CatalogService', () => {
    it('createCategory throws 409 if category name or slug exists', async () => {
      vi.spyOn(prisma.category, 'findFirst').mockResolvedValueOnce({ id: 'c1' } as any);
      await expect(
        CatalogService.createCategory({ name: 'Audio', slug: 'audio' })
      ).rejects.toMatchObject({ status: 409, code: 'CATEGORY_EXISTS' });
    });

    it('createCategory creates and returns new category', async () => {
      vi.spyOn(prisma.category, 'findFirst').mockResolvedValueOnce(null);
      vi.spyOn(prisma.category, 'create').mockResolvedValueOnce({ id: 'c2', name: 'Audio', slug: 'audio' } as any);

      const cat = await CatalogService.createCategory({ name: 'Audio', slug: 'audio' });
      expect(cat.name).toBe('Audio');
    });

    it('getCategories returns category list ordered by name', async () => {
      vi.spyOn(prisma.category, 'findMany').mockResolvedValueOnce([
        { id: 'c1', name: 'Books', slug: 'books' },
        { id: 'c2', name: 'Computers', slug: 'computers' }
      ] as any);

      const categories = await CatalogService.getCategories();
      expect(categories.length).toBe(2);
      expect(categories[0].name).toBe('Books');
    });

    it('createProduct creates product with generated unique slug', async () => {
      vi.spyOn(prisma.product, 'create').mockResolvedValueOnce({
        id: 'prod-new-1',
        sellerId: 'sell-1',
        categoryId: 'cat-1',
        title: 'Noise Cancelling Headphones',
        slug: 'noise-cancelling-headphones-xyz',
        description: 'Premium headphones.',
        tags: ['headphones', 'audio'],
        seoTitle: null,
        seoDesc: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { name: 'Tech' },
        seller: { id: 's1', storeName: 'TechStore', rating: 4.9 }
      } as any);

      const product = await CatalogService.createProduct('sell-1', {
        categoryId: 'cat-1',
        title: 'Noise Cancelling Headphones',
        description: 'Premium headphones.',
        tags: ['headphones', 'audio'],
        status: 'ACTIVE'
      });

      expect(product.id).toBe('prod-new-1');
      expect(product.slug).toContain('noise-cancelling-headphones');
    });
  });

  // =========================================================================
  // 3. InventoryService
  // =========================================================================
  describe('InventoryService', () => {
    it('reserveStock throws 404 if inventory does not exist', async () => {
      const mockTx = {
        inventory: { findUnique: vi.fn().mockResolvedValue(null) }
      };
      await expect(
        InventoryService.reserveStock('var-missing', 2, mockTx)
      ).rejects.toMatchObject({ status: 404, code: 'INVENTORY_NOT_FOUND' });
    });

    it('reserveStock throws 400 INSUFFICIENT_STOCK if requested > available', async () => {
      const mockTx = {
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ variantId: 'var-1', quantity: 5, reservedQuantity: 4 })
        }
      };
      // Available = 5 - 4 = 1, requested = 2
      await expect(
        InventoryService.reserveStock('var-1', 2, mockTx)
      ).rejects.toMatchObject({ status: 400, code: 'INSUFFICIENT_STOCK' });
    });

    it('reserveStock increments reservedQuantity when available', async () => {
      const mockTx = {
        inventory: {
          findUnique: vi.fn().mockResolvedValue({ variantId: 'var-1', quantity: 10, reservedQuantity: 2 }),
          update: vi.fn().mockResolvedValue({ variantId: 'var-1', quantity: 10, reservedQuantity: 5 })
        }
      };

      const updated = await InventoryService.reserveStock('var-1', 3, mockTx);
      expect(mockTx.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: { reservedQuantity: { increment: 3 } }
      });
      expect(updated.reservedQuantity).toBe(5);
    });

    it('releaseStock decrements reservedQuantity', async () => {
      const mockTx = {
        inventory: {
          update: vi.fn().mockResolvedValue({ variantId: 'var-1', quantity: 10, reservedQuantity: 2 })
        }
      };

      await InventoryService.releaseStock('var-1', 3, mockTx);
      expect(mockTx.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: { reservedQuantity: { decrement: 3 } }
      });
    });

    it('deductStock decrements both quantity and reservedQuantity permanently', async () => {
      const mockTx = {
        inventory: {
          update: vi.fn().mockResolvedValue({ variantId: 'var-1', quantity: 7, reservedQuantity: 0 })
        }
      };

      await InventoryService.deductStock('var-1', 3, mockTx);
      expect(mockTx.inventory.update).toHaveBeenCalledWith({
        where: { variantId: 'var-1' },
        data: {
          quantity: { decrement: 3 },
          reservedQuantity: { decrement: 3 }
        }
      });
    });
  });

  // =========================================================================
  // 4. PaymentsService
  // =========================================================================
  describe('PaymentsService', () => {
    const testSecret = 'rzp_test_secret_key_12345';

    it('verifyWebhookSignature verifies valid HMAC-SHA256 signature', () => {
      const payload = JSON.stringify({ event: 'payment.captured', orderId: 'ord-1' });
      const signature = crypto.createHmac('sha256', testSecret).update(payload).digest('hex');

      const isValid = PaymentsService.verifyWebhookSignature(payload, signature, testSecret);
      expect(isValid).toBe(true);
    });

    it('verifyWebhookSignature rejects tampered body or forged signature', () => {
      const payload = JSON.stringify({ event: 'payment.captured', orderId: 'ord-1' });
      const badSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      const isValid = PaymentsService.verifyWebhookSignature(payload, badSignature, testSecret);
      expect(isValid).toBe(false);
    });

    it('verifyPaymentSignature verifies timing-safe equality', () => {
      const orderId = 'order_DA98124';
      const paymentId = 'pay_001923';
      const data = `${orderId}|${paymentId}`;
      const signature = crypto.createHmac('sha256', testSecret).update(data).digest('hex');

      const isValid = PaymentsService.verifySignature(orderId, paymentId, signature, testSecret);
      expect(isValid).toBe(true);
    });
  });

  // =========================================================================
  // 5. AI Services
  // =========================================================================
  describe('AI Services', () => {
    it('RecommendationEngineService provides fallbacks when DB errors', async () => {
      vi.spyOn(prisma.product, 'findMany').mockRejectedValueOnce(new Error('DB_OFFLINE'));

      const result = await RecommendationEngineService.getRecommendations();
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].title).toBe('Smart AI Camera Pro');
    });

    it('RecommendationEngineService maps active products when found', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'prod-active-1',
          title: 'Active Product',
          slug: 'active-product',
          category: { name: 'Audio' },
          variants: [{ price: 99.99, inventory: { quantity: 10 } }]
        }
      ] as any);

      const result = await RecommendationEngineService.getRecommendations();
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].title).toBe('Active Product');
      expect(result.recommendations[0].startingPrice).toBe(99.99);
    });

    it('InventoryIntelligenceService computes reorder quantities and high risk flags', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'prod-1',
          title: 'Mechanical Keyboard',
          variants: [
            {
              sku: 'KB-01',
              name: 'Clicky Blue',
              inventory: { quantity: 4, reorderPoint: 10 }
            }
          ]
        }
      ] as any);

      const result = await InventoryIntelligenceService.getInventoryForecast('seller-1');
      const variantReport = result.forecast[0].variants[0];
      expect(variantReport.stockoutRisk).toBe('HIGH');
      expect(variantReport.recommendedReorderQuantity).toBe(16); // (10 * 2) - 4
      expect(variantReport.aiAdvice).toContain('Stock level (4) is below threshold (10)');
    });

    it('AnomalyInvestigatorService detects refund rate spikes (> 10%)', async () => {
      vi.spyOn(prisma.order, 'count').mockResolvedValueOnce(100);
      vi.spyOn(prisma.refund, 'count').mockResolvedValueOnce(15); // 15% refund rate

      const report = await AnomalyInvestigatorService.investigateAnomalies();
      expect(report.systemStatus).toBe('ANOMALY_DETECTED');
      expect(report.anomalies.length).toBe(1);
      expect(report.anomalies[0].type).toBe('REFUND_RATE_SPIKE');
      expect(report.anomalies[0].severity).toBe('HIGH');
    });

    it('AnomalyInvestigatorService reports NORMAL when refund rate is below threshold', async () => {
      vi.spyOn(prisma.order, 'count').mockResolvedValueOnce(100);
      vi.spyOn(prisma.refund, 'count').mockResolvedValueOnce(2); // 2% refund rate

      const report = await AnomalyInvestigatorService.investigateAnomalies();
      expect(report.systemStatus).toBe('NORMAL');
      expect(report.anomalies.length).toBe(0);
    });
  });

  // =========================================================================
  // 6. AnalyticsService
  // =========================================================================
  describe('AnalyticsService', () => {
    it('getRevenueByProduct calculates total revenue per item', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'p1',
          title: 'T-Shirt',
          variants: [
            {
              id: 'v1',
              price: 1500,
              orderItems: [
                { quantity: 2, unitPrice: 1500 },
                { quantity: 1, unitPrice: 1500 }
              ]
            }
          ]
        }
      ] as any);

      const items = await AnalyticsService.getRevenueByProduct('seller-1');
      expect(items.length).toBe(1);
      expect(items[0].unitsSold).toBe(3);
      expect(items[0].revenue).toBe(4500);
    });

    it('askBusinessAnalyst answers revenue queries deterministically', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'p1',
          title: 'T-Shirt',
          variants: [
            {
              id: 'v1',
              price: 1500,
              orderItems: [{ quantity: 2, unitPrice: 1500 }]
            }
          ]
        }
      ] as any);

      const response = await AnalyticsService.askBusinessAnalyst('seller-1', 'What is my total revenue this month?');
      expect(response.toolExecuted).toBe('getRevenueByProduct');
      expect(response.executiveSummary).toContain('Business Analysis Executive Summary');
      expect(response.data).toBeDefined();
    });
  });

  // =========================================================================
  // 7. SQS Queue & Worker Services
  // =========================================================================
  describe('SQS Queue & Worker Services', () => {
    it('SQSWorker skips already processed events (idempotency check)', async () => {
      vi.spyOn(prisma.processedEvent, 'findUnique').mockResolvedValueOnce({
        eventId: 'evt-already-done',
        processedAt: new Date()
      } as any);

      const result = await SQSWorker.processEvent({
        eventId: 'evt-already-done',
        aggregateType: 'Order',
        aggregateId: 'ord-123',
        eventType: 'ORDER_CREATED',
        payload: { customerId: 'cust-1' },
        timestamp: new Date().toISOString()
      });

      expect(result.status).toBe('SKIPPED');
      expect(result.message).toContain('already processed');
    });

    it('SQSWorker processes ORDER_CREATED and marks event as processed in transaction', async () => {
      vi.spyOn(prisma.processedEvent, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (cb: any) => {
        const mockTx = {
          auditLog: { create: vi.fn().mockResolvedValue({}) },
          processedEvent: { create: vi.fn().mockResolvedValue({}) }
        };
        return cb(mockTx);
      });

      const result = await SQSWorker.processEvent({
        eventId: 'evt-new-1',
        aggregateType: 'Order',
        aggregateId: 'ord-123',
        eventType: 'ORDER_CREATED',
        payload: { customerId: 'cust-1' },
        timestamp: new Date().toISOString()
      });

      expect(result.status).toBe('PROCESSED');
      expect(result.eventId).toBe('evt-new-1');
    });

    it('OutboxPublisher returns 0 if no pending events in outbox', async () => {
      vi.spyOn(prisma.outbox, 'findMany').mockResolvedValueOnce([]);

      const result = await OutboxPublisher.publishPendingEvents();
      expect(result.publishedCount).toBe(0);
    });

    it('OutboxPublisher processes pending outbox events and updates status to PROCESSED', async () => {
      vi.spyOn(prisma.outbox, 'findMany').mockResolvedValueOnce([
        {
          id: 'outbox-1',
          aggregateType: 'Order',
          aggregateId: 'ord-100',
          eventType: 'ORDER_CREATED',
          payload: { customerId: 'cust-100' },
          status: 'PENDING',
          createdAt: new Date()
        }
      ] as any);

      vi.spyOn(prisma.outbox, 'update').mockResolvedValueOnce({
        id: 'outbox-1',
        status: 'PROCESSED'
      } as any);

      const result = await OutboxPublisher.publishPendingEvents();
      expect(result.publishedCount).toBe(1);
    });
  });
});
