import { z } from 'zod';
import { validateBody } from './validate.js';
import { UserRole } from '../../types/enums.js';
export const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().max(15).nullable().optional(),
    role: z.nativeEnum(UserRole).optional(),
    issueCategories: z.array(z.string()).optional(),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(15).nullable().optional(),
    issueCategories: z.array(z.string()).optional(),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});
export const verifyOtpSchema = z.object({
    email: z.string().email(),
    otpCode: z.string().length(6),
});
export const resetPasswordSchema = z.object({
    email: z.string().email(),
    otpCode: z.string().length(6),
    newPassword: z.string().min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
});
export const validateRegister = validateBody(registerSchema);
export const validateLogin = validateBody(loginSchema);
export const validateUpdateProfile = validateBody(updateProfileSchema);
export const validateChangePassword = validateBody(changePasswordSchema);
export const validateForgotPassword = validateBody(forgotPasswordSchema);
export const validateVerifyOtp = validateBody(verifyOtpSchema);
export const validateResetPassword = validateBody(resetPasswordSchema);
//# sourceMappingURL=user.validator.js.map