export declare class PasswordResetService {
    static requestPasswordReset(email: string): Promise<{
        message: string;
    }>;
    static verifyOtp(email: string, otpCode: string): Promise<void>;
    static completePasswordReset(email: string, otpCode: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=password-reset.service.d.ts.map