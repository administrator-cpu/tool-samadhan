import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { db } from '../config/database.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { AutomatedEmailLogRepository } from '../repositories/automated-email-log.repository.js';
import { TicketEventRepository } from '../repositories/ticket-event.repository.js';
import { sendCustomerAssignment2MinEmail, sendTroubleshootingUpdateEmail, sendLongDelayUpdateEmail, sendMttrEscalationEmail } from '../services/email.service.js';
import { sendTroubleshootingUpdateSms, sendMediaOutageAlertSms } from '../services/sms.service.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { logger } from '../lib/logger.js';
import { TicketEvent } from '../types/models.js';

export const ticketAutomationWorker = new Worker( 'ticket-automation', async (job: Job) => {
  
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
              alternateEmail: ticketInfo.alternate_email,
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
            const success = await sendTroubleshootingUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              alternateEmail: ticketInfo.alternate_email,
              circuitId: ticketInfo.circuit_description
            });

            // if (ticketInfo.phone) {
            //   await sendTroubleshootingUpdateSms(ticketInfo.phone, ticketInfo.ticket_no);
            // }

            if (success) {
              if (ticket.status === 'OPEN') {
                await TicketRepository.updateStatus(db, ticketId, 'IN_PROGRESS');
              }
              await TicketEventRepository.insertEvent(db, {
                ticket_id: ticketId,
                actor_user_id: null,
                event_type: 'AUTOMATED_UPDATE',
                message: "To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.",
                metadata: { heading: "Troubleshooting", source: "AUTOMATION_WORKER" },
                visible_to_customer: true
              });
              ticketEventEmitter.emit('ticket_updated', {
                ticketId,
                data: { type: 'TICKET_EVENT_ADDED' }
              });
            }
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;

        case 'REOPENED_TROUBLESHOOTING_UPDATE':
          // const createdAt = new Date(ticket.created_at);
          // const now = new Date();
          // const diffMs = now.getTime() - createdAt.getTime();
          // const fifteenMinutesMs = 15 * 60 * 1000 - 5000;
  
          if (!(await TicketEventRepository.hasAgentRepliedOnReopenedTicket(db, ticketId))) {
            const success = await sendTroubleshootingUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              alternateEmail: ticketInfo.alternate_email,
              circuitId: ticketInfo.circuit_description
            });
  
            // if (ticketInfo.phone) {
            //   await sendTroubleshootingUpdateSms(ticketInfo.phone, ticketInfo.ticket_no);
            // }
  
            if (success) {
              if (ticket.status === 'OPEN') {
                await TicketRepository.updateStatus(db, ticketId, 'IN_PROGRESS');
              }
              await TicketEventRepository.insertEvent(db, {
                ticket_id: ticketId,
                actor_user_id: null,
                event_type: 'AUTOMATED_UPDATE',
                message: "To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.",
                metadata: { heading: "Troubleshooting", source: "AUTOMATION_WORKER" },
                visible_to_customer: true
              });
              ticketEventEmitter.emit('ticket_updated', {
                ticketId,
                data: { type: 'TICKET_EVENT_ADDED' }
              });
            }
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;

        
          case 'REOPENED_FINAL_ACTIVITY_CHECK': {
            // const createdAt = new Date(ticket.created_at);
            // const now = new Date();
            // const diffMs = now.getTime() - createdAt.getTime();
            // const fortyFiveMinutesMs = 45 * 60 * 1000 - 5000;

            if (!(await TicketEventRepository.hasAgentRepliedOnReopenedTicket(db, ticketId))) {

              const success = await sendLongDelayUpdateEmail({
                name: ticketInfo.name,
                email: ticketInfo.email,
                ticketNo: ticketInfo.ticket_no,
                alternateEmail: ticketInfo.alternate_email,
                circuitId: ticketInfo.circuit_description
              });
  
              // if (ticketInfo.phone) {
              //   await sendMediaOutageAlertSms(ticketInfo.phone, "We are currently coordinating with our Network Tier 2 team for end-to-end media verification. Rest assured, we will keep you informed with the latest updates as soon as they become available. The tentative Estimated Resolution Time is 90 min. We appreciate your patience during this process.");
              // }
  
              if (success) {
                if (ticket.status === 'OPEN') {
                  await TicketRepository.updateStatus(db, ticketId, 'IN_PROGRESS');
                }
                await TicketEventRepository.insertEvent(db, {
                  ticket_id: ticketId,
                  actor_user_id: null,
                  event_type: 'AUTOMATED_UPDATE',
                  message: "We are currently coordinating with our Network Tier 2 team for end-to-end media verification. Rest assured, we will keep you informed with the latest updates as soon as they become available. The tentative Estimated Resolution Time is 90 min. We appreciate your patience during this process.",
                  metadata: { heading: "Issue Analysing", source: "AUTOMATION_WORKER" },
                  visible_to_customer: true
                });
                ticketEventEmitter.emit('ticket_updated', {
                  ticketId,
                  data: { type: 'TICKET_EVENT_ADDED' }
                });
              }
              await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
            }
            break;
        }


          
        case 'FINAL_ACTIVITY_CHECK': {
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fortyFiveMinutesMs = 45 * 60 * 1000 - 5000;

          if (diffMs >= fortyFiveMinutesMs && !(await TicketEventRepository.hasAgentReplied(db, ticketId))) {
            const success = await sendLongDelayUpdateEmail({
              name: ticketInfo.name,
              email: ticketInfo.email,
              ticketNo: ticketInfo.ticket_no,
              alternateEmail: ticketInfo.alternate_email,
              circuitId: ticketInfo.circuit_description
            });

            // if (ticketInfo.phone) {
            //   await sendMediaOutageAlertSms(ticketInfo.phone, "We are currently coordinating with our Network Tier 2 team for end-to-end media verification. Rest assured, we will keep you informed with the latest updates as soon as they become available. The tentative Estimated Resolution Time is 90 min. We appreciate your patience during this process.");
            // }

            if (success) {
              if (ticket.status === 'OPEN') {
                await TicketRepository.updateStatus(db, ticketId, 'IN_PROGRESS');
              }
              await TicketEventRepository.insertEvent(db, {
                ticket_id: ticketId,
                actor_user_id: null,
                event_type: 'AUTOMATED_UPDATE',
                message: "We are currently coordinating with our Network Tier 2 team for end-to-end media verification. Rest assured, we will keep you informed with the latest updates as soon as they become available. The tentative Estimated Resolution Time is 90 min. We appreciate your patience during this process.",
                metadata: { heading: "Issue Analysing", source: "AUTOMATION_WORKER" },
                visible_to_customer: true
              });
              ticketEventEmitter.emit('ticket_updated', {
                ticketId,
                data: { type: 'TICKET_EVENT_ADDED' }
              });
            }
            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          }
          break;
        }

        case 'MTTR_BREACH_ESCALATION': {
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fourHoursMs = 4 * 60 * 60 * 1000 - 5000; // 5-second buffer

          if (diffMs >= fourHoursMs) {
            const updatedTicket = await TicketRepository.updateStatus(db, ticketId, 'ESCALATED');

            await sendMttrEscalationEmail({
              customerName: ticketInfo.name,
              ticketNo: ticketInfo.ticket_no,
              category: ticketInfo.category,
              alternateEmail: ticketInfo.alternate_email,
              circuitId: ticketInfo.circuit_description,
              agentName: ticketInfo.agent_name
            });

            ticketEventEmitter.emit('ticket_updated', {
              ticketId,
              data: {
                type: 'TICKET_STATUS_UPDATED',
                ticket: updatedTicket
              }
            });

            await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
            logger.info(`[WORKER] MTTR breach escalation sent for Ticket #${ticketId}. Status updated to ESCALATED.`);
          }
          break;
        }
      case 'REOPENED_MTTR_BREACH_ESCALATION': {
        const lastReopen = await TicketEventRepository.getLastReopenedEvent(db, ticketId);
        const referenceTime = lastReopen ? new Date(lastReopen.created_at) : new Date(ticket.created_at);
        const now = new Date();
        const diffMs = now.getTime() - referenceTime.getTime();
        const fourHoursMs = 4 * 60 * 60 * 1000 - 5000; // 5-second buffer

        if (diffMs >= fourHoursMs) {
          const updatedTicket = await TicketRepository.updateStatus(db, ticketId, 'ESCALATED');

          await sendMttrEscalationEmail({
            customerName: ticketInfo.name,
            ticketNo: ticketInfo.ticket_no,
            category: ticketInfo.category,
            alternateEmail: ticketInfo.alternate_email,
            circuitId: ticketInfo.circuit_description
          });

          ticketEventEmitter.emit('ticket_updated', {
            ticketId,
              data: {
                type: 'TICKET_STATUS_UPDATED',
                ticket: updatedTicket
              }
            });

          await AutomatedEmailLogRepository.logEmailSent(db, ticketId, jobName);
          logger.info(`[WORKER] Reopened MTTR breach escalation sent for Ticket #${ticketId}. Status updated to ESCALATED.`);
        }
        break;
      }

        case 'CLOSE_RESOLVED_TICKET': {
          try {
            await db.transaction(async (tx) => {
              const lockedTicket = await TicketRepository.findByIdForUpdate(tx, ticketId);
            
            if ( lockedTicket && lockedTicket.status === 'RESOLVED' && lockedTicket.rca && lockedTicket.rca.trim() ) {
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

ticketAutomationWorker.on('error', (err) => {
  logger.error('[BULLMQ WORKER] Error:', err);
});
