import Joi from "joi";
import AppError from "../utils/AppError.js";

const customerRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
});

const employeeCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string()
    .valid("SUPPORT_AGENT", "MANAGER", "ADMIN", "SALES")
    .required(),
  issueCategoryNames: Joi.array().items(Joi.string()).optional(),
});

const employeeUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  issueCategoryNames: Joi.array().items(Joi.string()).optional(),
});

const customerCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().trim().pattern(/^[0-9]+$/).min(5).max(15).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must contain only digits'
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  phone: Joi.string().trim().pattern(/^[0-9]{10}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits and contain only numbers'
  }),
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


export const validateCustomerRegister = validateBody(customerRegisterSchema);
export const validateCustomerCreate = validateBody(customerCreateSchema);
export const validateLogin = validateBody(loginSchema);
export const validateEmployeeCreate = validateBody(employeeCreateSchema);
export const validateEmployeeUpdate = validateBody(employeeUpdateSchema);
export const validateUpdateProfile = validateBody(updateProfileSchema);
