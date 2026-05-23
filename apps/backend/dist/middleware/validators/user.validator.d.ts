import { z } from 'zod';
import { UserRole } from '../../types/enums.js';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<typeof UserRole>>;
    issueCategories: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issueCategories: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodString;
    otpCode: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    otpCode: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const validateRegister: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateLogin: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateUpdateProfile: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateChangePassword: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateForgotPassword: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateVerifyOtp: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export declare const validateResetPassword: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<import("express").Response<any, Record<string, any>>>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=user.validator.d.ts.map