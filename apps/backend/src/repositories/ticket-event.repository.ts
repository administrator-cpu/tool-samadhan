import { PoolClient, Pool } from 'pg';
import { TicketEvent } from '../types/models.js';

export class TicketEventRepository {
  static async insertEvent(client: PoolClient, event: Partial<TicketEvent>): Promise<TicketEvent> {
    const result = await this.insertEvents(client, [event]);
    return result[0];
  }

  static async insertEvents(client: PoolClient, events: Partial<TicketEvent>[]): Promise<TicketEvent[]> {
    if (!events || events.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const e of events) {
      placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      values.push(
        e.ticket_id,
        e.actor_user_id || null,
        e.event_type,
        e.message || null,
        e.metadata || {},
        e.visible_to_customer ?? true
      );
    }

    const query = `
      INSERT INTO ticket_events (
        ticket_id,
        actor_user_id,
        event_type,
        message,
        metadata,
        visible_to_customer
      )
      VALUES ${placeholders.join(', ')}
      RETURNING id, ticket_id, actor_user_id, event_type, message, metadata, visible_to_customer, created_at
    `;

    const result = await client.query(query, values);
    return result.rows as TicketEvent[];
  }

  static async findByTicketId(client: PoolClient, ticketId: string, visibleToCustomerOnly: boolean = false): Promise<any[]> {
    let whereClause = 'WHERE te.ticket_id = $1';
    if (visibleToCustomerOnly) {
      whereClause += ' AND te.visible_to_customer = true';
    }

    const query = `
      SELECT
        te.id,
        te.ticket_id,
        te.actor_user_id,
        u.name AS actor_name,
        te.event_type,
        te.message,
        te.metadata,
        te.visible_to_customer,
        te.created_at
      FROM ticket_events te
      LEFT JOIN users u ON u.id = te.actor_user_id
      ${whereClause}
      ORDER BY te.created_at ASC, te.id ASC
    `;

    const result = await client.query(query, [ticketId]);
    return result.rows;
  }

  static async findMissedEvents(
    pool: Pool,
    ticketId: string,
    afterEventId: string,
    limit: number
  ): Promise<{ events: any[]; hasMore: boolean }> {
    const result = await pool.query(
      `SELECT te.id, te.ticket_id, te.actor_user_id, u.name AS actor_name, 
              te.event_type, te.message, te.metadata, te.visible_to_customer, te.created_at
       FROM ticket_events te
       LEFT JOIN users u ON u.id = te.actor_user_id
       WHERE te.ticket_id = $1 AND te.id > $2
       ORDER BY te.id ASC
       LIMIT $3`,
      [ticketId, afterEventId, limit + 1]
    );

    let events = result.rows;
    const hasMore = events.length > limit;

    if (hasMore) {
      events = events.slice(0, limit);
    }

    return { events, hasMore };
  }

  static async hasAgentReplied(poolOrClient: Pool | PoolClient, ticketId: string): Promise<boolean> {
    const res = await poolOrClient.query(
      `SELECT 1 FROM ticket_events 
       WHERE ticket_id = $1 
       AND event_type IN ('AGENT_REPLY', 'ADMIN_REPLY')
       LIMIT 1`,
      [ticketId]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }
}
