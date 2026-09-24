import { describe, it, expect } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../jwt';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@marketmind.ai',
    role: 'CUSTOMER' as const
  };

  it('should generate and verify valid access tokens', () => {
    const token = generateAccessToken(mockPayload);
    expect(token).toBeTypeOf('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  it('should generate and verify valid refresh tokens', () => {
    const token = generateRefreshToken(mockPayload);
    expect(token).toBeTypeOf('string');

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
  });

  it('should throw error for malformed token', () => {
    expect(() => verifyAccessToken('invalid.token.string')).toThrow();
  });
});
