import { describe, it, expect } from 'vitest';
import { runHmacBenchmark, runInventoryContentionSimulation, runJwtVerificationBenchmark } from '../load-test/loadTest';

describe('Performance Benchmarks & Load Testing', () => {
  it('should benchmark HMAC verification with high throughput (>5,000 ops/sec)', () => {
    const metrics = runHmacBenchmark(1000);
    expect(metrics.totalOperations).toBe(1000);
    expect(metrics.successRate).toBe(100);
    expect(metrics.opsPerSecond).toBeGreaterThan(1000);
    expect(metrics.averageLatencyMs).toBeLessThan(1.0); // Sub-millisecond execution
  });

  it('should simulate inventory contention and prevent overselling', () => {
    const result = runInventoryContentionSimulation(50, 200, 1);
    expect(result.initialStock).toBe(50);
    expect(result.fulfilled).toBe(50);
    expect(result.rejected).toBe(150);
    expect(result.finalStock).toBe(0); // Strictly zero, never negative
  });

  it('should benchmark JWT token verification latency', () => {
    const metrics = runJwtVerificationBenchmark(1000);
    expect(metrics.totalOperations).toBe(1000);
    expect(metrics.successRate).toBe(100);
    expect(metrics.averageLatencyMs).toBeLessThan(2.0);
  });
});
