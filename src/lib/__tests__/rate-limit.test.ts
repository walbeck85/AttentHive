// src/lib/__tests__/rate-limit.test.ts
//
// Unit tests for the rate limiting utility.
// Upstash modules are globally mocked in jest.setup.ts to handle ESM issues

import {
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
  type RateLimitResult,
} from '../rate-limit';

describe('rate-limit utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should return success when limiter is null (test environment skips rate limiting)', async () => {
      // In test environment (NODE_ENV=test), rate limiting is automatically skipped
      // This test verifies the behavior when the limiter is null
      const result = await checkRateLimit(null, 'test-identifier');

      expect(result).toEqual({
        success: true,
        limit: 0,
        remaining: 0,
        reset: 0,
      });
    });

    it('should return success structure with correct shape', async () => {
      const result = await checkRateLimit(null, 'another-identifier');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.reset).toBe('number');
    });
  });

  describe('rateLimitResponse', () => {
    it('should return a 429 response with correct headers', () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000, // 60 seconds from now
      };

      const response = rateLimitResponse(mockResult);

      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('should return a positive Retry-After value', () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 30000, // 30 seconds from now
      };

      const response = rateLimitResponse(mockResult);
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should default to 60 seconds for Retry-After if reset is in the past', () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() - 1000, // 1 second in the past
      };

      const response = rateLimitResponse(mockResult);
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);

      expect(retryAfter).toBe(60);
    });

    it('should return a response with JSON content type', () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      };

      const response = rateLimitResponse(mockResult);

      // Verify it's a proper response with JSON content type
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '203.0.113.50',
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe('203.0.113.50');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '198.51.100.25',
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe('198.51.100.25');
    });

    it('should return "unknown" when no IP headers are present', () => {
      const request = new Request('https://example.com');

      const ip = getClientIp(request);

      expect(ip).toBe('unknown');
    });

    it('should prefer x-forwarded-for over other headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'cf-connecting-ip': '203.0.113.50',
          'x-real-ip': '198.51.100.25',
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should trim whitespace from IP addresses', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
        },
      });

      const ip = getClientIp(request);

      expect(ip).toBe('192.168.1.1');
    });
  });
});
