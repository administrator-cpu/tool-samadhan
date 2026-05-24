import { PoolClient, Pool } from 'pg';
import { Customer } from '../types/models.js';
import { PaginatedResponse } from '../types/dto.js';

export class CustomerRepository {
  static async create(client: PoolClient, userId: string): Promise<Customer> {
    const result = await client.query(
      `INSERT INTO customers (user_id)
       VALUES ($1)
       RETURNING id, customer_id, joined_at`,
      [userId]
    );
    return result.rows[0] as Customer;
  }

  static async findByUserId(client: PoolClient, userId: string): Promise<Customer | null> {
    const result = await client.query(
      `SELECT id, customer_id, user_id, joined_at
       FROM customers
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as Customer) : null;
  }

  static async findByRowId(client: PoolClient, customerRowId: string): Promise<{ user_id: string } | null> {
    const result = await client.query(
      `SELECT user_id FROM customers WHERE id = $1 LIMIT 1`,
      [customerRowId]
    );
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async findAll(pool: Pool, page: number = 1, limit: number = 10): Promise<{ customers: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM customers`);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT 
        c.id as customer_row_id,
        c.customer_id,
        c.joined_at,
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.role
       FROM customers c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.joined_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { customers: result.rows, total };
  }
}
