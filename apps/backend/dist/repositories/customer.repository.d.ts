import { PoolClient, Pool } from 'pg';
import { Customer } from '../types/models.js';
export declare class CustomerRepository {
    static create(client: PoolClient, userId: string): Promise<Customer>;
    static findByUserId(client: PoolClient, userId: string): Promise<Customer | null>;
    static findByRowId(client: PoolClient, customerRowId: string): Promise<{
        user_id: string;
    } | null>;
    static findAll(pool: Pool, page?: number, limit?: number): Promise<{
        customers: any[];
        total: number;
    }>;
}
//# sourceMappingURL=customer.repository.d.ts.map