import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  validateCreateTicket,
  validateAddTicketEvent,
} from "../middlewares/ticketValidator.js";
import {
  createCustomerTicket,
  appendTicketEvent,
  fetchTicketTimeline,
  fetchUserTickets,
  reassignTicketController,
  updateTicketController,
  fetchAdminStats,
  fetchAgentStats,
  updateRcaController,
  fetchResolvedTickets,
} from "../controllers/ticketController.js";

const router = express.Router();

router.get(
  "/agent-stats",
  requireAuth,
  requireRole("SUPPORT_AGENT"),
  fetchAgentStats
);

router.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN"),
  fetchAdminStats
);

router.post(
  "/",
  requireAuth,
  requireRole("USER"),
  validateCreateTicket,
  createCustomerTicket,
);

router.get("/", requireAuth, fetchUserTickets);

router.get(
  "/resolved",
  requireAuth,
  requireRole("ADMIN", "MANAGER"),
  fetchResolvedTickets
);

router.post(
  "/:ticketId/events",
  requireAuth,
  requireRole("SUPPORT_AGENT", "MANAGER", "ADMIN"),
  validateAddTicketEvent,
  appendTicketEvent,
);

router.get("/:ticketId", requireAuth, fetchTicketTimeline);

router.patch(
  "/:ticketId",
  requireAuth,
  updateTicketController,
);

router.patch(
  "/:ticketId/reassign",
  requireAuth,
  requireRole("ADMIN"),
  reassignTicketController,
);

router.patch(
  "/:ticketId/rca",
  requireAuth,
  requireRole("SUPPORT_AGENT", "MANAGER", "ADMIN"),
  updateRcaController,
);

export default router;