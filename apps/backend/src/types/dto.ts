import { UserRole, TicketStatus } from './enums.js';
export { UserRole, TicketStatus };

export type {
  LoginInput as LoginDto,
  RegisterInput as CreateEmployeeDto,
  RegisterInput as CreateCustomerDto,
  UpdateProfileInput as UpdateProfileDto,
  ChangePasswordInput as ChangePasswordDto,
} from '../middleware/validators/user.validator.js';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
  jti?: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    must_change_password?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  tickets?: T[]; // Sometimes we use tickets key
  customers?: T[]; // Sometimes we use customers key
  total?: number;
  pagination?: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
  page?: number;
  limit?: number;
  totalPages?: number;
}
