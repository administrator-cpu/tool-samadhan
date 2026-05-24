import { z } from 'zod';
import { validateBody } from './validate.js';

export const createTicketSchema = z.object({
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  issueCategoryId: z.string(),
  circuitDescription: z.string(),
  message: z.string().optional(),
});

const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED']);

export const updateStatusSchema = z.object({
  status: statusEnum,
  message: z.string().optional(),
});

export const addEventSchema = z.object({
  message: z.string().optional().default(""),
  metadata: z.record(z.string(), z.any()).optional(),
  visibleToCustomer: z.boolean().optional(),
});

export const updateRcaSchema = z.object({
  rca: z.string(),
});

export const updateOutageSchema = z.object({
  problemSide: z.string({ 
    message: "Problem Side is required",
  }).min(1, "Problem Side is required"),
  externalTicketNo: z.string().nullable().optional(),
});

export const reassignSchema = z.object({
  employeeId: z.string(),
});

export const toggleReplySchema = z.object({
  allowCustomerReply: z.boolean(),
});

export const rateTicketSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const validateCreateTicket = validateBody(createTicketSchema);
export const validateUpdateStatus = validateBody(updateStatusSchema);
export const validateAddEvent = validateBody(addEventSchema);
export const validateUpdateRca = validateBody(updateRcaSchema);
export const validateUpdateOutage = validateBody(updateOutageSchema);
export const validateReassign = validateBody(reassignSchema);
export const validateToggleReply = validateBody(toggleReplySchema);
export const validateRateTicket = validateBody(rateTicketSchema);

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddEventInput = z.infer<typeof addEventSchema>;
export type UpdateRcaInput = z.infer<typeof updateRcaSchema>;
export type UpdateOutageInput = z.infer<typeof updateOutageSchema>;
export type ReassignInput = z.infer<typeof reassignSchema>;
export type ToggleReplyInput = z.infer<typeof toggleReplySchema>;
export type RateTicketInput = z.infer<typeof rateTicketSchema>;
