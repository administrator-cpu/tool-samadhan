import { CreateEmployeeDto, CreateCustomerDto, UpdateProfileDto, ChangePasswordDto, UserRole, PaginatedResponse } from '../types/dto.js';
export declare class UserService {
    static createEmployee(dto: CreateEmployeeDto): Promise<{
        user: import("../types/models.js").User;
        employee: import("../types/models.js").Employee;
    }>;
    static createCustomer(dto: CreateCustomerDto): Promise<{
        user: import("../types/models.js").User;
        customer: import("../types/models.js").Customer;
    }>;
    static listAllEmployees(): Promise<any[]>;
    static listAllAgents(): Promise<any[]>;
    static listAllCustomers(page: number, limit: number): Promise<PaginatedResponse<any>>;
    static updateEmployee(employeeRowId: string, dto: any): Promise<import("../types/models.js").User>;
    static deleteEmployee(employeeRowId: string): Promise<void>;
    static deleteCustomer(customerRowId: string): Promise<void>;
    static updatePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
    static updateUserProfile(userId: string, dto: UpdateProfileDto): Promise<import("../types/models.js").User>;
    static getCurrentUserDetails(userId: string): Promise<{
        relatedId: any;
        issueCategories: any[];
        id: string;
        name: string;
        email: string;
        phone: string | null;
        password?: string;
        role: UserRole;
        must_change_password?: boolean;
        created_at?: Date;
        updated_at?: Date;
    }>;
}
//# sourceMappingURL=user.service.d.ts.map