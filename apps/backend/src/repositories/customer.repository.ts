import { PoolClient, Pool } from 'pg';
import { Customer } from '../types/models.js';

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

  static async findAll(pool: Pool, page: number = 1, limit: number = 10, search?: string): Promise<{ customers: any[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];
    
    if (search) {
      const normalizedSearch = search.trim().replace(/\s+/g, ' ');
      if (normalizedSearch) {
        whereClause = `
          WHERE u.name ILIKE $1 
             OR u.email ILIKE $1 
             OR u.phone ILIKE $1 
             OR c.customer_id ILIKE $1
        `;
        queryParams.push(`%${normalizedSearch}%`);
      }
    }

    const countQuery = `
      SELECT COUNT(*) FROM customers c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQueryParams = [...queryParams, limit, offset];
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
       ${whereClause}
       ORDER BY c.joined_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      dataQueryParams
    );

    return { customers: result.rows, total };
  }
}
