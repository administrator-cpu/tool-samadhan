import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/app.js';
import { AuthService } from '../../src/services/auth.service.js';
import { AppError } from '../../src/errors/AppError.js';

// Mock the AuthService natively with vi
vi.mock('../../src/services/auth.service.js', () => ({
  AuthService: {
    loginUser: vi.fn(),
    refreshSession: vi.fn(),
    logoutSession: vi.fn()
  }
}));

describe('Auth Routes (/api/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/login', () => {
    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on invalid credentials', async () => {
      vi.mocked(AuthService.loginUser).mockRejectedValue(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );

      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it('should return 403 when user account is inactive', async () => {
      vi.mocked(AuthService.loginUser).mockRejectedValue(
        new AppError(403, 'Your account has been deactivated. Please contact support.', 'ACCOUNT_INACTIVE')
      );

      const res = await request(app)
        .post('/api/login')
        .send({ email: 'inactive@example.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/account has been deactivated/i);
    });

    it('should return 200 and set refreshToken cookie on success', async () => {
      const mockResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', name: 'Test User' }
      };

      vi.mocked(AuthService.loginUser).mockResolvedValue(mockResult as any);

      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.body.data.user.name).toBe('Test User');
      
      expect(res.headers['set-cookie']).toBeDefined();
      expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/refreshToken=mock-refresh-token/);
    });
  });

  describe('POST /api/refresh', () => {
    it('should return 401 when no token is provided (empty request)', async () => {
      const res = await request(app)
        .post('/api/refresh')
        .send();

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Refresh token required/i);
    });

    it('should return 401 when empty body is sent', async () => {
      const res = await request(app)
        .post('/api/refresh')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Refresh token required/i);
    });

    it('should return 200 and refresh session via cookie', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '1', name: 'Test User' }
      };
      vi.mocked(AuthService.refreshSession).mockResolvedValue(mockResult as any);

      const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', ['refreshToken=valid-cookie-token'])
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('new-access-token');
      expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/refreshToken=new-refresh-token/);
      expect(AuthService.refreshSession).toHaveBeenCalledWith('valid-cookie-token', expect.any(Object));
    });

    it('should return 200 and refresh session via request body', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '1', name: 'Test User' }
      };
      vi.mocked(AuthService.refreshSession).mockResolvedValue(mockResult as any);

      const res = await request(app)
        .post('/api/refresh')
        .send({ refreshToken: 'valid-body-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refreshToken).toBe('new-refresh-token');
      expect(AuthService.refreshSession).toHaveBeenCalledWith('valid-body-token', expect.any(Object));
    });

    it('should return 403 when user account is inactive during refresh', async () => {
      vi.mocked(AuthService.refreshSession).mockRejectedValue(
        new AppError(403, 'Your account has been deactivated. Please contact support.', 'ACCOUNT_INACTIVE')
      );

      const res = await request(app)
        .post('/api/refresh')
        .set('Cookie', ['refreshToken=valid-cookie-token'])
        .send();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/account has been deactivated/i);
    });

    it('should return 200 and refresh session via X-Refresh-Token header', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '1', name: 'Test User' }
      };
      vi.mocked(AuthService.refreshSession).mockResolvedValue(mockResult as any);

      const res = await request(app)
        .post('/api/refresh')
        .set('X-Refresh-Token', 'valid-header-token')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(AuthService.refreshSession).toHaveBeenCalledWith('valid-header-token', expect.any(Object));
    });
  });

  describe('POST /api/logout', () => {
    it('should return 200 and clear cookies', async () => {
      vi.mocked(AuthService.logoutSession).mockResolvedValue(undefined as any);

      const res = await request(app)
        .post('/api/logout')
        .set('Cookie', ['refreshToken=mock-refresh-token'])
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/refreshToken=;/);
    });
  });
});
