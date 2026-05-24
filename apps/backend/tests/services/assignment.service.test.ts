import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentService } from '../../src/services/assignment.service.js';
import { TicketRepository } from '../../src/repositories/ticket.repository.js';
import { EmployeeRepository } from '../../src/repositories/employee.repository.js';

// Mock the repositories natively with vi
vi.mock('../../src/repositories/ticket.repository.js');
vi.mock('../../src/repositories/employee.repository.js');

describe('AssignmentService', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock DB client
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    } as any;
  });

  describe('assignAgentAutomatically', () => {
    it('should throw an error if the ticket is not found', async () => {
      vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue(null);

      await expect(
        AssignmentService.assignAgentAutomatically(mockClient, '123', 'cat-1')
      ).rejects.toThrow('Ticket 123 not found');
    });

    it('should return the assigned employee ID immediately if ticket is already assigned', async () => {
      vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
        id: '123',
        current_assigned_employee_id: 'emp-99'
      });

      const result = await AssignmentService.assignAgentAutomatically(mockClient, '123', 'cat-1');
      
      expect(result).toBe('emp-99');
      // Ensure we didn't try to find a new agent
      expect(EmployeeRepository.findBestAgentForCategory).not.toHaveBeenCalled();
    });

    it('should assign the best agent and update the ticket if an agent is found', async () => {
      vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
        id: '123',
        current_assigned_employee_id: null
      });

      vi.mocked(EmployeeRepository.findBestAgentForCategory).mockResolvedValue({
        employee_id: 'emp-42'
      });

      const result = await AssignmentService.assignAgentAutomatically(mockClient, '123', 'cat-1');

      expect(result).toBe('emp-42');
      expect(TicketRepository.updateFields).toHaveBeenCalledWith(mockClient, '123', {
        current_assigned_employee_id: 'emp-42'
      });
    });

    it('should return null if no suitable agent is found', async () => {
      vi.mocked(TicketRepository.findByIdForUpdate).mockResolvedValue({
        id: '123',
        current_assigned_employee_id: null
      });

      // No agents available
      vi.mocked(EmployeeRepository.findBestAgentForCategory).mockResolvedValue(null);

      const result = await AssignmentService.assignAgentAutomatically(mockClient, '123', 'cat-1');

      expect(result).toBeNull();
      expect(TicketRepository.updateFields).not.toHaveBeenCalled();
    });
  });
});
