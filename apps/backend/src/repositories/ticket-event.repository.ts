import { db } from '../config/database.js';
import { ticketEvents, users } from '../database/drizzle/schema.js';
import { desc, sql, eq, and, gt, inArray, asc } from 'drizzle-orm';


import { TicketEvent } from '../types/models.js';

export class TicketEventRepository {
  static async insertEvent(tx: any, event: Partial<TicketEvent>): Promise<TicketEvent> {
    const result = await this.insertEvents(tx, [event]);
    return result[0];
  }

  static async insertEvents(tx: any, events: Partial<TicketEvent>[]): Promise<TicketEvent[]> {
    if (!events || events.length === 0) return [];

    const insertData = events.map(e => ({
      ticket_id: parseInt(String(e.ticket_id), 10),
      actor_user_id: e.actor_user_id ? parseInt(String(e.actor_user_id), 10) : null,
      event_type: String(e.event_type) as any,
      message: e.message || null,
      metadata: e.metadata || {},
      visible_to_customer: e.visible_to_customer ?? true
    }));

    const result = await tx.insert(ticketEvents)
      .values(insertData)
      .returning();

    return result.map((r: any) => ({
      ...r,
      id: String(r.id),
      ticket_id: String(r.ticket_id),
      actor_user_id: r.actor_user_id ? String(r.actor_user_id) : null
    })) as TicketEvent[];
  }

  static async findByTicketId(tx: any, ticketId: string, visibleToCustomerOnly: boolean = false): Promise<any[]> {
    const conditions = [eq(ticketEvents.ticket_id, parseInt(ticketId, 10))];
    if (visibleToCustomerOnly) {
      conditions.push(eq(ticketEvents.visible_to_customer, true));
    }

    const result = await tx.select({
      id: ticketEvents.id,
      ticket_id: ticketEvents.ticket_id,
      actor_user_id: ticketEvents.actor_user_id,
      actor_name: users.name,
      actor_translated_names: users.translated_names,
      event_type: ticketEvents.event_type,
      message: ticketEvents.message,
      metadata: ticketEvents.metadata,
      translations: ticketEvents.translations,
      visible_to_customer: ticketEvents.visible_to_customer,
      created_at: ticketEvents.created_at
    })
    .from(ticketEvents)
    .leftJoin(users, eq(ticketEvents.actor_user_id, users.id))
    .where(and(...conditions))
    .orderBy(asc(ticketEvents.created_at), asc(ticketEvents.id));

    return result.map((r: any) => ({
      ...r,
      id: String(r.id),
      ticket_id: String(r.ticket_id),
      actor_user_id: r.actor_user_id ? String(r.actor_user_id) : null
    }));
  }

  static async findMissedEvents( tx: any, ticketId: string, afterEventId: string, limit: number ): Promise<{ events: any[]; hasMore: boolean }> {
    const result = await tx.select({
      id: ticketEvents.id,
      ticket_id: ticketEvents.ticket_id,
      actor_user_id: ticketEvents.actor_user_id,
      actor_name: users.name,
      actor_translated_names: users.translated_names,
      event_type: ticketEvents.event_type,
      message: ticketEvents.message,
      metadata: ticketEvents.metadata,
      translations: ticketEvents.translations,
      visible_to_customer: ticketEvents.visible_to_customer,
      created_at: ticketEvents.created_at
    })
    .from(ticketEvents)
    .leftJoin(users, eq(ticketEvents.actor_user_id, users.id))
    .where(and(
      eq(ticketEvents.ticket_id, parseInt(ticketId, 10)),
      gt(ticketEvents.id, parseInt(afterEventId, 10))
    ))
    .orderBy(asc(ticketEvents.id))
    .limit(limit + 1);

    let events = result.map((r: any) => ({
      ...r,
      id: String(r.id),
      ticket_id: String(r.ticket_id),
      actor_user_id: r.actor_user_id ? String(r.actor_user_id) : null
    }));
    
    const hasMore = events.length > limit;

    if (hasMore) {
      events = events.slice(0, limit);
    }

    return { events, hasMore };
  }

  static async hasAgentReplied(tx: any, ticketId: string): Promise<boolean> {
    const res = await tx.query.ticketEvents.findFirst({
      where: and(
        eq(ticketEvents.ticket_id, parseInt(ticketId, 10)),
        inArray(ticketEvents.event_type, ['AGENT_REPLY', 'ADMIN_REPLY'])
      ),
      columns: { id: true }
    });
    return !!res;
  }

  
  static async hasAgentRepliedOnReopenedTicket( tx: any, ticketId: string ): Promise<boolean> {
  
    const lastReopen = await tx.query.ticketEvents.findFirst({
        where: and(
            eq(ticketEvents.ticket_id, Number(ticketId)),
            eq(ticketEvents.event_type, "STATUS_CHANGED"),
            sql`${ticketEvents.metadata}->>'newStatus' = 'REOPENED'`
        ),
        orderBy: [desc(ticketEvents.id)],
        columns: { id: true }
    });
    
    if (!lastReopen) return false;
    
    const reply = await tx.query.ticketEvents.findFirst({
        where: and(
            eq(ticketEvents.ticket_id, Number(ticketId)),
            gt(ticketEvents.id, lastReopen.id),
            inArray(ticketEvents.event_type, [ "AGENT_REPLY", "ADMIN_REPLY"])
        ),
        columns: { id: true }
    });
    
    return !!reply;
  }

  static async getLastReopenedEvent(tx: any, ticketId: string) {
    const lastReopen = await tx.query.ticketEvents.findFirst({
        where: and(
            eq(ticketEvents.ticket_id, Number(ticketId)),
            eq(ticketEvents.event_type, "STATUS_CHANGED"),
            sql`${ticketEvents.metadata}->>'newStatus' = 'REOPENED'`
        ),
        orderBy: [desc(ticketEvents.id)]
    });
    return lastReopen;
  }

  static async updateTranslations(tx: any, eventId: string, translations: Record<string, string>): Promise<void> {
    await tx.update(ticketEvents)
      .set({ translations })
      .where(eq(ticketEvents.id, parseInt(eventId, 10)));
  }

  static async findById(tx: any, eventId: string): Promise<any> {
    const result = await tx.select({
      id: ticketEvents.id,
      ticket_id: ticketEvents.ticket_id,
      actor_user_id: ticketEvents.actor_user_id,
      actor_name: users.name,
      actor_translated_names: users.translated_names,
      event_type: ticketEvents.event_type,
      message: ticketEvents.message,
      metadata: ticketEvents.metadata,
      translations: ticketEvents.translations,
      visible_to_customer: ticketEvents.visible_to_customer,
      created_at: ticketEvents.created_at
    })
    .from(ticketEvents)
    .leftJoin(users, eq(ticketEvents.actor_user_id, users.id))
    .where(eq(ticketEvents.id, parseInt(eventId, 10)));

    if (!result.length) return null;
    
    return {
      ...result[0],
      id: String(result[0].id),
      ticket_id: String(result[0].ticket_id),
      actor_user_id: result[0].actor_user_id ? String(result[0].actor_user_id) : null
    };
  }
}
