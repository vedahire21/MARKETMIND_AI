import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from '../rateLimiter';

describe('Sliding Window Rate Limiter Middleware', () => {
  it('should allow requests within limit', () => {
    const rateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
    const req: any = { ip: '127.0.0.1', path: '/test-route' };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should block requests exceeding max limit with 429 status', () => {
    const rateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });
    const req: any = { ip: '10.0.0.1', path: '/rate-limit-test' };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    // 1st request succeeds
    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // 2nd request gets blocked
    rateLimiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TOO_MANY_REQUESTS' }));
  });
});
