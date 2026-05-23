import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/dto.js';
import {
  validateCreateTicket,
  validateUpdateStatus,
  validateAddEvent,
  validateUpdateRca,
  validateUpdateOutage,
  validateReassign,
  validateToggleReply,
  validateRateTicket
} from '../middleware/validators/ticket.validator.js';

const router = Router();

router.use(requireAuth);

// Base operations
router.post('/', validateCreateTicket, TicketController.createTicket);
router.get('/', TicketController.getTickets);

// Dashboard Stats
router.get('/stats', requireRole([UserRole.ADMIN]), TicketController.getAdminStats);
router.get('/agent-stats', requireRole([UserRole.SUPPORT_AGENT]), TicketController.getAgentStats);

// Resolved Export
router.get('/resolved', requireRole([UserRole.ADMIN]), TicketController.getResolvedTicketsExport);

// Ticket Details & Timeline
router.get('/:id', TicketController.getTicketTimeline);

// Ticket Actions
router.post('/:id/events', validateAddEvent, TicketController.addTicketEvent);

router.patch(
  '/:id/status',
  requireRole([UserRole.SUPPORT_AGENT, UserRole.ADMIN, UserRole.USER]),
  validateUpdateStatus,
  TicketController.updateTicketStatus
);

router.patch(
  '/:id/rca',
  requireRole([UserRole.SUPPORT_AGENT, UserRole.ADMIN]),
  validateUpdateRca,
  TicketController.updateTicketRca
);

router.patch(
  '/:id/outage',
  requireRole([UserRole.SUPPORT_AGENT, UserRole.ADMIN]),
  validateUpdateOutage,
  TicketController.updateOutageDetails
);

router.post(
  '/:id/reassign',
  requireRole([UserRole.ADMIN]),
  validateReassign,
  TicketController.reassignTicket
);

router.patch(
  '/:id/reply-status',
  requireRole([UserRole.SUPPORT_AGENT, UserRole.ADMIN]),
  validateToggleReply,
  TicketController.toggleCustomerReply
);

router.post(
  '/:id/rate',
  requireRole([UserRole.USER]),
  validateRateTicket,
  TicketController.rateTicket
);

export default router;
