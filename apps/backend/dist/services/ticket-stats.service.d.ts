export declare class TicketStatsService {
    static getAdminStats(userId: string, role: string): Promise<{
        ticketCounts: {
            OPEN: number;
            IN_PROGRESS: number;
            ESCALATED: number;
            RESOLVED: number;
            CLOSED: number;
            TOTAL: number;
        };
        unassignedActiveTickets: number;
        ticketsByCategory: any[];
        agentWorkload: any[];
        recentActivity: any[];
        userCounts: any[];
    }>;
    static getAgentStats(userId: string): Promise<{
        myTickets: {
            OPEN: number;
            IN_PROGRESS: number;
            ESCALATED: number;
            RESOLVED: number;
            CLOSED: number;
            TOTAL_ACTIVE: number;
        };
        unassignedOpportunities: any[];
        recentlyAssignedCount: number;
    }>;
}
//# sourceMappingURL=ticket-stats.service.d.ts.map