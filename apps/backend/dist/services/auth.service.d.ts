import { LoginDto, AuthResult } from '../types/dto.js';
export declare class AuthService {
    static loginUser(dto: LoginDto, reqMeta: {
        userAgent: string;
        ipAddress: string;
    }): Promise<AuthResult>;
    static refreshSession(refreshToken: string, reqMeta: {
        userAgent: string;
        ipAddress: string;
    }): Promise<AuthResult>;
    static logoutSession(refreshToken: string): Promise<void>;
}
//# sourceMappingURL=auth.service.d.ts.map