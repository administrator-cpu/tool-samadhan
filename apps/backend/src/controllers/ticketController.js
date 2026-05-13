import {
  createTicket,
  addTicketEvent,
  getTicketTimeline,
  listUserTickets,
  reassignTicket,
  updateTicket,
  getAdminStats,
  getAgentStats,
  updateTicketRca,
  listResolvedTickets,
} from "../services/ticketService.js";

export const fetchAgentStats = async (req, res) => {
  const result = await getAgentStats(req.user.userId);

  return res.status(200).json({
    statusCode: 200,
    message: "Agent stats fetched successfully",
    data: result,
  });
};

export const fetchAdminStats = async (req, res) => {
  const result = await getAdminStats();

  return res.status(200).json({
    statusCode: 200,
    message: "Admin stats fetched successfully",
    data: result,
  });
};

export const createCustomerTicket = async (req, res) => {
  const result = await createTicket({
    userId: req.user.userId,
    subject: req.body.subject,
    message: req.body.message,
    issueCategoryId: req.body.issueCategoryId,
  });

  return res.status(201).json({
    statusCode: 201,
    message: "Ticket created successfully",
    data: result,
  });
};

export const appendTicketEvent = async (req, res) => {
  const result = await addTicketEvent({
    ticketId: Number(req.params.ticketId),
    actorUserId: req.user.userId,
    message: req.body.message,
    visibleToCustomer: req.body.visibleToCustomer,
  });

  return res.status(201).json({
    statusCode: 201,
    message: "Ticket event added successfully",
    data: result,
  });
};

export const fetchTicketTimeline = async (req, res) => {
  const result = await getTicketTimeline({
    ticketId: Number(req.params.ticketId),
    requesterUserId: req.user.userId,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Ticket fetched successfully",
    data: result,
  });
};

export const fetchUserTickets = async (req, res) => {
  const { ownership, page, limit } = req.query;
  const result = await listUserTickets({
    userId: req.user.userId,
    ownership,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Tickets fetched successfully",
    data: result,
  });
};

export const updateTicketController = async (req, res) => {
  const result = await updateTicket({
    ticketId: Number(req.params.ticketId),
    status: req.body.status,
    priority: req.body.priority,
    actorUserId: req.user.userId,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Ticket updated successfully",
    data: result,
  });
};

export const reassignTicketController = async (req, res) => {
  const result = await reassignTicket({
    ticketId: Number(req.params.ticketId),
    employeeId: req.body.employeeId,
    actorUserId: req.user.userId,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Ticket reassigned successfully",
    data: result,
  });
};
export const updateRcaController = async (req, res) => {
  const result = await updateTicketRca({
    ticketId: Number(req.params.ticketId),
    rca: req.body.rca,
    actorUserId: req.user.userId,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "RCA updated successfully",
    data: result,
  });
};

export const fetchResolvedTickets = async (req, res) => {
  const { page, limit, exportAll } = req.query;
  const result = await listResolvedTickets({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    exportAll: exportAll === 'true'
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Resolved tickets fetched successfully",
    data: result,
  });
};
