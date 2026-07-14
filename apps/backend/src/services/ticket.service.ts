import { db } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { AssignmentService } from './assignment.service.js';
import { sendTicketConfirmationEmail, sendTicketCreatedHelpdeskEmail, sendImmediateAgentAssignmentEmails, sendTicketUpdateEmail, sendTicketStatusUpdateEmail, sendTicketRcaEmail, sendAgentReassignmentEmail, sendTicketReopenedAgentEmail } from './email.service.js';
import { sendTicketCreatedSms, sendStaffUpdateSms, sendTicketResolvedSms, sendTicketReopenedSms, sendRootCauseAnalysisSms } from './sms.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { UserRole } from '../types/dto.js';
import { ticketAutomationQueue } from '../config/redis.js';
import { logger } from '../lib/logger.js';

export class TicketService {
  static async createTicket(dto: any, actorUserId: string, actorRole: string) {
    const result = await db.transaction(async (tx) => {
      let customerId: string | null = null;

      if (actorRole === UserRole.USER) {
        const cust = await CustomerRepository.findByUserId(tx, actorUserId);
        if (!cust) throw new AppError(404, 'Customer record not found', ErrorCodes.CUSTOMER_NOT_FOUND);
        customerId = cust.id;
      } else {
        if (dto.customerId) {
          customerId = dto.customerId;
        } else if (dto.customerEmail) {
          const user = await UserRepository.findByEmail(tx, dto.customerEmail);
          if (!user) throw new AppError(404, 'Customer with this email not found', ErrorCodes.CUSTOMER_NOT_FOUND);
          if (user.role !== UserRole.USER) throw new AppError(400, 'Provided email does not belong to a customer', ErrorCodes.VALIDATION_ERROR);
          const cust = await CustomerRepository.findByUserId(tx, user.id);
          if (!cust) throw new AppError(404, 'Customer record not found', ErrorCodes.CUSTOMER_NOT_FOUND);
          customerId = cust.id;
        }
      }

      if (!customerId) throw new AppError(400, 'Customer ID is required', ErrorCodes.VALIDATION_ERROR);

      if (dto.circuitDescription && dto.circuitDescription.trim() !== '') {
        const circuit = dto.circuitDescription.trim();
        const activeTicket = await TicketRepository.findActiveTicketByCircuit(tx, circuit);
        if (activeTicket) {
          throw new AppError(400, 'There is already an open ticket raised in Samadhan', ErrorCodes.VALIDATION_ERROR);
        }
      }

      const ticket = await TicketRepository.create(tx, {
        customerId: customerId as string,
        createdByUserId: actorRole !== UserRole.USER ? actorUserId : null,
        assignedEmployeeId: null,
        issueCategoryId: dto.issueCategoryId,
        circuitDescription: dto.circuitDescription ? String(dto.circuitDescription) : '',
        alternateEmail: dto.alternateEmail ? String(dto.alternateEmail).trim() : undefined,
      });

      const initialMessage = dto.message && dto.message.trim() !== '' ? dto.message.trim() : null;
      await TicketEventRepository.insertEvent(tx, {
        ticket_id: ticket.id,
        actor_user_id: actorUserId,
        event_type: 'TICKET_CREATED',
        message: initialMessage,
        metadata: { source: 'WEB', attachments: dto.metadata?.attachments || [] },
        visible_to_customer: true
      });

      const assignedAgentId = await AssignmentService.assignAgentAutomatically(tx, ticket.id, dto.issueCategoryId);
      if (assignedAgentId && ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS' as any;
      }

      let assignedAgentName = 'Agent';
      let agent = null;
      let agentUser = null;

      if (assignedAgentId) {
        agent = await EmployeeRepository.findByRowId(tx, assignedAgentId);
        if (agent) {
           agentUser = await UserRepository.findById(tx, agent.user_id);
           if (agentUser) {
             assignedAgentName = agentUser.name;
           }
        }

        await TicketEventRepository.insertEvent(tx, {
          ticket_id: ticket.id,
          actor_user_id: null,
          event_type: 'TICKET_ASSIGNED',
          message: `Ticket assign to ${assignedAgentName}`,
          metadata: { assigned_to: assignedAgentId },
          visible_to_customer: true
        });
      }

      const info = await TicketRepository.getCustomerContactInfo(tx, ticket.id);
      
      if (info) {
        await ticketAutomationQueue.add(
          'AGENT_ASSIGNMENT_CHECK',
          { ticketId: ticket.id },
          { delay: 2 * 60 * 1000, jobId: `agent-assign-${ticket.id}-${Date.now()}` }
        );
      }

      await ticketAutomationQueue.add('TROUBLESHOOTING_UPDATE', { ticketId: ticket.id }, { delay: 15 * 60 * 1000, jobId: `troubleshoot-${ticket.id}-${Date.now()}` });
      await ticketAutomationQueue.add('FINAL_ACTIVITY_CHECK', { ticketId: ticket.id }, { delay: 45 * 60 * 1000, jobId: `final-activity-${ticket.id}-${Date.now()}` });
      // await ticketAutomationQueue.add('MTTR_BREACH_ESCALATION', { ticketId: ticket.id }, { delay: 4 * 60 * 60 * 1000, jobId: `mttr-breach-${ticket.id}-${Date.now()}` });
      await ticketAutomationQueue.add('MTTR_BREACH_ESCALATION', { ticketId: ticket.id }, { delay: 5 * 60 * 1000, jobId: `mttr-breach-${ticket.id}-${Date.now()}` });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId: ticket.id,
        data: { type: 'TICKET_CREATED', ticket }
      });

      return { ticket, assignedAgentId, info, agentUser };
    });

    if (result.info) {
      // Execute emails sequentially in the background to prevent rate limiting / concurrency issues on the custom email server
      (async () => {
        try {
          // 1. Send confirmation to customer
          await sendTicketConfirmationEmail({ 
            name: result.info.name, 
            email: result.info.email, 
            ticketNo: result.info.ticket_no, 
            alternateEmail: result.info.alternate_email, 
            circuitId: result.info.circuit_description, 
            attachments: dto.metadata?.attachments 
          });

          // 2. Send notification to helpdesk
          await sendTicketCreatedHelpdeskEmail({
            customerName: result.info.name,
            ticketNo: result.info.ticket_no,
            category: result.info.category,
            circuitId: result.info.circuit_description,
            attachments: dto.metadata?.attachments
          });

          // 3. Send assignment notification to agent (if automatically assigned)
          if (result.assignedAgentId && result.agentUser) {
            await sendImmediateAgentAssignmentEmails({
              customerName: result.info.name,
              agentName: result.agentUser.name,
              agentEmail: result.agentUser.email,
              ticketNo: result.info.ticket_no,
              category: result.info.category,
              circuitId: result.info.circuit_description
            });
          }
        } catch (err) {
          logger.error('[EMAIL] Failed to send ticket creation emails sequentially', err);
        }
      })();
    }

    return { ticket: result.ticket, assignedAgentId: result.assignedAgentId };
  }

  static async listUserTickets(userId: string, role: string, cursor: string | undefined, limit: number, filters: any) {
    const tx = db; const client = db;
    try {
      const queryFilters: any = { 
        statusGroup: filters.statusGroup,
        status: filters.status,
        searchQuery: filters.searchQuery,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder,
      };

      if (role === UserRole.USER) {
        const cust = await CustomerRepository.findByUserId(tx, userId);
        if (!cust) return { tickets: [], pagination: { nextCursor: null, hasNext: false, limit } };
        queryFilters.customerId = cust.id;
      } else if (role === UserRole.SUPPORT_AGENT) {
        const emp = await EmployeeRepository.findByUserId(tx, userId);
        if (!emp) return { tickets: [], pagination: { nextCursor: null, hasNext: false, limit } };
        queryFilters.employeeId = emp.id;
      } else if (role === UserRole.SALES) {
        queryFilters.salesUserId = userId;
      }

      if (['ADMIN'].includes(role)) {
        if (filters.ownership) queryFilters.ownership = filters.ownership;
        if (filters.agentId) queryFilters.employeeId = filters.agentId;
      }

      const { tickets, nextCursor, hasNext } = await TicketRepository.findUserTickets(tx, queryFilters, limit, cursor);
      
      return {
        tickets,
        pagination: { nextCursor, hasNext, limit }
      };
    } finally {
      // client.release();
    }
  }

  static async getTicketTimeline(ticketId: string, userId: string, role: string, afterEventId?: string, limit: number = 200) {
    const tx = db; const client = db;
    try {
      const ticketInfo = await TicketRepository.findTicketTimelineInfo(tx, ticketId);
      if (!ticketInfo) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      if (role === UserRole.USER && !await TicketRepository.checkCustomerOwnership(tx, ticketInfo.customer_row_id, userId)) {
        throw new AppError(403, 'You do not have access to this ticket', ErrorCodes.FORBIDDEN);
      }
      
      if (role === UserRole.SUPPORT_AGENT) {
        const emp = await EmployeeRepository.findByUserId(tx, userId);
        if (ticketInfo.current_assigned_employee_id !== emp?.id) {
          throw new AppError(403, 'You are not assigned to this ticket', ErrorCodes.FORBIDDEN);
        }
      }

      let events = [];
      let hasMore = false;
      
      if (afterEventId) {
        const eventRes = await TicketEventRepository.findMissedEvents(db, ticketId, afterEventId, limit);
        events = eventRes.events;
        hasMore = eventRes.hasMore;
      } else {
        events = await TicketEventRepository.findByTicketId(tx, ticketId, role === UserRole.USER);
      }

      const formattedTicket = {
        ...ticketInfo,
        customer: {
          name: ticketInfo.customer_name,
          customer_id: ticketInfo.customer_id,
          email: ticketInfo.customer_email,
          phone: ticketInfo.customer_phone
        },
        assigned_employee: ticketInfo.current_assigned_employee_id ? {
          name: ticketInfo.assigned_employee_name,
          profile_image: ticketInfo.assigned_employee_profile_image
        } : null
      };

      return {
        ticket: formattedTicket,
        events,
        hasMore
      };
    } finally {
      // client.release();
    }
  }

  static async addTicketEvent(ticketId: string, dto: any, actorUserId: string, role: string) {
    return db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
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

      const rawEvent = await TicketEventRepository.insertEvent(tx, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: eventType,
        message: dto.message,
        metadata: dto.metadata || {},
        visible_to_customer: visibleToCustomer
      });

      const actor = await UserRepository.findById(tx, actorUserId);
      const event = { ...rawEvent, actor_name: actor?.name || null };

      if (ticket.status === 'OPEN') {
        await TicketRepository.updateStatus(tx, ticketId, 'IN_PROGRESS');
      }

      const isStaffReply = eventType === 'AGENT_REPLY' || eventType === 'ADMIN_REPLY';
      
      if (isStaffReply) {
        const info = await TicketRepository.getCustomerContactInfo(tx, ticketId);
        const shouldSendEmail = dto.send_email !== false; // Default to true if undefined
        // const shouldSendSms = dto.send_sms !== false; // Default to true if undefined
        
        if (info && actor && visibleToCustomer) {
          if (shouldSendEmail) {
            // Fire-and-forget the email so it doesn't bottleneck the HTTP response
            sendTicketUpdateEmail({
               name: info.name,
               email: info.email,
               ticketNo: info.ticket_no,
               agentName: actor.name,
               message: dto.message,
               attachments: dto.metadata?.attachments,
               alternateEmail: info.alternate_email,
               circuitId: info.circuit_description
            }).catch(err => {
               // We can just log it, no need to fail the entire ticket reply
               logger.error('[EMAIL] Failed to send ticket update email', err);
            });
          }

          // if (shouldSendSms && info.phone) {
          //   sendStaffUpdateSms(info.phone, dto.message).catch(err => {
          //     logger.error('[SMS] Failed to send ticket update SMS', err);
          //   });
          // }
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
    const result = await db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
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
         if (resolvedDate && new Date().getTime() - new Date(resolvedDate).getTime() > 24 * 60 * 60 * 1000) {
             throw new AppError(403, 'Ticket cannot be reopened after 24 hours', ErrorCodes.REOPEN_EXPIRED);
         }
      }
      
      const updatedStatus = newStatus === 'REOPENED' ? 'IN_PROGRESS' : newStatus;
      const updatedTicket = await TicketRepository.updateStatus(tx, ticketId, updatedStatus);
      
      const event = await TicketEventRepository.insertEvent(tx, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'STATUS_CHANGED',
        message: dto.message || `Status updated from ${oldStatus} to ${newStatus}`,
        metadata: { oldStatus, newStatus },
        visible_to_customer: true
      });

      const info = await TicketRepository.getCustomerContactInfo(tx, ticketId);
      
      if (updatedStatus === 'RESOLVED') {
        await ticketAutomationQueue.add(
          'CLOSE_RESOLVED_TICKET',
          { ticketId },
          { delay: 24 * 60 * 60 * 1000, jobId: `close-resolved-${ticketId}-${Date.now()}` }
        );
      }

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_STATUS_UPDATED', ticket: updatedTicket, event }
      });

      if (newStatus === 'REOPENED') {

        await ticketAutomationQueue.add('REOPENED_TROUBLESHOOTING_UPDATE', { ticketId: ticket.id }, { delay: 15 * 60 * 1000, jobId: `reopened-troubleshoot-${ticket.id}-${Date.now()}` });
        
        await ticketAutomationQueue.add('REOPENED_FINAL_ACTIVITY_CHECK', { ticketId: ticket.id }, { delay: 45 * 60 * 1000, jobId: `reopened-final-activity-${ticket.id}-${Date.now()}` });

        await ticketAutomationQueue.add('REOPENED_MTTR_BREACH_ESCALATION', { ticketId: ticket.id }, { delay: 4 * 60 * 60 * 1000, jobId: `reopened-mttr-breach-${ticket.id}-${Date.now()}` });
      }

      let agentName = null;
      let agentEmail = null;
      if (newStatus === 'REOPENED' && ticket.current_assigned_employee_id) {
          const agent = await EmployeeRepository.findByRowId(tx, ticket.current_assigned_employee_id);
          if (agent) {
             const agentUser = await UserRepository.findById(tx, agent.user_id);
             if (agentUser) {
               agentName = agentUser.name;
               agentEmail = agentUser.email;
             }
          }
      }
      
      return { updatedTicket, info, newStatus, updatedStatus, agentName, agentEmail };
    });

    if (result.info) {
      sendTicketStatusUpdateEmail({
        name: result.info.name,
        email: result.info.email,
        ticketNo: result.info.ticket_no,
        status: result.updatedStatus,
        updateType: result.newStatus,
        alternateEmail: result.info.alternate_email,
        circuitId: result.info.circuit_description
      }).catch(err => logger.error('[EMAIL] Failed to send status update email', err));

      // if (result.info.phone) {
      //   if (result.updatedStatus === 'RESOLVED') {
      //     sendTicketResolvedSms(result.info.phone, result.info.ticket_no).catch(err => logger.error('[SMS] Failed to send resolved SMS', err));
      //   } else if (result.newStatus === 'REOPENED') {
      //     sendTicketReopenedSms(result.info.phone, result.info.ticket_no).catch(err => logger.error('[SMS] Failed to send reopened SMS', err));
      //   }
      // }

      if (result.newStatus === 'REOPENED') {
          sendTicketReopenedAgentEmail({
             customerName: result.info.name,
             agentName: result.agentName || 'Helpdesk',
             agentEmail: result.agentEmail,
             ticketNo: result.info.ticket_no,
             category: result.info.category,
             circuitId: result.info.circuit_description
          }).catch(err => logger.error('[EMAIL] Failed to send ticket reopened agent email', err));
      }
    }

    return result.updatedTicket;
  }

  static async updateTicketRca(ticketId: string, rca: string, existingImages: string[], newImages: string[], actorUserId: string) {
    const result = await db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      if (ticket.status === 'CLOSED') {
        throw new AppError(403, 'Cannot update RCA for a closed ticket', ErrorCodes.TICKET_CLOSED);
      }

      const combinedImages = [...(existingImages || []), ...(newImages || [])];
      if (combinedImages.length > 10) {
        throw new AppError(400, 'Cannot attach more than 10 images to RCA', ErrorCodes.VALIDATION_ERROR);
      }

      let autoClosed = false;
      const fieldsToUpdate: any = { rca, rca_images: JSON.stringify(combinedImages) };

      if (ticket.status === 'RESOLVED' && ticket.resolved_at) {
        const resolvedTime = new Date(ticket.resolved_at).getTime();
        const now = Date.now();
        const hoursPassed = (now - resolvedTime) / (1000 * 60 * 60);

        if (hoursPassed >= 24) {
          fieldsToUpdate.status = 'CLOSED';
          fieldsToUpdate.closed_at = new Date();
          fieldsToUpdate.allow_customer_reply = false;
          autoClosed = true;
        }
      }

      const updatedTicket = await TicketRepository.updateFields(tx, ticketId, fieldsToUpdate);

      // Create an event for the RCA update so it's recorded in the timeline history
      const rcaEvent = await TicketEventRepository.insertEvent(tx, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'TICKET_RCA_UPDATED',
        message: 'Root Cause Analysis submitted',
        metadata: { rca, attachments: combinedImages },
        visible_to_customer: true
      });

      let statusEvent = null;
      if (autoClosed) {
        statusEvent = await TicketEventRepository.insertEvent(tx, {
          ticket_id: ticketId,
          actor_user_id: null,
          event_type: 'STATUS_CHANGED',
          message: 'Ticket automatically closed after late RCA submission.',
          metadata: { old_status: 'RESOLVED', new_status: 'CLOSED' },
          visible_to_customer: true
        });
      }

      const info = await TicketRepository.getCustomerContactInfo(tx, ticketId);
      
      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_RCA_UPDATED', rca, rca_images: combinedImages, event: rcaEvent }
      });

      if (autoClosed) {
        ticketEventEmitter.emit('ticket_updated', {
          ticketId,
          data: { type: 'TICKET_STATUS_UPDATED', ticket: updatedTicket, event: statusEvent }
        });
      }

      return { updatedTicket, info, combinedImages };
    });

    if (result.info) {
      sendTicketRcaEmail({
        name: result.info.name,
        email: result.info.email,
        ticketNo: result.info.ticket_no,
        rca,
        rcaImages: result.combinedImages,
        alternateEmail: result.info.alternate_email,
        circuitId: result.info.circuit_description
      }).catch(err => logger.error('[EMAIL] Failed to send ticket RCA email', err));

      // if (result.info.phone) {
      //   sendRootCauseAnalysisSms(result.info.phone, result.info.ticket_no).catch(err => logger.error('[SMS] Failed to send RCA SMS', err));
      // }
    }

    return result.updatedTicket;
  }

  static async updateOutageDetails(ticketId: string, dto: any, actorUserId: string) {
    return db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updates: any = {
        problem_side: dto.problemSide,
        telco_sr_number: dto.externalTicketNo
      };
      if (ticket.status === 'OPEN') {
        updates.status = 'IN_PROGRESS';
      }

      const updatedTicket = await TicketRepository.updateFields(tx, ticketId, updates);

      // Outage event creation removed

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'OUTAGE_DETAILS_UPDATED', ticket: updatedTicket }
      });

      return updatedTicket;
    });
  }

  static async reassignTicket(ticketId: string, employeeId: string, actorUserId: string) {
    const result = await db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updates: any = {
        current_assigned_employee_id: employeeId
      };
      if (ticket.status === 'OPEN') {
        updates.status = 'IN_PROGRESS';
      }

      const updatedTicket = await TicketRepository.updateFields(tx, ticketId, updates);

      let agentName = 'Agent';
      let agentEmail = '';
      const agent = await EmployeeRepository.findByRowId(tx, employeeId);
      if (agent) {
         const agentUser = await UserRepository.findById(tx, agent.user_id);
         if (agentUser) {
           agentName = agentUser.name;
           agentEmail = agentUser.email;
         }
      }

      const event = await TicketEventRepository.insertEvent(tx, {
        ticket_id: ticketId,
        actor_user_id: actorUserId,
        event_type: 'TICKET_ASSIGNED',
        message: `Ticket reassigned to ${agentName}`,
        metadata: { assigned_to: employeeId },
        visible_to_customer: true
      });

      ticketEventEmitter.emit('ticket_updated', {
        ticketId,
        data: { type: 'TICKET_ASSIGNED', ticket: updatedTicket, event }
      });

      const info = await TicketRepository.getCustomerContactInfo(tx, ticketId);

      return { updatedTicket, info, agentName, agentEmail };
    });

    if (result.info && result.agentEmail) {
      sendAgentReassignmentEmail({
        customerName: result.info.name,
        agentName: result.agentName,
        agentEmail: result.agentEmail,
        ticketNo: result.info.ticket_no,
        category: result.info.category,
        circuitId: result.info.circuit_description
      }).catch(err => logger.error('[EMAIL] Failed to send agent reassignment email', err));
    }

    return result.updatedTicket;
  }

  static async toggleCustomerReply(ticketId: string, allow: boolean, actorUserId: string) {
    return db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);

      const updatedTicket = await TicketRepository.updateFields(tx, ticketId, {
        allow_customer_reply: allow
      });

      // Reply toggle event creation removed

      ticketEventEmitter.emit('ticket_updated', {
         ticketId,
         data: { type: 'REPLY_TOGGLED', allow_customer_reply: allow }
      });

      return updatedTicket;
    });
  }

  static async getEarliestTicketYear() {
    const tx = db; const client = db;
    try {
      return await TicketRepository.getEarliestTicketYear(tx);
    } finally {
      // client.release();
    }
  }

  static async listResolvedTickets(page: number, limit: number, exportAll: boolean = false, year?: number, month?: number) {
    const tx = db; const client = db;
    try {
      const pageNum = page || 1; const limitNum = limit || 10; const offset = (pageNum - 1) * limitNum;
      const { tickets, total } = await TicketRepository.findResolvedTickets(tx, limit, offset, exportAll, year, month);
      
      return {
        tickets,
        pagination: { total, pages: exportAll ? 1 : Math.ceil(total / limitNum), currentPage: page, limit }
      };
    } finally {
      // client.release();
    }
  }

  static async updateTicketRating(ticketId: string, rating: number, feedback: string, actorUserId: string) {
    return db.transaction(async (tx) => {
      const ticket = await TicketRepository.findByIdForUpdate(tx, ticketId);
      if (!ticket) throw new AppError(404, 'Ticket not found', ErrorCodes.TICKET_NOT_FOUND);
      
      if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED') {
        throw new AppError(400, 'Only resolved or closed tickets can be rated.', ErrorCodes.INVALID_TICKET_STATE);
      }

      if (!await TicketRepository.checkCustomerOwnership(tx, ticket.customer_id, actorUserId)) {
         throw new AppError(403, 'You do not have access to rate this ticket', ErrorCodes.FORBIDDEN);
      }

      const updatedTicket = await TicketRepository.updateFields(tx, ticketId, {
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
