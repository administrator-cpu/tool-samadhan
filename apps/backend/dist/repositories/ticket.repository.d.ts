import { PoolClient, Pool } from 'pg';
import { Ticket } from '../types/models.js';
import { TicketStatus } from '../types/enums.js';
export declare class TicketRepository {
    static create(client: PoolClient, data: {
        customerId: string;
        createdByUserId: string;
        assignedEmployeeId: string | null;
        issueCategoryId: string;
        circuitDescription: string;
    }): Promise<Ticket>;
    static findByIdForUpdate(client: PoolClient, ticketId: string): Promise<Ticket | null>;
    static findById(poolOrClient: Pool | PoolClient, ticketId: string): Promise<Ticket | null>;
    static getCustomerContactInfo(poolOrClient: Pool | PoolClient, ticketId: string): Promise<any>;
    static updateStatus(client: PoolClient, ticketId: string, status: TicketStatus | string, additionalFields?: string[]): Promise<Ticket>;
    static updateFields(client: PoolClient, ticketId: string, updates: Partial<Ticket>): Promise<Ticket>;
    static bulkCloseExpiredResolvedTickets(poolOrClient: Pool | PoolClient): Promise<string[]>;
    static findTicketTimelineInfo(client: PoolClient, ticketId: string): Promise<any>;
    static checkCustomerOwnership(client: PoolClient, customerRowId: string, userId: string): Promise<boolean>;
    static findUserTickets(client: PoolClient, filters: {
        customerId?: string;
        employeeId?: string;
        salesUserId?: string;
        ownership?: string;
        statusGroup?: string;
    }, limit: number, offset: number): Promise<{
        tickets: any[];
        total: number;
    }>;
    static findResolvedTickets(client: PoolClient, limit: number, offset: number, exportAll: boolean): Promise<{
        tickets: any[][];
        total: number;
    }>;
}
//# sourceMappingURL=ticket.repository.d.ts.map