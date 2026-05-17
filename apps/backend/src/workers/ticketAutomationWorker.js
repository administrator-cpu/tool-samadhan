import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.js";
import postgresPool from "../config/db.js";
import { 
  sendTicketAssignmentEmails, 
  sendTroubleshootingUpdateEmail, 
  sendLongDelayUpdateEmail 
} from "../utils/emailService.js";

const getTicketWithCustomer = async (ticketId) => {
  const res = await postgresPool.query(
    `SELECT t.id, t.ticket_no, t.status, t.current_assigned_employee_id, 
            u.name as customer_name, u.email as customer_email, c.customer_id,
            ic.name as category_name, te.message as initial_message
     FROM tickets t
     JOIN customers c ON c.id = t.customer_id
     JOIN users u ON u.id = c.user_id
     JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
     LEFT JOIN ticket_events te ON te.ticket_id = t.id AND te.event_type = 'TICKET_CREATED'
     WHERE t.id = $1`,
    [ticketId]
  );
  return res.rows[0];
};

const wasEmailSent = async (ticketId, emailType) => {
  const res = await postgresPool.query(
    `SELECT 1 FROM automated_email_logs WHERE ticket_id = $1 AND email_type = $2`,
    [ticketId, emailType]
  );
  return res.rowCount > 0;
};

const logEmailSent = async (ticketId, emailType) => {
  await postgresPool.query(
    `INSERT INTO automated_email_logs (ticket_id, email_type) VALUES ($1, $2)`,
    [ticketId, emailType]
  );
};

const hasAgentReplied = async (ticketId) => {
  const res = await postgresPool.query(
    `SELECT 1 FROM ticket_events 
     WHERE ticket_id = $1 
     AND event_type IN ('AGENT_REPLY', 'MANAGER_REPLY', 'ADMIN_REPLY')
     LIMIT 1`,
    [ticketId]
  );
  return res.rowCount > 0;
};

export const ticketAutomationWorker = new Worker(
  "ticket-automation",
  async (job) => {
    const { ticketId } = job.data;
    const { name: jobName } = job;

    console.log(`[WORKER] Processing ${jobName} for Ticket #${ticketId}`);

    const ticket = await getTicketWithCustomer(ticketId);
    if (!ticket) return;

    // Strict State Checks
    if (["RESOLVED", "CLOSED"].includes(ticket.status)) {
      console.log(`[WORKER] Ticket #${ticketId} is ${ticket.status}. Skipping.`);
      return;
    }

    if (await wasEmailSent(ticketId, jobName)) {
      console.log(`[WORKER] ${jobName} already sent for Ticket #${ticketId}. Skipping.`);
      return;
    }

    try {
      switch (jobName) {
        case "AGENT_ASSIGNMENT_CHECK":
          if (ticket.current_assigned_employee_id) {
            const agentRes = await postgresPool.query(
              `SELECT u.name, u.email FROM employees e JOIN users u ON u.id = e.user_id WHERE e.id = $1`,
              [ticket.current_assigned_employee_id]
            );
            const agent = agentRes.rows[0];
            if (agent) {
              await sendTicketAssignmentEmails({
                customerName: ticket.customer_name,
                customerEmail: ticket.customer_email,
                customerId: ticket.customer_id,
                agentName: agent.name,
                agentEmail: agent.email,
                ticketNo: ticket.ticket_no,
                category: ticket.category_name,
                message: ticket.initial_message,
              });
              await logEmailSent(ticketId, jobName);
            }
          }
          break;

        case "TROUBLESHOOTING_UPDATE":
          if (!(await hasAgentReplied(ticketId))) {
            await sendTroubleshootingUpdateEmail({
              name: ticket.customer_name,
              email: ticket.customer_email,
              ticketNo: ticket.ticket_no,
            });
            await logEmailSent(ticketId, jobName);
          }
          break;

        case "FINAL_ACTIVITY_CHECK":
          if (!(await hasAgentReplied(ticketId))) {
            await sendLongDelayUpdateEmail({
              name: ticket.customer_name,
              email: ticket.customer_email,
              ticketNo: ticket.ticket_no,
            });
            await logEmailSent(ticketId, jobName);
          }
          break;

        default:
          console.warn(`[WORKER] Unknown job name: ${jobName}`);
      }
    } catch (error) {
      console.error(`[WORKER] Error processing ${jobName}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  { connection: redisConnection }
);
