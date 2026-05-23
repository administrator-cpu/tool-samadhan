import { Pool, PoolClient } from 'pg';
export declare class AutomatedEmailLogRepository {
    static wasEmailSent(poolOrClient: Pool | PoolClient, ticketId: string, emailType: string): Promise<boolean>;
    static logEmailSent(poolOrClient: Pool | PoolClient, ticketId: string, emailType: string): Promise<void>;
}
//# sourceMappingURL=automated-email-log.repository.d.ts.map