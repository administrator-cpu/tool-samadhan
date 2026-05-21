import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.js";
import postgresPool from "../config/db.js";
import { 
  sendCustomerAssignment2MinEmail, 
  sendTroubleshootingUpdateEmail, 
  sendLongDelayUpdateEmail 
} from "../utils/emailService.js";
import ticketEventEmitter from "../utils/eventEmitter.js";

const getTicketWithCustomer = async (ticketId) => {
  const res = await postgresPool.query(
    `SELECT t.id, t.ticket_no, t.status, t.current_assigned_employee_id, t.created_at, t.resolved_at, t.rca,
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
    // For CLOSE_RESOLVED_TICKET, we allow the status to be RESOLVED
    if (ticket.status === "CLOSED" || (ticket.status === "RESOLVED" && jobName !== "CLOSE_RESOLVED_TICKET")) {
      console.log(`[WORKER] Ticket #${ticketId} is ${ticket.status} for job ${jobName}. Skipping.`);
      return;
    }

    if (await wasEmailSent(ticketId, jobName)) {
      console.log(`[WORKER] ${jobName} already sent for Ticket #${ticketId}. Skipping.`);
      return;
    }

    try {
      switch (jobName) {
        case "AGENT_ASSIGNMENT_CHECK":
          await sendCustomerAssignment2MinEmail({
            name: ticket.customer_name,
            email: ticket.customer_email,
            ticketNo: ticket.ticket_no,
          });
          await logEmailSent(ticketId, jobName);
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

        case "FINAL_ACTIVITY_CHECK": {
          const createdAt = new Date(ticket.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const fortyFiveMinutesMs = 45 * 60 * 1000 - 5000; // 45 minutes minus a 5s buffer

          if (diffMs >= fortyFiveMinutesMs && !(await hasAgentReplied(ticketId))) {
            await sendLongDelayUpdateEmail({
              name: ticket.customer_name,
              email: ticket.customer_email,
              ticketNo: ticket.ticket_no,
            });
            await logEmailSent(ticketId, jobName);
          }
          break;
        }

        case "CLOSE_RESOLVED_TICKET": {
          const client = await postgresPool.connect();
          try {
            await client.query("BEGIN");
            const ticketRes = await client.query(
              `SELECT status, rca FROM tickets WHERE id = $1 FOR UPDATE`,
              [ticketId]
            );
            if (
              ticketRes.rowCount > 0 && 
              ticketRes.rows[0].status === "RESOLVED" && 
              ticketRes.rows[0].rca && 
              ticketRes.rows[0].rca.trim()
            ) {
              const now = new Date();
              await client.query(
                `UPDATE tickets SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE WHERE id = $1`,
                [ticketId]
              );
              
              const values = [
                ticketId,
                null,
                "STATUS_CHANGED",
                "Ticket automatically closed after 24 hours of resolution.",
                JSON.stringify({ status: "CLOSED", autoClosed: true }),
                true
              ];
              await client.query(
                `INSERT INTO ticket_events (ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                values
              );
              
              // Emit real-time status update
              ticketEventEmitter.emit("ticket_updated", {
                ticketId,
                data: {
                  type: "TICKET_STATUS_UPDATED",
                  ticket: {
                    id: ticketId,
                    status: "CLOSED",
                    closed_at: now,
                    updated_at: now,
                    allow_customer_reply: false
                  }
                }
              });
              
              console.log(`[WORKER] Ticket #${ticketId} automatically closed after 24 hours.`);
            } else {
              console.log(`[WORKER] Ticket #${ticketId} not closed: either status is not RESOLVED or RCA is missing.`);
            }
            await client.query("COMMIT");
          } catch (err) {
            await client.query("ROLLBACK");
            throw err;
          } finally {
            client.release();
          }
          break;
        }

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
