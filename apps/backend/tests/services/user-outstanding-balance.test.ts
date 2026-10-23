import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserService } from '../../src/services/user.service.js';

describe('UserService BahiKhata Outstanding Balance Resilience', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getOutstandingBalance', () => {
    it('should return null without throwing when fetch fails with network error (TypeError: fetch failed)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause: new Error('connect ECONNREFUSED') }));

      const balance = await UserService.getOutstandingBalance('TEST CUSTOMER');
      expect(balance).toBeNull();
    });

    it('should return null when BahiKhata returns 404 Not Found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'fail', matchFound: false, message: 'Not found' }),
      } as any);

      const balance = await UserService.getOutstandingBalance('UNKNOWN CUSTOMER');
      expect(balance).toBeNull();
    });

    it('should return null when BahiKhata returns 502/500 HTML error page', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>502 Bad Gateway</html>',
      } as any);

      const balance = await UserService.getOutstandingBalance('TEST CUSTOMER');
      expect(balance).toBeNull();
    });

    it('should return the outstanding balance when match is found with valid data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'success',
          matchFound: true,
          data: {
            companyName: 'ACME CORP',
            totalOutstanding: 15420.5,
          },
        }),
      } as any);

      const balance = await UserService.getOutstandingBalance('ACME CORP');
      expect(balance).toBe(15420.5);
    });

    it('should return null if customer name is empty or only whitespace', async () => {
      const balance = await UserService.getOutstandingBalance('   ');
      expect(balance).toBeNull();
    });
  });

  describe('getAllOutstandingBalances', () => {
    it('should return an empty map or fallback without throwing when fetch fails', async () => {
      // Invalidate cache to test fresh fetch
      (UserService as any).cacheExpiresAt = 0;
      (UserService as any).outstandingCache = null;

      global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND') }));

      const map = await UserService.getAllOutstandingBalances();
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(0);
    });
  });
});
