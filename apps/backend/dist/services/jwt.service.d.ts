import { JwtPayload } from '../types/dto.js';
export declare const generateTokens: (payload: JwtPayload) => {
    accessToken: string;
    refreshToken: string;
    jti: `${string}-${string}-${string}-${string}-${string}`;
};
export declare const verifyAccessToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => JwtPayload;
export declare const hashToken: (token: string) => string;
//# sourceMappingURL=jwt.service.d.ts.map