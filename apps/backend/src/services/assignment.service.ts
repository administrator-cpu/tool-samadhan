import { EmployeeRepository } from '../repositories/employee.repository.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { logger } from '../lib/logger.js';
export class AssignmentService {
  static async assignAgentAutomatically(tx: any, ticketId: string, categoryId: string): Promise<string | null> {
    let assignedEmployeeId: string | null = null;
    
    // 1. Lock the ticket
    const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    if (ticket.current_assigned_employee_id) {
      logger.info(`Ticket ${ticketId} is already assigned.`);
      return ticket.current_assigned_employee_id;
    }

    // 2. Check for recent ticket by same customer and same category today
    const recentAgentId = await TicketRepository.findRecentAssignedAgentForCustomerAndCategory(
      tx,
      String(ticket.customer_id),
      categoryId,
      ticketId
    );

    if (recentAgentId) {
      assignedEmployeeId = recentAgentId;
      logger.info(`Assigning to recent agent ${assignedEmployeeId} for Ticket ${ticketId} based on today's history.`);
    } else {
      // 3. Find best agent (least active tickets in OPEN/IN_PROGRESS/ESCALATED) for this category
      const bestAgent = await EmployeeRepository.findBestAgentForCategory(tx, categoryId);
      if (bestAgent) {
        assignedEmployeeId = bestAgent.employee_id;
      } else {
        logger.warn(`No suitable agent found for Ticket ${ticketId} in category ${categoryId}`);
      }
    }

    if (assignedEmployeeId) {
      // 4. Assign the ticket
      const updates: any = {
        current_assigned_employee_id: assignedEmployeeId
      };
      if (ticket.status === 'OPEN') {
        updates.status = 'IN_PROGRESS';
      }
      await TicketRepository.updateFields(tx, ticketId, updates);

      logger.info(`Assigned Ticket ${ticketId} to Employee ${assignedEmployeeId}`);
    }
    
    return assignedEmployeeId;
  }
}
