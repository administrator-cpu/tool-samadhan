import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { postgresPool } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { AutomatedEmailLogRepository } from '../repositories/automated-email-log.repository.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import {
  sendCustomerAssignment2MinEmail,
  sendTroubleshootingUpdateEmail,
  sendLongDelayUpdateEmail,
} from '../services/email.service.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { logger } from '../lib/logger.js';
import { TicketEvent } from '../types/models.js';

export const ticketAutomationWorker = new Worker(
  'ticket-automation',
  async (job: Job) => {
    const { ticketId } = job.data;
    const { name: jobName } = job;

    logger.info(`[WORKER] Processing ${jobName} for Ticket #${ticketId}`);

    const ticketInfo = await TicketRepository.getCustomerContactInfo(postgresPool, ticketId);
    if (!ticketInfo) {
      logger.warn(`[WORKER] Ticket #${ticketId} not found.`);
      return;
    }
    
    const ticket = await TicketRepository.findById(postgresPool, ticketId);
    if (!ticket) return;

    if (ticket.status === 'CLOSED' || (ticket.status === 'RESOLVED' && jobName !== 'CLOSE_RESOLVED_TICKET')) {
      logger.info(`[WORKER] Ticket #${ticketId} is ${ticket.status} for job ${jobName}. Skipping.`);
      return;
    }

    if (await AutomatedEmailLogRepository.wasEmailSent(postgresPool, ticketId, jobName)) {
      logger.info(`[WORKER] ${jobName} already sent for Ticket #${ticketId}. Skipping.`);
      return;
    }

    try {
      switch (jobName) {
        case 'AGENT_ASSIGNMENT_CHECK':
          if (!ticket.current_assigned_employee_id) {
            await sendCustomerAssignment2MinEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
            });
            await AutomatedEmailLogRepository.logEmailSent(postgresPool, ticketId, jobName);
          }
          break;

        case 'TROUBLESHOOTING_UPDATE':
          if (!(await TicketEventRepository.hasAgentReplied(postgresPool, ticketId))) {
            await sendTroubleshootingUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
            });
            await AutomatedEmailLogRepository.logEmailSent(postgresPool, ticketId, jobName);
          }
          break;

        case 'FINAL_ACTIVITY_CHECK': {
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fortyFiveMinutesMs = 45 * 60 * 1000 - 5000;

          if (diffMs >= fortyFiveMinutesMs && !(await TicketEventRepository.hasAgentReplied(postgresPool, ticketId))) {
            await sendLongDelayUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
            });
            await AutomatedEmailLogRepository.logEmailSent(postgresPool, ticketId, jobName);
          }
          break;
        }

        case 'CLOSE_RESOLVED_TICKET': {
          const client = await postgresPool.connect();
          try {
            await client.query('BEGIN');
            const lockedTicket = await TicketRepository.findByIdForUpdate(client, ticketId);
            
            if (
              lockedTicket &&
              lockedTicket.status === 'RESOLVED' &&
              lockedTicket.rca &&
              lockedTicket.rca.trim()
            ) {
              const updatedTicket = await TicketRepository.updateFields(client, ticketId, {
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
              
              await TicketEventRepository.insertEvent(client, event);
              
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
            await client.query('COMMIT');
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
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
