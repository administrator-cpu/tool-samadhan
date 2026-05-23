export declare class TicketService {
    static createTicket(dto: any, actorUserId: string, actorRole: string): Promise<{
        ticket: import("../types/models.js").Ticket;
        assignedAgentId: string;
    }>;
    static listUserTickets(userId: string, role: string, page: number, limit: number, filters: any): Promise<{
        tickets: any[];
        total: number;
        pages: number;
        currentPage: number;
        limit: number;
        pagination?: undefined;
    } | {
        tickets: any[];
        pagination: {
            total: number;
            pages: number;
            currentPage: number;
            limit: number;
        };
        total?: undefined;
        pages?: undefined;
        currentPage?: undefined;
        limit?: undefined;
    }>;
    static getTicketTimeline(ticketId: string, userId: string, role: string, afterEventId?: string, limit?: number): Promise<{
        ticket: any;
        events: any[];
        hasMore: boolean;
    }>;
    static addTicketEvent(ticketId: string, dto: any, actorUserId: string, role: string): Promise<import("../types/models.js").TicketEvent>;
    static updateTicketStatus(ticketId: string, dto: any, actorUserId: string, role: string): Promise<import("../types/models.js").Ticket>;
    static updateTicketRca(ticketId: string, rca: string, actorUserId: string): Promise<import("../types/models.js").Ticket>;
    static updateOutageDetails(ticketId: string, dto: any, actorUserId: string): Promise<import("../types/models.js").Ticket>;
    static reassignTicket(ticketId: string, employeeId: string, actorUserId: string): Promise<import("../types/models.js").Ticket>;
    static toggleCustomerReply(ticketId: string, allow: boolean, actorUserId: string): Promise<import("../types/models.js").Ticket>;
    static listResolvedTickets(page: number, limit: number, exportAll?: boolean): Promise<{
        tickets: any[][];
        pagination: {
            total: number;
            pages: number;
            currentPage: number;
            limit: number;
        };
    }>;
    static updateTicketRating(ticketId: string, rating: number, feedback: string, actorUserId: string): Promise<import("../types/models.js").Ticket>;
}
//# sourceMappingURL=ticket.service.d.ts.map