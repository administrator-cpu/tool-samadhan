import { withTransaction } from '../config/database.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { logger } from '../lib/logger.js';
import { postgresPool } from '../config/database.js';

export class AssignmentService {
  static async assignAgentAutomatically(ticketId: string, categoryId: string): Promise<string | null> {
    const client = await postgresPool.connect();
    let assignedEmployeeId: string | null = null;
    
    try {
      await client.query('BEGIN');

      // 1. Lock the ticket
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      if (ticket.current_assigned_employee_id) {
        logger.info(`Ticket ${ticketId} is already assigned.`);
        await client.query('ROLLBACK');
        return ticket.current_assigned_employee_id;
      }

      // 2. Find best agent (least active tickets in OPEN/IN_PROGRESS/ON_HOLD/ESCALATED) for this category
      const bestAgent = await EmployeeRepository.findBestAgentForCategory(client, categoryId);

      if (bestAgent) {
        assignedEmployeeId = bestAgent.employee_id;
        
        // 3. Assign the ticket
        await TicketRepository.updateFields(client, ticketId, {
          current_assigned_employee_id: assignedEmployeeId
        });

        logger.info(`Assigned Ticket ${ticketId} to Employee ${assignedEmployeeId}`);
      } else {
        logger.warn(`No suitable agent found for Ticket ${ticketId} in category ${categoryId}`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Error assigning agent automatically:', err);
      throw err;
    } finally {
      client.release();
    }
    
    return assignedEmployeeId;
  }
}
