import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/app.js';
import { UserService } from '../../src/services/user.service.js';
import { UserRole } from '../../src/types/dto.js';

let currentUserRole: UserRole = UserRole.ADMIN;

vi.mock('../../src/middleware/auth.middleware.js', () => {
  return {
    requireAuth: (req: any, res: any, next: any) => {
      req.user = { userId: '1', role: currentUserRole };
      next();
    },
    requireRole: (allowedRoles: any[]) => {
      return (req: any, res: any, next: any) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        next();
      };
    }
  };
});

vi.mock('../../src/services/user.service.js', () => ({
  UserService: {
    updateCustomerStatus: vi.fn(),
  }
}));

describe('Customer Status Route (PATCH /api/users/customers/:id/status)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserRole = UserRole.ADMIN;
  });

  it('should return 400 if is_active is not a boolean', async () => {
    const res = await request(app)
      .patch('/api/users/customers/10/status')
      .send({ is_active: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/is_active \(boolean\) is required/i);
  });

  it('should return 403 if caller is not an ADMIN', async () => {
    currentUserRole = UserRole.USER;

    const res = await request(app)
      .patch('/api/users/customers/10/status')
      .send({ is_active: false });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 200 and deactivate customer successfully', async () => {
    vi.mocked(UserService.updateCustomerStatus).mockResolvedValue({
      customer_row_id: 10,
      user_id: '55',
      is_active: false,
    });

    const res = await request(app)
      .patch('/api/users/customers/10/status')
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Customer deactivated successfully/i);
    expect(res.body.data.is_active).toBe(false);
    expect(UserService.updateCustomerStatus).toHaveBeenCalledWith('10', false);
  });

  it('should return 200 and activate customer successfully', async () => {
    vi.mocked(UserService.updateCustomerStatus).mockResolvedValue({
      customer_row_id: 10,
      user_id: '55',
      is_active: true,
    });

    const res = await request(app)
      .patch('/api/users/customers/10/status')
      .send({ is_active: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Customer activated successfully/i);
    expect(res.body.data.is_active).toBe(true);
    expect(UserService.updateCustomerStatus).toHaveBeenCalledWith('10', true);
  });
});
