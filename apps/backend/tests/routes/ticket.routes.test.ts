import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/app.js';
import { TicketService } from '../../src/services/ticket.service.js';
import { UserRole } from '../../src/types/dto.js';

// Mock the middleware natively with vi. Vitest will successfully intercept this!
vi.mock('../../src/middleware/auth.middleware.js', () => {
  return {
    requireAuth: (req: any, res: any, next: any) => {
      // Default to an ADMIN user for tests
      req.user = req.user || { userId: '1', role: UserRole.ADMIN };
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

vi.mock('../../src/services/ticket.service.js', () => ({
  TicketService: {
    createTicket: vi.fn(),
    updateTicketStatus: vi.fn()
  }
}));

describe('Ticket Routes (/api/tickets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/tickets', () => {
    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ customerId: 'cust-1' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 201 when ticket is created successfully', async () => {
      vi.mocked(TicketService.createTicket).mockResolvedValue({
        id: 't-123',
        ticket_no: 'TKT-123'
      } as any);

      const res = await request(app)
        .post('/api/tickets')
        .send({
          customerId: 'cust-1',
          issueCategoryId: 'cat-1',
          circuitDescription: 'Fiber cut',
          message: 'Internet is down'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('t-123');
      expect(TicketService.createTicket).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/tickets/:id/status', () => {
    it('should return 400 if status is invalid', async () => {
      const res = await request(app)
        .patch('/api/tickets/1/status')
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 on success', async () => {
      vi.mocked(TicketService.updateTicketStatus).mockResolvedValue({
        id: '1',
        status: 'RESOLVED'
      } as any);

      const res = await request(app)
        .patch('/api/tickets/1/status')
        .send({ status: 'RESOLVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe('RESOLVED');
    });
  });
});
