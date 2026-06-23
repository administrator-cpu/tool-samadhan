import { db } from '../config/database.js';
import { users } from '../database/drizzle/schema.js';
import { eq, sql } from 'drizzle-orm';
import { User } from '../types/models.js';

export class UserRepository {
  static async findByEmail(tx: any, email: string): Promise<User | null> {
    const result = await tx.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });
    return result ? ({ ...result, id: String(result.id) } as any) : null;
  }

  static async findById(tx: any, userId: string): Promise<User | null> {
    const result = await tx.query.users.findFirst({
      where: eq(users.id, parseInt(userId, 10))
    });
    return result ? ({ ...result, id: String(result.id) } as any) : null;
  }

  static async create(tx: any, data: Partial<User>): Promise<User> {
    const { name, email, password, role, phone } = data;
    const result = await tx.insert(users).values({
      name: name!,
      email: email?.toLowerCase() || '',
      password: password!,
      role: role as any,
      phone: phone || null
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone });
    
    return { ...result[0], id: String(result[0].id) } as any;
  }

  static async update(tx: any, userId: string, data: Partial<User>): Promise<User | null> {
    const { name, email, phone, profile_image } = data;
    const updates: any = { updated_at: sql`NOW()` };
    
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (profile_image !== undefined) updates.profile_image = profile_image;

    const result = await tx.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(userId, 10)))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, profile_image: users.profile_image });

    return result.length ? ({ ...result[0], id: String(result[0].id) } as any) : null;
  }

  static async updatePassword(tx: any, userId: string, passwordHash: string): Promise<void> {
    await tx.update(users)
      .set({ password: passwordHash, updated_at: sql`NOW()` })
      .where(eq(users.id, parseInt(userId, 10)));
  }

  static async clearMustChangePassword(tx: any, userId: string): Promise<void> {
    await tx.update(users)
      .set({ must_change_password: false })
      .where(eq(users.id, parseInt(userId, 10)));
  }

  static async deleteById(tx: any, userId: string): Promise<void> {
    await tx.delete(users).where(eq(users.id, parseInt(userId, 10)));
  }
}
