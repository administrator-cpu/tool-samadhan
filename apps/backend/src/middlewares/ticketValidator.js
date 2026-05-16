import Joi from "joi";
import AppError from "../utils/AppError.js";

const createTicketSchema = Joi.object({
  message: Joi.string().trim().max(5000).allow("", null),
  circuitDescription: Joi.string().trim().max(500).allow("", null),
  issueCategoryId: Joi.number().required(),
});

const addTicketEventSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required(),
  visibleToCustomer: Joi.boolean().default(true),
});

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(
      new AppError(
        400,
        "Validation failed",
        "VALIDATION_ERROR",
        error.details.map((d) => d.message),
      ),
    );
  }

  req.body = value;
  next();
};

export const validateCreateTicket = validateBody(createTicketSchema);
export const validateAddTicketEvent = validateBody(addTicketEventSchema);