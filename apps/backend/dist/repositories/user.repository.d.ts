import { PoolClient } from 'pg';
import { User } from '../types/models.js';
export declare class UserRepository {
    static findByEmail(client: PoolClient, email: string): Promise<User | null>;
    static findById(client: PoolClient, userId: string): Promise<User | null>;
    static create(client: PoolClient, data: Partial<User>): Promise<User>;
    static update(client: PoolClient, userId: string, data: Partial<User>): Promise<User | null>;
    static updatePassword(client: PoolClient, userId: string, passwordHash: string): Promise<void>;
    static clearMustChangePassword(client: PoolClient, userId: string): Promise<void>;
    static deleteById(client: PoolClient, userId: string): Promise<void>;
}
//# sourceMappingURL=user.repository.d.ts.map