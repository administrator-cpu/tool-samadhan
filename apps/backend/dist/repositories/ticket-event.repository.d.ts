import { PoolClient, Pool } from 'pg';
import { TicketEvent } from '../types/models.js';
export declare class TicketEventRepository {
    static insertEvent(client: PoolClient, event: Partial<TicketEvent>): Promise<TicketEvent>;
    static insertEvents(client: PoolClient, events: Partial<TicketEvent>[]): Promise<TicketEvent[]>;
    static findByTicketId(client: PoolClient, ticketId: string, visibleToCustomerOnly?: boolean): Promise<any[]>;
    static findMissedEvents(pool: Pool, ticketId: string, afterEventId: string, limit: number): Promise<{
        events: any[];
        hasMore: boolean;
    }>;
    static hasAgentReplied(poolOrClient: Pool | PoolClient, ticketId: string): Promise<boolean>;
}
//# sourceMappingURL=ticket-event.repository.d.ts.map