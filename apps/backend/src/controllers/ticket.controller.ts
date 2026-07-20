import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { TicketStatsService } from '../services/ticket-stats.service.js';
import { IssueCategoryRepository } from '../repositories/issue-category.repository.js';
import { db } from '../config/database.js';
import { sendResponse } from '../utils/response.js';
import { UserRole } from '../types/dto.js';

export class TicketController {

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await IssueCategoryRepository.findAllActive(db);
      return sendResponse({ res, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getUnassignedCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await IssueCategoryRepository.findUnassigned(db);
      return sendResponse({ res, data: categories });
    } catch (error) {
      next(error);
    }
  }
  static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.createTicket(req.body, req.user!.userId, req.user!.role);
      return sendResponse({ res, statusCode: 201, message: 'Ticket created successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as unknown as string) || 10;
      const filters = {
        ownership: req.query.ownership as unknown as string,
        agentId: req.query.agentId as unknown as string,
        statusGroup: req.query.statusGroup as unknown as string,
        status: req.query.status as unknown as string,
        searchQuery: req.query.searchQuery as unknown as string,
        sortField: req.query.sortField as unknown as string,
        sortOrder: req.query.sortOrder as unknown as string,
      };

      const result = await TicketService.listUserTickets(req.user!.userId, req.user!.role, cursor, limit, filters);
      return sendResponse({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTicketTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.getTicketTimeline(
        (req.params.id as string), 
        req.user!.userId, 
        req.user!.role, 
        req.query.afterEventId as unknown as string,
        parseInt(req.query.limit as unknown as string) || 200
      );
      return sendResponse({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async addTicketEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await TicketService.addTicketEvent((req.params.id as string), req.body, req.user!.userId, req.user!.role);
      return sendResponse({ res, statusCode: 201, message: 'Event added successfully', data: { event } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.updateTicketStatus((req.params.id as string), req.body, req.user!.userId, req.user!.role);
      return sendResponse({ res, message: 'Ticket status updated successfully', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async updateTicketRca(req: Request, res: Response, next: NextFunction) {
    try {
      const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
      const newImages = req.body.metadata?.attachments || [];
      const ticket = await TicketService.updateTicketRca((req.params.id as string), req.body.rca, existingImages, newImages, req.user!.userId);
      return sendResponse({ res, message: 'Ticket RCA updated successfully', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async updateOutageDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.updateOutageDetails((req.params.id as string), req.body, req.user!.userId);
      return sendResponse({ res, message: 'Outage details updated successfully', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async reassignTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.reassignTicket((req.params.id as string), req.body.employeeId, req.user!.userId);
      return sendResponse({ res, message: 'Ticket assigned successfully', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async toggleCustomerReply(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.toggleCustomerReply((req.params.id as string), req.body.allowCustomerReply, req.user!.userId);
      return sendResponse({ res, message: 'Customer reply status updated', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async rateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.updateTicketRating((req.params.id as string), req.body.rating, req.body.feedback, req.user!.userId);
      return sendResponse({ res, message: 'Rating submitted successfully', data: { ticket } });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      let stats;
      if (req.user!.role === UserRole.SALES) {
        stats = await TicketStatsService.getSalesStats(req.user!.userId);
      } else {
        stats = await TicketStatsService.getAdminStats(req.user!.userId, req.user!.role);
      }
      return sendResponse({ res, data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  static async getAgentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await TicketStatsService.getAgentStats(req.user!.userId);
      return sendResponse({ res, data: { stats } });
    } catch (error) {
      next(error);
    }
  }

  static async getEarliestTicketYear(req: Request, res: Response, next: NextFunction) {
    try {
      const year = await TicketService.getEarliestTicketYear();
      return sendResponse({ res, data: { year } });
    } catch (error) {
      next(error);
    }
  }

  static async getResolvedTicketsExport(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as unknown as string) || 1;
      const limit = parseInt(req.query.limit as unknown as string) || 10;
      const exportAll = req.query.exportAll === 'true' || req.query.export === 'true';
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;

      const result = await TicketService.listResolvedTickets(page, limit, exportAll, year, month);
      return sendResponse({ res, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const circuitId = req.query.circuitId as string | undefined;
      const { MetricService } = await import('../services/metric.service.js');
      const metrics = await MetricService.getCustomerMetrics(req.user!.userId, circuitId || null);
      return sendResponse({ res, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}
