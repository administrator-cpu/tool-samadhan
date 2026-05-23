import { TicketService } from '../services/ticket.service.js';
import { TicketStatsService } from '../services/ticket-stats.service.js';
import { sendResponse } from '../utils/response.js';
export class TicketController {
    static async createTicket(req, res, next) {
        try {
            const result = await TicketService.createTicket(req.body, req.user.userId, req.user.role);
            return sendResponse({ res, statusCode: 201, message: 'Ticket created successfully', data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTickets(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {
                ownership: req.query.ownership,
                agentId: req.query.agentId,
                statusGroup: req.query.statusGroup,
            };
            const result = await TicketService.listUserTickets(req.user.userId, req.user.role, page, limit, filters);
            return sendResponse({ res, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTicketTimeline(req, res, next) {
        try {
            const result = await TicketService.getTicketTimeline(req.params.id, req.user.userId, req.user.role, req.query.afterEventId, parseInt(req.query.limit) || 200);
            return sendResponse({ res, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async addTicketEvent(req, res, next) {
        try {
            const event = await TicketService.addTicketEvent(req.params.id, req.body, req.user.userId, req.user.role);
            return sendResponse({ res, statusCode: 201, message: 'Event added successfully', data: { event } });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTicketStatus(req, res, next) {
        try {
            const ticket = await TicketService.updateTicketStatus(req.params.id, req.body, req.user.userId, req.user.role);
            return sendResponse({ res, message: 'Ticket status updated successfully', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTicketRca(req, res, next) {
        try {
            const ticket = await TicketService.updateTicketRca(req.params.id, req.body.rca, req.user.userId);
            return sendResponse({ res, message: 'Ticket RCA updated successfully', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateOutageDetails(req, res, next) {
        try {
            const ticket = await TicketService.updateOutageDetails(req.params.id, req.body, req.user.userId);
            return sendResponse({ res, message: 'Outage details updated successfully', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async reassignTicket(req, res, next) {
        try {
            const ticket = await TicketService.reassignTicket(req.params.id, req.body.employeeId, req.user.userId);
            return sendResponse({ res, message: 'Ticket assigned successfully', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleCustomerReply(req, res, next) {
        try {
            const ticket = await TicketService.toggleCustomerReply(req.params.id, req.body.allowCustomerReply, req.user.userId);
            return sendResponse({ res, message: 'Customer reply status updated', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async rateTicket(req, res, next) {
        try {
            const ticket = await TicketService.updateTicketRating(req.params.id, req.body.rating, req.body.feedback, req.user.userId);
            return sendResponse({ res, message: 'Rating submitted successfully', data: { ticket } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAdminStats(req, res, next) {
        try {
            const stats = await TicketStatsService.getAdminStats(req.user.userId, req.user.role);
            return sendResponse({ res, data: { stats } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAgentStats(req, res, next) {
        try {
            const stats = await TicketStatsService.getAgentStats(req.user.userId);
            return sendResponse({ res, data: { stats } });
        }
        catch (error) {
            next(error);
        }
    }
    static async getResolvedTicketsExport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const exportAll = req.query.export === 'true';
            const result = await TicketService.listResolvedTickets(page, limit, exportAll);
            return sendResponse({ res, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=ticket.controller.js.map