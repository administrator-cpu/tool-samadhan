import { db } from '../config/database.js';
import { customers, users } from '../database/drizzle/schema.js';
import { eq, ilike, or, desc, count } from 'drizzle-orm';
import { Customer } from '../types/models.js';

export class CustomerRepository {
  static async create(tx: any, userId: string): Promise<Customer> {
    const result = await tx.insert(customers)
      .values({ user_id: parseInt(userId, 10) })
      .returning({ id: customers.id, customer_id: customers.customer_id, joined_at: customers.joined_at });
    
    return {
      ...result[0],
      id: String(result[0].id),
      user_id: userId,
      joined_at: result[0].joined_at
    } as Customer;
  }

  static async findByUserId(tx: any, userId: string): Promise<Customer | null> {
    const result = await tx.query.customers.findFirst({
      where: eq(customers.user_id, parseInt(userId, 10))
    });
    
    if (!result) return null;
    return {
      ...result,
      id: String(result.id),
      user_id: String(result.user_id)
    } as Customer;
  }

  static async findByRowId(tx: any, customerRowId: string): Promise<{ user_id: string } | null> {
    const result = await tx.query.customers.findFirst({
      where: eq(customers.id, parseInt(customerRowId, 10)),
      columns: { user_id: true }
    });
    
    if (!result) return null;
    return { user_id: String(result.user_id) };
  }

  static async findAll(tx: any, page: number = 1, limit: number = 10, search?: string): Promise<{ customers: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      const normalizedSearch = search.trim().replace(/\s+/g, ' ');
      if (normalizedSearch) {
        const q = `%${normalizedSearch}%`;
        conditions.push(
          or(
            ilike(users.name, q),
            ilike(users.email, q),
            ilike(users.phone, q),
            ilike(customers.customer_id, q)
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    // Count
    const countRes = await tx
      .select({ value: count() })
      .from(customers)
      .innerJoin(users, eq(customers.user_id, users.id))
      .where(whereClause);
      
    const total = countRes[0].value;

    // Data
    const dataRes = await tx
      .select({
        customer_row_id: customers.id,
        customer_id: customers.customer_id,
        joined_at: customers.joined_at,
        user_id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role
      })
      .from(customers)
      .innerJoin(users, eq(customers.user_id, users.id))
      .where(whereClause)
      .orderBy(desc(customers.joined_at))
      .limit(limit)
      .offset(offset);

    return { customers: dataRes, total };
  }
}
