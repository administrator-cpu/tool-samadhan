import { db } from '../config/database.js';
import { automatedEmailLogs } from '../database/drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

export class AutomatedEmailLogRepository {
  static async wasEmailSent(tx: any = db, ticketId: string, emailType: string): Promise<boolean> {
    const res = await tx.query.automatedEmailLogs.findFirst({
      where: and(
        eq(automatedEmailLogs.ticket_id, parseInt(ticketId, 10)),
        eq(automatedEmailLogs.email_type, emailType)
      ),
      columns: { id: true }
    });
    return !!res;
  }

  static async logEmailSent(tx: any = db, ticketId: string, emailType: string): Promise<void> {
    await tx.insert(automatedEmailLogs).values({
      ticket_id: parseInt(ticketId, 10),
      email_type: emailType
    });
  }
}
