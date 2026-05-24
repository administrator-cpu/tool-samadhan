import { Pool, PoolClient } from 'pg';

export class AutomatedEmailLogRepository {
  static async wasEmailSent(poolOrClient: Pool | PoolClient, ticketId: string, emailType: string): Promise<boolean> {
    const res = await poolOrClient.query(
      `SELECT 1 FROM automated_email_logs WHERE ticket_id = $1 AND email_type = $2`,
      [ticketId, emailType]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  static async logEmailSent(poolOrClient: Pool | PoolClient, ticketId: string, emailType: string): Promise<void> {
    await poolOrClient.query(
      `INSERT INTO automated_email_logs (ticket_id, email_type) VALUES ($1, $2)`,
      [ticketId, emailType]
    );
  }
}
