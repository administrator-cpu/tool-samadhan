import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { db } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { AutomatedEmailLogRepository } from '../repositories/automated-email-log.repository.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { sendCustomerAssignment2MinEmail, sendTroubleshootingUpdateEmail, sendLongDelayUpdateEmail } from '../services/email.service.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { logger } from '../lib/logger.js';
import { TicketEvent } from '../types/models.js';

export const ticketAutomationWorker = new Worker(
  'ticket-automation',
  async (job: Job) => {
    const { ticketId } = job.data;
    const { name: jobName } = job;

    logger.info(`[WORKER] Processing ${jobName} ${ticketId ? `for Ticket #${ticketId}` : ''}`);

    let ticketInfo, ticket;
    if (jobName !== 'BULK_CLOSE_RESOLVED_TICKETS') {
      ticketInfo = await TicketRepository.getCustomerContactInfo(db, ticketId);
      if (!ticketInfo) {
        logger.warn(`[WORKER] Ticket #${ticketId} not found.`);
        return;
      }
      
      ticket = await TicketRepository.findById(db, ticketId);
      if (!ticket) return;

      if (ticket.status === 'CLOSED' || (ticket.status === 'RESOLVED' && jobName !== 'CLOSE_RESOLVED_TICKET')) {
        logger.info(`[WORKER] Ticket #${ticketId} is ${ticket.status} for job ${jobName}. Skipping.`);
        return;
      }

      if (await AutomatedEmailLogRepository.wasEmailSent(db, ticketId, jobName)) {
        logger.info(`[WORKER] ${jobName} already sent for Ticket #${ticketId}. Skipping.`);
        return;
      }
    }

    try {
      switch (jobName) {
        case 'BULK_CLOSE_RESOLVED_TICKETS': {
          try {
            await db.transaction(async (tx) => {
              const closedTickets = await TicketRepository.bulkCloseExpiredResolvedTickets(tx);
            
            for (const t of closedTickets) {
              const event: Partial<TicketEvent> = {
                ticket_id: t.id,
                actor_user_id: null,
                event_type: 'STATUS_CHANGED',
                message: 'Ticket automatically closed after 24 hours of resolution.',
                metadata: { status: 'CLOSED', autoClosed: true, source: 'BULK_CRON' },
                visible_to_customer: true
              };
              
              await TicketEventRepository.insertEvent(tx, event);
              
              ticketEventEmitter.emit('ticket_updated', {
                ticketId: t.id,
                data: {
                  type: 'TICKET_STATUS_UPDATED',
                  ticket: t
                }
              });
            }
            logger.info(`[WORKER] Bulk closed ${closedTickets.length} expired resolved tickets.`);
            });
          } catch (err) {
            throw err;
          }
          break;
        }
        case 'AGENT_ASSIGNMENT_CHECK':
          if (ticket.current_assigned_employee_id) {
            await sendCustomerAssignment2MinEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              circuitId: ticketInfo.circuit_description
            });
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;

        case 'TROUBLESHOOTING_UPDATE':
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fifteenMinutesMs = 15 * 60 * 1000 - 5000;

          if (diffMs >= fifteenMinutesMs && !(await TicketEventRepository.hasAgentReplied(db, ticketId))) {
            await sendTroubleshootingUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              circuitId: ticketInfo.circuit_description
            });
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;

        case 'FINAL_ACTIVITY_CHECK': {
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fortyFiveMinutesMs = 45 * 60 * 1000 - 5000;

          if (diffMs >= fortyFiveMinutesMs && !(await TicketEventRepository.hasAgentReplied(db, ticketId))) {
            await sendLongDelayUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              circuitId: ticketInfo.circuit_description
            });
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;
        }

        case 'CLOSE_RESOLVED_TICKET': {
          try {
            await db.transaction(async (tx) => {
              const lockedTicket = await TicketRepository.findByIdForUpdate(tx, ticketId);
            
            if (
              lockedTicket &&
              lockedTicket.status === 'RESOLVED' &&
              lockedTicket.rca &&
              lockedTicket.rca.trim()
            ) {
              const updatedTicket = await TicketRepository.updateFields(tx, ticketId, {
                status: 'CLOSED' as any,
                closed_at: new Date(),
                allow_customer_reply: false
              });
              
              const event: Partial<TicketEvent> = {
                ticket_id: ticketId,
                actor_user_id: null,
                event_type: 'STATUS_CHANGED',
                message: 'Ticket automatically closed after 24 hours of resolution.',
                metadata: { status: 'CLOSED', autoClosed: true },
                visible_to_customer: true
              };
              
              await TicketEventRepository.insertEvent(tx, event);
              
              ticketEventEmitter.emit('ticket_updated', {
                ticketId,
                data: {
                  type: 'TICKET_STATUS_UPDATED',
                  ticket: updatedTicket
                }
              });
              
              logger.info(`[WORKER] Ticket #${ticketId} automatically closed after 24 hours.`);
            } else {
              logger.info(`[WORKER] Ticket #${ticketId} not closed: either status is not RESOLVED or RCA is missing.`);
            }
            });
          } catch (err) {
            throw err;
          }
          break;
        }

        default:
          logger.warn(`[WORKER] Unknown job name: ${jobName}`);
      }
    } catch (error) {
      logger.error(`[WORKER] Error processing ${jobName}:`, error);
      throw error; 
    }
  },
  { connection: redisConnection }
);
