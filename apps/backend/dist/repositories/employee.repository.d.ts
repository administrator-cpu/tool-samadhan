import { PoolClient, Pool } from 'pg';
import { Employee } from '../types/models.js';
export declare class EmployeeRepository {
    static create(client: PoolClient, userId: string): Promise<Employee>;
    static findByUserId(client: PoolClient, userId: string): Promise<(Employee & {
        role: string;
        name: string;
    }) | null>;
    static findByRowId(client: PoolClient, employeeRowId: string): Promise<{
        user_id: string;
    } | null>;
    static findAllWithCategories(pool: Pool): Promise<any[]>;
    static findAllAgents(pool: Pool): Promise<any[]>;
    static replaceCategoriesByName(client: PoolClient, employeeRowId: string, categoryNames: string[]): Promise<void>;
    static findBestAgentForCategory(client: PoolClient, categoryId: string): Promise<{
        employee_id: string;
    } | null>;
}
//# sourceMappingURL=employee.repository.d.ts.map