import crypto from 'crypto';
import argon2 from 'argon2';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { UserRepository } from '../repositories/user.repository.js';
import { EmployeeRepository } from '../repositories/employee.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { CreateEmployeeDto, CreateCustomerDto, UpdateProfileDto, ChangePasswordDto, UserRole, PaginatedResponse } from '../types/dto.js';
import { sendStaffWelcomeEmail, sendCustomerWelcomeEmail } from './email.service.js';
import { disconnectUser } from './socket.service.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/environment.js';
import Fuse from "fuse.js";

interface SuggestedCustomer {
  samadhanId: number;
  samadhanName: string;
  crmName: string | null;
  score: number;
}


export class UserService {
  static async createEmployee(dto: CreateEmployeeDto) {
    const result = await db.transaction(async (tx) => {
      const existingUser = await UserRepository.findByEmail(tx, dto.email);
      if (existingUser) {
        throw new AppError(400, 'User with this email already exists', ErrorCodes.EMAIL_EXISTS);
      }

      const generatedPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await argon2.hash(generatedPassword);

      const user = await UserRepository.create(tx, {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        phone: dto.phone,
      });

      const employee = await EmployeeRepository.create(tx, user.id);

      if (dto.role === UserRole.SUPPORT_AGENT && (dto.issueCategories && dto.issueCategories.length > 0)) {
        await EmployeeRepository.replaceCategoriesByName(tx, employee.id, dto.issueCategories || []);
      }

      return { user, employee, generatedPassword };
    });

    sendStaffWelcomeEmail({
      name: result.user.name,
      email: result.user.email,
      password: result.generatedPassword,
      role: result.user.role,
    }).catch(err => logger.error('[EMAIL] Failed to send staff welcome email', err));

    return { user: result.user, employee: result.employee };
  }

  static async createCustomer(dto: CreateCustomerDto) {
    const result = await db.transaction(async (tx) => {
      const existingUser = await UserRepository.findByEmail(tx, dto.email);
      if (existingUser) {
        throw new AppError(400, 'User with this email already exists', ErrorCodes.EMAIL_EXISTS);
      }

      const generatedPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await argon2.hash(generatedPassword);

      const user = await UserRepository.create(tx, {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: UserRole.USER,
        phone: dto.phone,
      });

      const customer = await CustomerRepository.create(tx, user.id);

      return { user, customer, generatedPassword };
    });

    sendCustomerWelcomeEmail({
      name: result.user.name,
      email: result.user.email,
      password: result.generatedPassword,
    }).catch(err => logger.error('[EMAIL] Failed to send customer welcome email', err));

    return { user: result.user, customer: result.customer };
  }

