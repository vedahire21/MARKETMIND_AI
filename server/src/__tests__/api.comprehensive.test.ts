import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { generateAccessToken } from '../shared/jwt';
import { prisma } from '../shared/prisma';

/**
 * Master API Endpoint Verification Suite
 * Tests every single Express endpoint across all 9 modules:
 * Health, Root, Auth, Catalog, Cart, Orders, Payments, AI, Reviews, Analytics
 */
describe('Comprehensive API Endpoints Suite', () => {
  const customerToken = generateAccessToken({
    userId: 'usr-test-cust-1',
    email: 'customer@test.com',
    role: 'CUSTOMER'
  });

  const sellerToken = generateAccessToken({
    userId: 'usr-test-sell-1',
    email: 'seller@test.com',
    role: 'SELLER',
    sellerId: 'sell-profile-1'
  });

  const adminToken = generateAccessToken({
    userId: 'usr-test-admin-1',
    email: 'admin@test.com',
    role: 'ADMIN'
  });

  // =========================================================================
  // 1. System Healthcheck & Root Endpoints
  // =========================================================================
  describe('System Endpoints', () => {
    it('GET /health returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.service).toContain('MarketMind AI');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/v1 returns 200 and welcome message with version', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('MarketMind AI');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  // =========================================================================
  // 2. Auth Endpoints (/api/v1/auth)
  // =========================================================================
  describe('Auth Endpoints (/api/v1/auth)', () => {
    it('POST /register rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'bad-email', password: 'Password123!', name: 'User' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /register rejects missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user@test.com', name: 'User' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /login rejects missing email or password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /refresh rejects empty refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('GET /me returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('GET /me returns 401 when malformed token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(res.status).toBe(401);
    });

    it('GET /me succeeds and returns user profile when valid token provided', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'usr-test-cust-1',
        email: 'customer@test.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        createdAt: new Date(),
        sellerProfile: null
      } as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('customer@test.com');
    });
  });

  // =========================================================================
  // 3. Catalog Endpoints (/api/v1/catalog)
  // =========================================================================
  describe('Catalog Endpoints (/api/v1/catalog)', () => {
    it('GET /categories returns 200 with category list', async () => {
      vi.spyOn(prisma.category, 'findMany').mockResolvedValueOnce([
        { id: 'cat-1', name: 'Electronics', slug: 'electronics' }
      ] as any);

      const res = await request(app).get('/api/v1/catalog/categories');
      expect(res.status).toBe(200);
      expect(res.body.categories).toBeDefined();
    });

    it('GET /products validates and coerces query parameters', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([]);
      vi.spyOn(prisma.product, 'count').mockResolvedValueOnce(0);

      const res = await request(app)
        .get('/api/v1/catalog/products')
        .query({ page: '1', limit: '10', minPrice: '100' });
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
    });

    it('POST /categories rejects unauthenticated request (401)', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .send({ name: 'Laptops', slug: 'laptops' });
      expect(res.status).toBe(401);
    });

    it('POST /categories rejects CUSTOMER role (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Laptops', slug: 'laptops' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('POST /products rejects non-seller role (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Laptop',
          description: 'A test laptop description.',
          tags: ['test']
        });
      expect(res.status).toBe(403);
    });

    it('POST /products rejects invalid payload even for SELLER (400)', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ title: '' }); // Missing required fields
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('PATCH /products/:productId/status rejects non-seller (403)', async () => {
      const res = await request(app)
        .patch('/api/v1/catalog/products/prod-1/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'ACTIVE' });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. Cart Endpoints (/api/v1/cart)
  // =========================================================================
  describe('Cart Endpoints (/api/v1/cart)', () => {
    it('GET /cart rejects unauthenticated request (401)', async () => {
      const res = await request(app).get('/api/v1/cart');
      expect(res.status).toBe(401);
    });

    it('POST /cart/items rejects invalid quantity (0 or negative)', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ variantId: '123e4567-e89b-12d3-a456-426614174000', quantity: -5 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('DELETE /cart/items/:variantId rejects unauthenticated request (401)', async () => {
      const res = await request(app).delete('/api/v1/cart/items/var-1');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 5. Orders Endpoints (/api/v1/orders)
  // =========================================================================
  describe('Orders Endpoints (/api/v1/orders)', () => {
    it('POST /checkout rejects unauthenticated request (401)', async () => {
      const res = await request(app).post('/api/v1/orders/checkout');
      expect(res.status).toBe(401);
    });

    it('POST /checkout rejects request without idempotencyKey (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ variantId: '123e4567-e89b-12d3-a456-426614174000', quantity: 1 }]
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('GET /my-orders rejects unauthenticated request (401)', async () => {
      const res = await request(app).get('/api/v1/orders/my-orders');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 6. Payments Endpoints (/api/v1/payments)
  // =========================================================================
  describe('Payments Endpoints (/api/v1/payments)', () => {
    it('POST /create-order rejects missing orderId (400)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /verify rejects missing razorpay signatures (400)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ razorpayOrderId: 'order_123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('POST /webhook rejects invalid or empty signature header (400/401)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .send({ event: 'payment.captured' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // =========================================================================
  // 7. AI Endpoints (/api/v1/ai)
  // =========================================================================
  describe('AI Endpoints (/api/v1/ai)', () => {
    it('GET /recommendations is accessible publicly (200)', async () => {
      const res = await request(app).get('/api/v1/ai/recommendations');
      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
    });

    it('POST /support/chat requires authentication (401)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/support/chat')
        .send({ query: 'Where is my package?' });
      expect(res.status).toBe(401);
    });

    it('POST /seller-copilot/generate rejects CUSTOMER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/seller-copilot/generate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rawNotes: 'Wireless keyboard with RGB',
          targetCategory: 'Electronics'
        });
      expect(res.status).toBe(403);
    });

    it('GET /anomalies/investigate rejects non-admin roles (403)', async () => {
      const res = await request(app)
        .get('/api/v1/ai/anomalies/investigate')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /anomalies/investigate allows ADMIN role (200)', async () => {
      vi.spyOn(prisma.order, 'count').mockResolvedValueOnce(10);
      vi.spyOn(prisma.refund, 'count').mockResolvedValueOnce(0);

      const res = await request(app)
        .get('/api/v1/ai/anomalies/investigate')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.systemStatus).toBeDefined();
    });
  });

  // =========================================================================
  // 8. Reviews Endpoints (/api/v1/reviews)
  // =========================================================================
  describe('Reviews Endpoints (/api/v1/reviews)', () => {
    it('GET /intelligence/:productId returns intelligence analysis (200)', async () => {
      vi.spyOn(prisma.review, 'findMany').mockResolvedValueOnce([]);

      const res = await request(app).get('/api/v1/reviews/intelligence/prod-123');
      expect(res.status).toBe(200);
      expect(res.body.productId).toBe('prod-123');
      expect(res.body.sentiment).toBeDefined();
    });

    it('POST /reviews requires authentication (401)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .send({ productId: 'prod-123', rating: 5, comment: 'Great product!' });
      expect(res.status).toBe(401);
    });

    it('POST /reviews rejects invalid rating (> 5) (400)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: '123e4567-e89b-12d3-a456-426614174000', rating: 10, comment: 'Too high' });
      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // 9. Analytics Endpoints (/api/v1/analytics)
  // =========================================================================
  describe('Analytics Endpoints (/api/v1/analytics)', () => {
    it('GET /revenue rejects CUSTOMER role (403)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/revenue')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('POST /ask rejects CUSTOMER role (403)', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ask')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ query: 'What was my highest selling item?' });
      expect(res.status).toBe(403);
    });

    it('POST /ask rejects empty query string for SELLER (400)', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ask')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ query: '' });
      expect(res.status).toBe(400);
    });
  });
});
