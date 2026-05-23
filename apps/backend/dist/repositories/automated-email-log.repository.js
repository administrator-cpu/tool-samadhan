export class AutomatedEmailLogRepository {
    static async wasEmailSent(poolOrClient, ticketId, emailType) {
        const res = await poolOrClient.query(`SELECT 1 FROM automated_email_logs WHERE ticket_id = $1 AND email_type = $2`, [ticketId, emailType]);
        return res.rowCount !== null && res.rowCount > 0;
    }
    static async logEmailSent(poolOrClient, ticketId, emailType) {
        await poolOrClient.query(`INSERT INTO automated_email_logs (ticket_id, email_type) VALUES ($1, $2)`, [ticketId, emailType]);
    }
}
//# sourceMappingURL=automated-email-log.repository.js.map