  static async listAllEmployees(page: number, limit: number): Promise<PaginatedResponse<any>> {
    const { employees, total } = await EmployeeRepository.findAllWithCategories(db, page, limit);
    return {
      employees,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async listAllAgents() {
    return EmployeeRepository.findAllAgents(db);
  }

  static async listAllCustomers(page: number, limit: number, search?: string): Promise<PaginatedResponse<any>> {
    const { customers, total } = await CustomerRepository.findAll(db, page, limit, search);
    
    for (const customer of customers) {
      const outstanding = await this.getOutstandingBalance(customer.name);
      customer.outstanding = outstanding;
    }
    
    return {
      customers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async getOutstandingBalance(customerName: string): Promise<number> {
    const bahiKhataUrl = `${env.bahiKhataApiUrl}?name=${encodeURIComponent(customerName.trim().toUpperCase())}`;
    const response = await fetch(bahiKhataUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.bahiKhataApiKey,
      }
    });

    // if (!response.ok) throw new Error(`BahiKhata API returned ${response.status}`);

    const outstandingBalance = await response.json();
    if (outstandingBalance.matchFound) return outstandingBalance.data.aging.total;
    else return null;
  }


  private static cache: SuggestedCustomer[] | null = null;
  private static cacheExpiry = 0;

  private static readonly CACHE_TIME = 24 * 60 * 60 * 1000;
  static async listAllNotLinkedCustomers(): Promise<SuggestedCustomer[]> {

    if ( this.cache && Date.now() < this.cacheExpiry ) return this.cache;

    const [samadhanCustomers, crmRes] = await Promise.all([
      CustomerRepository.customerList(db),
      fetch(`${env.crmApiUrl}/customers?limit=10000`, {
        headers: { "x-api-key": env.crmApiKey },
      }),
    ]);

    if (!crmRes.ok) {
      throw new Error("Unable to fetch CRM customers");
    }

    const crmData = await crmRes.json();

    const fuse = new Fuse(crmData.customers, {
      keys: ["name"],
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 3,
    });

    const result: SuggestedCustomer[] = [];

    for (const customer of samadhanCustomers.customers) {
      const exact = crmData.customers.find(
        (crm: any) => crm.name === customer.name.trim().toUpperCase()
      );

      if (exact) continue;
      
      const search = fuse.search(customer.name, {
        limit: 1,
      });

      let crmName: string | null = null;
      let score = 0;

      if (search.length > 0) {
        crmName = (search[0].item as any).name;
        score = Math.round((1 - (search[0].score ?? 1)) * 100);

        if (score < 70) {
          crmName = null;
        }
      }
      result.push({
        samadhanId: customer.id,
        samadhanName: customer.name,
        crmName,
        score,
      });
    }
    result.sort((a, b) => b.score - a.score);

    this.cache = result;
    this.cacheExpiry = Date.now() + this.CACHE_TIME;

    return result;
  }

























    

  //   const notLinkedCustomers: string[] = [];
    
  //   const [samadhanCustomers, crmRes] = await Promise.all([
  //     CustomerRepository.customerList(db),
  //     fetch(`${env.crmApiUrl}/customers?limit=10000`, {
  //       headers: { "x-api-key": env.crmApiKey },
  //     }),
  //   ]);

  //   if (!crmRes.ok) logger.error(`CRM API failed with status ${crmRes.status}`)
  //   const crmData = await crmRes.json();

  //   // Create a lookup Set of CRM customer names
  //   const crmCustomerNames = new Set<string> (
  //     crmData.customers.map((customer: any) =>
  //       customer.name.trim().toLowerCase()
  //     )
  //   );

  //   for (const customer of samadhanCustomers.customers) {
  //     const customerName = customer.name.trim().toLowerCase();
    
  //     if (!crmCustomerNames.has(customerName)) {
  //       notLinkedCustomers.push(customer.name);
  //     }
  //   }
  //   return notLinkedCustomers;
  // }


  static async updateEmployee(employeeRowId: string, dto: any) {
    return db.transaction(async (tx) => {
      const empInfo = await EmployeeRepository.findByRowId(tx, employeeRowId);
      if (!empInfo) throw new AppError(404, 'Employee not found', ErrorCodes.EMPLOYEE_NOT_FOUND);

      const userId = empInfo.user_id;

      if (dto.name || dto.email || dto.phone) {
        if (dto.email) {
          const userCheck = await UserRepository.findByEmail(tx, dto.email);
          if (userCheck && userCheck.id !== userId) {
            throw new AppError(400, 'Email already in use', ErrorCodes.EMAIL_EXISTS);
          }
        }
        await UserRepository.update(tx, userId, dto);
      }

      if (dto.issueCategories !== undefined) {
        await EmployeeRepository.replaceCategoriesByName(tx, employeeRowId, dto.issueCategories);
      }

      return UserRepository.findById(tx, userId);
    });
  }

  static async deleteEmployee(employeeRowId: string) {
    return db.transaction(async (tx) => {
      const empInfo = await EmployeeRepository.findByRowId(tx, employeeRowId);
      if (!empInfo) throw new AppError(404, 'Employee not found', ErrorCodes.EMPLOYEE_NOT_FOUND);
      
      await UserRepository.deleteById(tx, empInfo.user_id);
      disconnectUser(empInfo.user_id);
    });
  }

  static async updateCustomer(customerRowId: string, dto: any) {
    return db.transaction(async (tx) => {
      const custInfo = await CustomerRepository.findByRowId(tx, customerRowId);
      if (!custInfo) throw new AppError(404, 'Customer not found', ErrorCodes.CUSTOMER_NOT_FOUND);

      const userId = custInfo.user_id;

      if (dto.name || dto.email || dto.phone) {
        if (dto.email) {
          const userCheck = await UserRepository.findByEmail(tx, dto.email);
          if (userCheck && userCheck.id !== userId) {
            throw new AppError(400, 'Email already in use', ErrorCodes.EMAIL_EXISTS);
          }
        }
        await UserRepository.update(tx, userId, dto);
      }

      return UserRepository.findById(tx, userId);
    });
  }

  static async deleteCustomer(customerRowId: string) {
    return db.transaction(async (tx) => {
      const custInfo = await CustomerRepository.findByRowId(tx, customerRowId);
      if (!custInfo) throw new AppError(404, 'Customer not found', ErrorCodes.CUSTOMER_NOT_FOUND);
      
      await UserRepository.deleteById(tx, custInfo.user_id);
      disconnectUser(custInfo.user_id);
    });
  }

  static async getCustomerUserByRowId(customerRowId: string) {
    return db.transaction(async (tx) => {
      const custInfo = await CustomerRepository.findByRowId(tx, customerRowId);
      if (!custInfo) return null;
      return UserRepository.findById(tx, custInfo.user_id);
    });
  }

  static async updatePassword(userId: string, dto: ChangePasswordDto) {
    return db.transaction(async (tx) => {
      const user = await UserRepository.findById(tx, userId);
      if (!user) throw new AppError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
      
      const userWithPass = await tx.execute(sql`SELECT password FROM users WHERE id = ${userId}`);

      if (!user.must_change_password) {
        if (!dto.currentPassword) {
          throw new AppError(400, 'Current password is required', ErrorCodes.VALIDATION_ERROR);
        }
        const validPassword = await argon2.verify(userWithPass.rows[0].password as string, dto.currentPassword);
        if (!validPassword) {
          throw new AppError(401, 'Invalid current password', ErrorCodes.INVALID_CREDENTIALS);
        }
      }

      const hashedPassword = await argon2.hash(dto.newPassword || '');
      await UserRepository.updatePassword(tx, userId, hashedPassword);
      await UserRepository.clearMustChangePassword(tx, userId);

      // Invalidate other sessions
      await tx.execute(sql`UPDATE sessions SET revoked = TRUE, revoked_at = NOW() WHERE user_id = ${userId}`);
      disconnectUser(userId);
    });
  }

  static async updateUserProfile(userId: string, dto: UpdateProfileDto) {
    return db.transaction(async (tx) => {
      if (dto.email) {
        const userCheck = await UserRepository.findByEmail(tx, dto.email);
        if (userCheck && userCheck.id !== userId) {
          throw new AppError(400, 'Email already in use', ErrorCodes.EMAIL_EXISTS);
        }
      }

      await UserRepository.update(tx, userId, dto);
      return UserRepository.findById(tx, userId);
    });
  }

  static async getCurrentUserDetails(userId: string) {
    const tx = db;
    try {
      const user = await UserRepository.findById(tx, userId);
      if (!user) throw new AppError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);

      let employeeCategories = [];
      let relatedId = null;

      if (user.role === UserRole.USER) {
        const cust = await CustomerRepository.findByUserId(tx, userId);
        relatedId = cust?.id;
      } else {
        const emp = await EmployeeRepository.findByUserId(tx, userId);
        relatedId = emp?.id;

        if (user.role === UserRole.SUPPORT_AGENT && emp) {
          const catRes = await tx.execute(
            sql`SELECT ic.name FROM employee_issue_categories eic 
             JOIN issue_categories ic ON eic.issue_category_id = ic.id 
             WHERE eic.employee_id = ${emp.id}`
          );
          employeeCategories = catRes.rows.map(row => row.name);
        }
      }

      return {
        ...user,
        relatedId,
        issueCategories: employeeCategories,
      };
    } finally {
      // client.release();
    }
  }
}
