import { UserRole, TicketStatus, TicketEventType } from './enums.js';
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    password?: string;
    role: UserRole;
    must_change_password?: boolean;
    created_at?: Date;
    updated_at?: Date;
}
export interface Employee {
    id: string;
    user_id: string;
    employee_id: string;
    joined_at: Date;
}
export interface Customer {
    id: string;
    user_id: string;
    customer_id: string;
    joined_at: Date;
}
export interface IssueCategory {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Ticket {
    id: string;
    ticket_no: string;
    customer_id: string;
    created_by_user_id: string | null;
    current_assigned_employee_id: string | null;
    primary_issue_category_id: string | null;
    status: TicketStatus;
    created_at: Date;
    updated_at: Date;
    resolved_at: Date | null;
    closed_at: Date | null;
    circuit_description: string | null;
    problem_side: string | null;
    external_ticket_no: string | null;
    rca: string | null;
    rating: number | null;
    rating_feedback: string | null;
    allow_customer_reply: boolean;
}
export interface TicketEvent {
    id: string;
    ticket_id: string;
    actor_user_id: string | null;
    event_type: TicketEventType | string;
    message: string | null;
    metadata: Record<string, any>;
    visible_to_customer: boolean;
    created_at: Date;
}
export interface Session {
    id: string;
    user_id: string;
    token_hash: string;
    jti: string;
    user_agent: string | null;
    ip_address: string | null;
    expires_at: Date;
    revoked: boolean;
    revoked_at: Date | null;
    last_used_at: Date | null;
    created_at: Date;
}
export interface PasswordResetOtp {
    id: number;
    user_id: string;
    otp_code: string;
    expires_at: Date;
    created_at: Date;
}
export interface AutomatedEmailLog {
    id: string;
    ticket_id: string;
    email_type: string;
    sent_at: Date;
}
//# sourceMappingURL=models.d.ts.map