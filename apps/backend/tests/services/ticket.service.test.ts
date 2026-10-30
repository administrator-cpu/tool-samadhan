import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../../src/services/ticket.service.js';
import { TicketRepository } from '../../src/repositories/ticket.repository.js';
import { TicketEventRepository } from '../../src/repositories/ticket-event.repository.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { CustomerRepository } from '../../src/repositories/customer.repository.js';
import ticketEventEmitter from '../../src/lib/event-emitter.js';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCodes } from '../../src/errors/error-codes.js';
import { UserRole } from '../../src/types/dto.js';

// Mock dependencies natively with vi
vi.mock('../../src/repositories/ticket.repository.js');
vi.mock('../../src/repositories/ticket-event.repository.js');
vi.mock('../../src/repositories/user.repository.js');
vi.mock('../../src/repositories/customer.repository.js');
vi.mock('../../src/services/email.service.js');
vi.mock('../../src/lib/event-emitter.js');

vi.mock('../../src/config/database.js', () => ({
  withTransaction: vi.fn(async (cb: any) => {
    const mockClient = { query: vi.fn() };
    return cb(mockClient);
  }),
  db: {
    transaction: vi.fn(async (cb: any) => {
      const mockTx = { query: vi.fn() };
      return cb(mockTx);
    }),
  },
  postgresPool: { connect: vi.fn() }
}));

describe('TicketService - updateTicketRca', () => {
  const MOCK_TICKET_ID = 't-123';
  const MOCK_ACTOR_ID = 'u-456';
  const MOCK_RCA = 'The server ran out of memory.';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if ticket is not found', async () => {
    vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue(null);

    await expect(
      TicketService.updateTicketRca(MOCK_TICKET_ID, MOCK_RCA, [], [], MOCK_ACTOR_ID)
    ).rejects.toThrow(AppError);
  });

  it('should throw an error if ticket is already closed', async () => {
    vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
      status: 'CLOSED'
    } as any);

    await expect(
      TicketService.updateTicketRca(MOCK_TICKET_ID, MOCK_RCA, [], [], MOCK_ACTOR_ID)
    ).rejects.toThrow('Cannot update RCA for a closed ticket');
  });

  it('should update RCA normally if ticket is RESOLVED but under 24 hours', async () => {
    // Mock resolved_at to be exactly 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
      status: 'RESOLVED',
      resolved_at: twoHoursAgo
    } as any);

    vi.mocked(TicketRepository.updateFields).mockResolvedValue({ id: MOCK_TICKET_ID, rca: MOCK_RCA } as any);
    vi.mocked(TicketEventRepository.insertEvent).mockResolvedValue({ id: 'evt-1' } as any);

    await TicketService.updateTicketRca(MOCK_TICKET_ID, MOCK_RCA, [], [], MOCK_ACTOR_ID);

    // Verify it only updated RCA and did NOT auto-close
    expect(TicketRepository.updateFields).toHaveBeenCalledWith(
      expect.anything(),
      MOCK_TICKET_ID,
      { rca: MOCK_RCA, rca_images: '[]' }
    );

    // Verify only the RCA event was emitted, no STATUS_CHANGED
    expect(ticketEventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(ticketEventEmitter.emit).toHaveBeenCalledWith('ticket_updated', expect.objectContaining({
      data: expect.objectContaining({ type: 'TICKET_RCA_UPDATED' })
    }));
  });

  it('should auto-close the ticket if it has been RESOLVED for over 24 hours', async () => {
    // Mock resolved_at to be 48 hours ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
      status: 'RESOLVED',
      resolved_at: fortyEightHoursAgo
    } as any);

    vi.mocked(TicketRepository.updateFields).mockResolvedValue({ id: MOCK_TICKET_ID, status: 'CLOSED' } as any);
    vi.mocked(TicketEventRepository.insertEvent).mockResolvedValue({ id: 'evt-1' } as any);

    await TicketService.updateTicketRca(MOCK_TICKET_ID, MOCK_RCA, [], [], MOCK_ACTOR_ID);

    // Verify it updated RCA AND bundled the CLOSED status
    expect(TicketRepository.updateFields).toHaveBeenCalledWith(
      expect.anything(),
      MOCK_TICKET_ID,
      expect.objectContaining({
        rca: MOCK_RCA,
        rca_images: '[]',
        status: 'CLOSED',
        allow_customer_reply: false,
        closed_at: expect.any(Date)
      })
    );

    // Verify both socket events were emitted
    expect(ticketEventEmitter.emit).toHaveBeenCalledTimes(2);
  });
});

describe('TicketService - createTicket with inactive user status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw CUSTOMER_INACTIVE when sales creates a ticket for an inactive customer email', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue({
      id: 'cust-user-1',
      role: UserRole.USER,
      is_active: false,
    } as any);

    await expect(
      TicketService.createTicket(
        { customerEmail: 'inactive@customer.com', issueCategoryId: '1' },
        'sales-user-1',
        UserRole.SALES
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      code: ErrorCodes.CUSTOMER_INACTIVE,
      message: 'Customer account is inactive.',
    });
  });

  it('should throw ACCOUNT_INACTIVE when an inactive user tries to create a ticket', async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue({
      id: 'cust-user-1',
      role: UserRole.USER,
      is_active: false,
    } as any);

    await expect(
      TicketService.createTicket(
        { issueCategoryId: '1' },
        'cust-user-1',
        UserRole.USER
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      code: ErrorCodes.ACCOUNT_INACTIVE,
      message: 'Your account has been deactivated. Please contact support.',
    });
  });
});
