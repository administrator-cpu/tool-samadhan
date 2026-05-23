import { PoolClient } from 'pg';
import { User } from '../types/models.js';
import { UserRole } from '../types/enums.js';
// from '../types/models.js';

export class UserRepository {
  static async findByEmail(client: PoolClient, email: string): Promise<User | null> {
    const result = await client.query(
      `SELECT 
        u.id, u.name, u.email, u.password, u.role, u.phone,
        u.must_change_password
       FROM users u
       WHERE u.email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as User) : null;
  }

  static async findById(client: PoolClient, userId: string): Promise<User | null> {
    const result = await client.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.phone,
        u.must_change_password, u.created_at, u.updated_at
       FROM users u
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as User) : null;
  }

  static async create(client: PoolClient, data: Partial<User>): Promise<User> {
    const { name, email, password, role, phone } = data;
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone`,
      [name, email?.toLowerCase(), password, role, phone || null]
    );
    return result.rows[0] as User;
  }

  static async update(client: PoolClient, userId: string, data: Partial<User>): Promise<User | null> {
    const { name, email, phone } = data;
    const result = await client.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, role, phone`,
      [name, email?.toLowerCase(), phone, userId]
    );
    return result.rowCount && result.rowCount > 0 ? (result.rows[0] as User) : null;
  }

  static async updatePassword(client: PoolClient, userId: string, passwordHash: string): Promise<void> {
    await client.query(
      `UPDATE users
       SET password = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  static async clearMustChangePassword(client: PoolClient, userId: string): Promise<void> {
    await client.query(
      `UPDATE users
       SET must_change_password = FALSE
       WHERE id = $1`,
      [userId]
    );
  }

  static async deleteById(client: PoolClient, userId: string): Promise<void> {
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }
}
