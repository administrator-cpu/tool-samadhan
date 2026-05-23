import { withTransaction, postgresPool } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AssignmentService } from './assignment.service.js';
import { sendTicketConfirmationEmail, sendTicketCreatedHelpdeskEmail, sendImmediateAgentAssignmentEmails, sendTicketUpdateEmail, sendTicketStatusUpdateEmail, sendTicketRcaEmail } from './email.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { UserRole } from '../types/dto.js';
import { ticketAutomationQueue } from '../config/redis.js';
import { logger } from '../lib/logger.js';

export class TicketService {
  static async createTicket(dto: any, actorUserId: string, actorRole: string) {
    return withTransaction(async (client) => {
      let customerId: string | null = null;

      if (actorRole === UserRole.USER) {
        const cust = await CustomerRepository.findByUserId(client, actorUserId);
        if (!cust) throw new AppError(404, 'Customer record not found', ErrorCodes.CUSTOMER_NOT_FOUND);
        customerId = cust.id;
      } else {
        customerId = dto.customerId;
      }

      if (!customerId) throw new AppError(400, 'Customer ID is required', ErrorCodes.VALIDATION_ERROR);

      const ticket = await TicketRepository.create(client, {
        customerId: customerId as string,
        createdByUserId: actorRole !== UserRole.USER ? actorUserId : null,
        assignedEmployeeId: null,
        issueCategoryId: dto.issueCategoryId,
        circuitDescription: dto.circuitDescription ? String(dto.circuitDescription) : '',
      });

      const initialMessage = dto.message || `Ticket created by ${actorRole === UserRole.USER ? 'customer' : 'staff'}.`;
      await TicketEventRepository.insertEvent(client, {
        ticket_id: ticket.id,
        actor_user_id: actorUserId,
        event_type: 'TICKET_CREATED',
        message: initialMessage,
        metadata: { source: 'WEB' },
        visible_to_customer: true
      });

      const assignedAgentId = await AssignmentService.assignAgentAutomatically(client, ticket.id, dto.issueCategoryId);

      if (assignedAgentId) {
        await TicketEventRepository.insertEvent(client, {
          ticket_id: ticket.id,
          actor_user_id: null,
          event_type: 'TICKET_ASSIGNED',
          message: 'Ticket automatically assigned to an agent based on issue category.',
          metadata: { assigned_to: assignedAgentId },
          visible_to_customer: true
        });
      }

      const info = await TicketRepository.getCustomerContactInfo(client, ticket.id);
      
      if (info) {
        if (!assignedAgentId) {
          await sendTicketConfirmationEmail({ name: info.name, email: info.email, ticketNo: info.ticket_no });
          await sendTicketCreatedHelpdeskEmail({
            customerName: info.name,
            ticketNo: info.ticket_no,
            category: info.category,
            circuitId: info.circuit_description
          });
          
          await ticketAutomationQueue.add(
            'AGENT_ASSIGNMENT_CHECK',
            { ticketId: ticket.id },
            { delay: 2 * 60 * 1000 }
          );
        } else {
          const agent = await EmployeeRepository.findByRowId(client, assignedAgentId);
          if (agent) {
             const agentUser = await UserRepository.findById(client, agent.user_id);
             if (agentUser) {
               await sendImmediateAgentAssignmentEmails({
                 customerName: info.name,
                 agentName: agentUser.name,
                 agentEmail: agentUser.email,
                 ticketNo: info.ticket_no,
                 category: info.category,
                 circuitId: info.circuit_description
               });
             }
          }
        }
      }

      await ticketAutomationQueue.add('TROUBLESHOOTING_UPDATE', { ticketId: ticket.id }, { delay: 15 * 60 * 1000 });
      await ticketAutomationQueue.add('FINAL_ACTIVITY_CHECK', { ticketId: ticket.id }, { delay: 45 * 60 * 1000 });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId: ticket.id,
        data: { type: 'TICKET_CREATED', ticket }
      });

      return { ticket, assignedAgentId };
    });
  }

  static async listUserTickets(userId: string, role: string, page: number, limit: number, filters: any) {
    const client = await postgresPool.connect();
    try {
      const offset = (page - 1) * limit;
      const queryFilters: any = { statusGroup: filters.statusGroup };

      if (role === UserRole.USER) {
        const cust = await CustomerRepository.findByUserId(client, userId);
        if (!cust) return { tickets: [], total: 0, pages: 0, currentPage: page, limit };
        queryFilters.customerId = cust.id;
      } else if (role === UserRole.SUPPORT_AGENT) {
        const emp = await EmployeeRepository.findByUserId(client, userId);
        if (!emp) return { tickets: [], total: 0, pages: 0, currentPage: page, limit };
        queryFilters.employeeId = emp.id;
      } else if (role === UserRole.SALES) {
        queryFilters.salesUserId = userId;
      }

      if (['ADMIN', 'MANAGER'].includes(role)) {
        if (filters.ownership) queryFilters.ownership = filters.ownership;
        if (filters.agentId) queryFilters.employeeId = filters.agentId;
      }

      const { tickets, total } = await TicketRepository.findUserTickets(client, queryFilters, limit, offset);
      
      return {
        tickets,
        pagination: { total, pages: Math.ceil(total / limit), currentPage: page, limit }
      };
    } finally {
      client.release();
    }
  }

  static async getTicketTimeline(ticketId: string, userId: string, role: string, afterEventId?: string, limit: number = 200) {
    const client = await postgresPool.connect();
    try {
      const ticketInfo = await TicketRepository.findTicketTimelineInfo(client, ticketId);
      if (!ticketInfo) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      if (role === UserRole.USER && !await TicketRepository.checkCustomerOwnership(client, ticketInfo.customer_row_id, userId)) {
        throw new AppError(403, 'You do not have access to this ticket', ErrorCodes.FORBIDDEN);
      }
      
      if (role === UserRole.SUPPORT_AGENT) {
        const emp = await EmployeeRepository.findByUserId(client, userId);
        if (ticketInfo.current_assigned_employee_id !== emp?.id) {
          throw new AppError(403, 'You are not assigned to this ticket', ErrorCodes.FORBIDDEN);
        }
      }

      let events = [];
      let hasMore = false;
      
      if (afterEventId) {
        const eventRes = await TicketEventRepository.findMissedEvents(postgresPool, ticketId, afterEventId, limit);
        events = eventRes.events;
        hasMore = eventRes.hasMore;
      } else {
        events = await TicketEventRepository.findByTicketId(client, ticketId, role === UserRole.USER);
      }

      const formattedTicket = {
        ...ticketInfo,
        customer: {
          name: ticketInfo.customer_name,
          customer_id: ticketInfo.customer_id,
          email: ticketInfo.customer_email
        },
        assigned_employee: ticketInfo.current_assigned_employee_id ? {
          name: ticketInfo.assigned_employee_name
        } : null
      };

      return {
        ticket: formattedTicket,
        events,
        hasMore
      };
    } finally {
      client.release();
    }
  }

  static async addTicketEvent(ticketId: string, dto: any, actorUserId: string, role: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      if (ticket.status === 'CLOSED') {
        throw new AppError(403, 'Cannot add events to a closed ticket', ErrorCodes.TICKET_CLOSED);
      }

      if (role === UserRole.USER && !ticket.allow_customer_reply) {
        throw new AppError(403, 'Replies are currently disabled for this ticket', ErrorCodes.TICKET_LOCKED);
      }

      let eventType = 'INTERNAL_NOTE';
      let visibleToCustomer = dto.visibleToCustomer !== false;
      
      if (role === UserRole.USER) {
        eventType = 'USER_REPLY';
        visibleToCustomer = true;
      } else if (role === UserRole.SUPPORT_AGENT) {
        eventType = 'AGENT_REPLY';
      } else if (['ADMIN', 'MANAGER'].includes(role)) {
        eventType = 'ADMIN_REPLY';
      }

      const rawEvent = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: eventType,
        message: dto.message,
        metadata: dto.metadata || {},
        visible_to_customer: visibleToCustomer
      });

      const actor = await UserRepository.findById(client, actorUserId);
      const event = { ...rawEvent, actor_name: actor?.name || null };

      const isStaffReply = eventType === 'AGENT_REPLY' || eventType === 'ADMIN_REPLY';
      
      if (isStaffReply) {
        const info = await TicketRepository.getCustomerContactInfo(client, ticketId);
        
        if (info && actor && visibleToCustomer) {
          // Fire-and-forget the email so it doesn't bottleneck the HTTP response
          sendTicketUpdateEmail({
             name: info.name,
             email: info.email,
             ticketNo: info.ticket_no,
             agentName: actor.name,
             message: dto.message
          }).catch(err => {
             // We can just log it, no need to fail the entire ticket reply
             logger.error('[EMAIL] Failed to send ticket update email', err);
          });
        }
      }

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'NEW_EVENT', event }
      });

      return event;
    });
  }

  static async updateTicketStatus(ticketId: string, dto: any, actorUserId: string, role: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      const oldStatus = ticket.status;
      const newStatus = dto.status;
      
      if (oldStatus === ('CLOSED' as any)) {
         throw new AppError(403, 'Cannot update a closed ticket', ErrorCodes.TICKET_CLOSED);
      }

      if (newStatus === 'REOPENED') {
         if (oldStatus !== 'RESOLVED' && oldStatus !== 'CLOSED') {
             throw new AppError(400, 'Only resolved/closed tickets can be reopened', ErrorCodes.INVALID_TRANSITION);
         }
         
         const resolvedDate = ticket.resolved_at || ticket.closed_at;
         if (resolvedDate && new Date().getTime() - resolvedDate.getTime() > 24 * 60 * 60 * 1000) {
             throw new AppError(403, 'Ticket cannot be reopened after 24 hours', ErrorCodes.REOPEN_EXPIRED);
         }
      }
      
      const updatedStatus = newStatus === 'REOPENED' ? 'OPEN' : newStatus;
      const updatedTicket = await TicketRepository.updateStatus(client, ticketId, updatedStatus);
      
      const event = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'STATUS_CHANGED',
        message: dto.message || `Status updated from ${oldStatus} to ${newStatus}`,
        metadata: { oldStatus, newStatus },
        visible_to_customer: true
      });

      const info = await TicketRepository.getCustomerContactInfo(client, ticketId);
      if (info) {
        await sendTicketStatusUpdateEmail({
          name: info.name,
          email: info.email,
          ticketNo: info.ticket_no,
          status: updatedStatus,
          updateType: newStatus
        });
      }

      if (updatedStatus === 'RESOLVED') {
        await ticketAutomationQueue.add(
          'CLOSE_RESOLVED_TICKET',
          { ticketId },
          { delay: 24 * 60 * 60 * 1000, jobId: `close-resolved-${ticketId}` }
        );
      }

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_STATUS_UPDATED', ticket: updatedTicket, event }
      });
      
      return updatedTicket;
    });
  }

  static async updateTicketRca(ticketId: string, rca: string, actorUserId: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      if (ticket.status === 'CLOSED') {
        throw new AppError(403, 'Cannot update RCA for a closed ticket', ErrorCodes.TICKET_CLOSED);
      }

      let autoClosed = false;
      const fieldsToUpdate: any = { rca };

      if (ticket.status === 'RESOLVED' && ticket.resolved_at) {
        const resolvedTime = new Date(ticket.resolved_at).getTime();
        const now = Date.now();
        const hoursPassed = (now - resolvedTime) / (1000 * 60 * 60);

        if (hoursPassed >= 24) {
          fieldsToUpdate.status = 'CLOSED';
          fieldsToUpdate.closed_at = new Date().toISOString();
          fieldsToUpdate.allow_customer_reply = false;
          autoClosed = true;
        }
      }

      const updatedTicket = await TicketRepository.updateFields(client, ticketId, fieldsToUpdate);

      const rcaEvent = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'TICKET_RCA_UPDATED',
        message: 'Root Cause Analysis (RCA) was updated.',
        metadata: { rca },
        visible_to_customer: true
      });

      let statusEvent = null;
      if (autoClosed) {
        statusEvent = await TicketEventRepository.insertEvent(client, {
          ticket_id: ticketId,
          actor_user_id: null,
          event_type: 'STATUS_CHANGED',
          message: 'Ticket automatically closed after late RCA submission.',
          metadata: { old_status: 'RESOLVED', new_status: 'CLOSED' },
          visible_to_customer: true
        });
      }

      const info = await TicketRepository.getCustomerContactInfo(client, ticketId);
      if (info) {
        await sendTicketRcaEmail({
          name: info.name,
          email: info.email,
          ticketNo: info.ticket_no,
          rca
        });
      }

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_RCA_UPDATED', rca, event: rcaEvent }
      });

      if (autoClosed) {
        ticketEventEmitter.emit('ticket_updated', {
          ticketId,
          data: { type: 'TICKET_STATUS_UPDATED', ticket: updatedTicket, event: statusEvent }
        });
      }

      return updatedTicket;
    });
  }

  static async updateOutageDetails(ticketId: string, dto: any, actorUserId: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updatedTicket = await TicketRepository.updateFields(client, ticketId, {
        problem_side: dto.problemSide,
        external_ticket_no: dto.externalTicketNo
      });

      const event = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'OUTAGE_DETAILS_CHANGED',
        message: 'Outage details updated.',
        metadata: { problemSide: dto.problemSide, externalTicketNo: dto.externalTicketNo },
        visible_to_customer: true
      });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'OUTAGE_DETAILS_UPDATED', ticket: updatedTicket, event }
      });

      return updatedTicket;
    });
  }

  static async reassignTicket(ticketId: string, employeeId: string, actorUserId: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updatedTicket = await TicketRepository.updateFields(client, ticketId, {
        current_assigned_employee_id: employeeId
      });

      const event = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'TICKET_ASSIGNED',
        message: 'Ticket manually reassigned.',
        metadata: { assigned_to: employeeId },
        visible_to_customer: true
      });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_ASSIGNED', ticket: updatedTicket, event }
      });

      return updatedTicket;
    });
  }

  static async toggleCustomerReply(ticketId: string, allow: boolean, actorUserId: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updatedTicket = await TicketRepository.updateFields(client, ticketId, {
        allow_customer_reply: allow
      });

      const event = await TicketEventRepository.insertEvent(client, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'REPLY_TOGGLED',
        message: `Customer replies are now ${allow ? 'enabled' : 'disabled'}.`,
        metadata: { allow_customer_reply: allow },
        visible_to_customer: false
      });

      ticketEventEmitter.emit('ticket_updated', {
         ticketId,
         data: { type: 'REPLY_TOGGLED', allow_customer_reply: allow, event }
      });

      return updatedTicket;
    });
  }

  static async listResolvedTickets(page: number, limit: number, exportAll: boolean = false) {
    const client = await postgresPool.connect();
    try {
      const offset = (page - 1) * limit;
      const { tickets, total } = await TicketRepository.findResolvedTickets(client, limit, offset, exportAll);
      
      return {
        tickets,
        pagination: { total, pages: exportAll ? 1 : Math.ceil(total / limit), currentPage: page, limit }
      };
    } finally {
      client.release();
    }
  }

  static async updateTicketRating(ticketId: string, rating: number, feedback: string, actorUserId: string) {
    return withTransaction(async (client) => {
      const ticket = await TicketRepository.findByIdForUpdate(client, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED') {
        throw new AppError(400, 'Only resolved or closed tickets can be rated.', ErrorCodes.INVALID_TICKET_STATE);
      }

      if (!await TicketRepository.checkCustomerOwnership(client, ticket.customer_id, actorUserId)) {
         throw new AppError(403, 'You do not have access to rate this ticket', ErrorCodes.FORBIDDEN);
      }

      const updatedTicket = await TicketRepository.updateFields(client, ticketId, {
        rating,
        rating_feedback: feedback
      });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { 
          type: 'TICKET_RATING_UPDATED', 
          rating, 
          rating_feedback: feedback 
        }
      });

      return updatedTicket;
    });
  }
}
