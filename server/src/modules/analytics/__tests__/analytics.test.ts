import { describe, it, expect } from 'vitest';
import { AskBusinessAnalystSchema } from '../analytics.schema';
import { AnalyticsService } from '../analytics.service';

describe('Business Analyst Agent Suite', () => {
  it('should validate valid AskBusinessAnalyst input', () => {
    const valid = AskBusinessAnalystSchema.safeParse({
      query: 'Which products generated the most revenue this month?'
    });
    expect(valid.success).toBe(true);
  });

  it('should process natural language prompt via allowlisted tools without raw SQL', async () => {
    const result = await AnalyticsService.askBusinessAnalyst('seller-1', 'Show me revenue by product');
    expect(result.toolExecuted).toBe('getRevenueByProduct');
    expect(result.executiveSummary).toContain('Business Analysis Executive Summary');
  });
});
