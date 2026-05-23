import { Request, Response, NextFunction } from 'express';
export declare class TicketController {
    static createTicket(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getTickets(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getTicketTimeline(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static addTicketEvent(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateTicketRca(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static updateOutageDetails(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static reassignTicket(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static toggleCustomerReply(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static rateTicket(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getAdminStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getAgentStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    static getResolvedTicketsExport(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ticket.controller.d.ts.map