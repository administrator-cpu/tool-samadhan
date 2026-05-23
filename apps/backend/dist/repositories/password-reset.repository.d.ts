import { PoolClient } from 'pg';
export declare class PasswordResetRepository {
    static findLastOtp(client: PoolClient, userId: string): Promise<{
        created_at: Date;
    } | null>;
    static deleteOtpsForUser(client: PoolClient, userId: string): Promise<void>;
    static createOtp(client: PoolClient, userId: string, otpCode: string, expiresAt: Date): Promise<void>;
    static verifyOtp(client: PoolClient, email: string, otpCode: string): Promise<{
        id: number;
        user_id: string;
        expires_at: Date;
    } | null>;
}
//# sourceMappingURL=password-reset.repository.d.ts.map