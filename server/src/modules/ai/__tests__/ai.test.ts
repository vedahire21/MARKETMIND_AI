import { describe, it, expect } from 'vitest';
import { SellerCopilotSchema, ApproveProductListingSchema } from '../ai.schema';
import { SupportAgentService } from '../supportAgent.service';
import { RecommendationEngineService } from '../recommendationEngine.service';

describe('Complete AI Suite Test Plan', () => {
  it('should validate valid SellerCopilot input schema', () => {
    const valid = SellerCopilotSchema.safeParse({
      productName: 'Wireless Noise Cancelling Headphones',
      category: 'Electronics',
      roughNotes: 'Over-ear design with 40-hour battery life and fast charging.'
    });
    expect(valid.success).toBe(true);
  });

  it('should validate Customer Support Policy tool lookup', async () => {
    const policyResult = await SupportAgentService.getStorePolicy('returns');
    expect(policyResult.topic).toBe('returns');
    expect(policyResult.policy).toContain('30 days');
  });

  it('should handle Customer Support Chat queries', async () => {
    const response = await SupportAgentService.handleSupportQuery('user-1', 'What is your shipping policy?');
    expect(response.toolExecuted).toBe(true);
    expect(response.response).toContain('shipping');
  });

  it('should return hybrid recommendations list', async () => {
    const result = await RecommendationEngineService.getRecommendations(undefined, undefined, 3);
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});
