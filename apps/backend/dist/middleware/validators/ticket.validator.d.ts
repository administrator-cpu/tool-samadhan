import { z } from 'zod';
export declare const createTicketSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    issueCategoryId: z.ZodString;
    circuitDescription: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        OPEN: "OPEN";
        IN_PROGRESS: "IN_PROGRESS";
        ESCALATED: "ESCALATED";
        RESOLVED: "RESOLVED";
        CLOSED: "CLOSED";
        REOPENED: "REOPENED";
    }>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addEventSchema: z.ZodObject<{
    message: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    visibleToCustomer: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateRcaSchema: z.ZodObject<{
    rca: z.ZodString;
}, z.core.$strip>;
export declare const updateOutageSchema: z.ZodObject<{
    problemSide: z.ZodOptional<z.ZodString>;
    externalTicketNo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const reassignSchema: z.ZodObject<{
    employeeId: z.ZodString;
}, z.core.$strip>;
export declare const toggleReplySchema: z.ZodObject<{
    allowCustomerReply: z.ZodBoolean;
}, z.core.$strip>;
export declare const rateTicketSchema: z.ZodObject<{
    rating: z.ZodNumber;
    feedback: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const validateCreateTicket: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateUpdateStatus: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateAddEvent: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateUpdateRca: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateUpdateOutage: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateReassign: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateToggleReply: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateRateTicket: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddEventInput = z.infer<typeof addEventSchema>;
export type UpdateRcaInput = z.infer<typeof updateRcaSchema>;
export type UpdateOutageInput = z.infer<typeof updateOutageSchema>;
export type ReassignInput = z.infer<typeof reassignSchema>;
export type ToggleReplyInput = z.infer<typeof toggleReplySchema>;
export type RateTicketInput = z.infer<typeof rateTicketSchema>;
//# sourceMappingURL=ticket.validator.d.ts.map