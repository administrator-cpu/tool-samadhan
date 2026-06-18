import { db } from '../config/database.js';
import { tickets, customers, users, issueCategories, employees, ticketEvents } from '../database/drizzle/schema.js';
import { eq, and, or, inArray, isNull, isNotNull, ilike, lt, gt, desc, asc, SQL, sql } from 'drizzle-orm';
import { Ticket } from '../types/models.js';
import { TicketStatus } from '../types/enums.js';

export class TicketRepository {
  private static cachedEarliestYear: number | null = null;

  static async create(
    tx: any,
    data: {
      customerId: string;
      createdByUserId: string | null;
      assignedEmployeeId: string | null;
      issueCategoryId: string;
      circuitDescription: string;
      alternateEmail?: string;
    }
  ): Promise<Ticket> {
    const result = await tx.insert(tickets).values({
      customer_id: parseInt(data.customerId, 10),
      created_by_user_id: data.createdByUserId ? parseInt(data.createdByUserId, 10) : null,
      current_assigned_employee_id: data.assignedEmployeeId ? parseInt(data.assignedEmployeeId, 10) : null,
      primary_issue_category_id: parseInt(data.issueCategoryId, 10),
      status: 'OPEN',
      circuit_description: data.circuitDescription,
      alternate_email: data.alternateEmail || null,
    }).returning();

    return { ...result[0], id: String(result[0].id) } as any;
  }

  static async findActiveTicketByCircuit(tx: any, circuit: string): Promise<Ticket | null> {
    const result = await tx.query.tickets.findFirst({
      where: and(
        sql`UPPER(${tickets.circuit_description}) = UPPER(${circuit})`,
        inArray(tickets.status, ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'])
      ),
      columns: { id: true, ticket_no: true, status: true, circuit_description: true }
    });
    return result ? ({ ...result, id: String(result.id) } as any) : null;
  }

  static async findByIdForUpdate(tx: any, ticketId: string): Promise<Ticket | null> {
    // Drizzle doesn't have a built-in cross-dialect `FOR UPDATE` in `query` builder yet in older versions, 
    // so we use execute sql`... FOR UPDATE`
    const result = await tx.execute(sql`
       SELECT id, customer_id, created_by_user_id, current_assigned_employee_id, status, allow_customer_reply, resolved_at, closed_at, rca, rca_images, problem_side, telco_sr_number, alternate_email
       FROM tickets
       WHERE id = ${parseInt(ticketId, 10)}
       FOR UPDATE
    `);
    return result.rowCount && result.rowCount > 0 ? ({ ...result.rows[0], id: String(result.rows[0].id) } as any) : null;
  }

  static async findById(tx: any, ticketId: string): Promise<Ticket | null> {
    const result = await tx.query.tickets.findFirst({
      where: eq(tickets.id, parseInt(ticketId, 10)),
    });
    return result ? ({ ...result, id: String(result.id) } as any) : null;
  }

  static async getCustomerContactInfo(tx: any, ticketId: string) {
    const result = await tx.execute(sql`
      SELECT u.name, u.email, t.ticket_no, c.customer_id, ic.name as category, te.message, t.circuit_description, t.alternate_email
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users u ON u.id = c.user_id
      JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN ticket_events te ON te.ticket_id = t.id AND te.event_type = 'TICKET_CREATED'
      WHERE t.id = ${parseInt(ticketId, 10)}
    `);
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  }

  static async updateStatus(
    tx: any,
    ticketId: string,
    status: TicketStatus | string,
    additionalFields: string[] = []
  ): Promise<Ticket> {
    const updates: any = { status, updated_at: sql`NOW()` };
    if (status === 'RESOLVED') {
      updates.resolved_at = sql`NOW()`;
      updates.allow_customer_reply = false;
    } else if (status === 'CLOSED') {
      updates.closed_at = sql`NOW()`;
      updates.allow_customer_reply = false;
    }

    for (const field of additionalFields) {
      const match = field.match(/(\w+)\s*=\s*(.+)/);
      if (match) {
         updates[match[1]] = sql.raw(match[2]);
      }
    }

    const result = await tx.update(tickets)
      .set(updates)
      .where(eq(tickets.id, parseInt(ticketId, 10)))
      .returning({
        id: tickets.id, status: tickets.status, resolved_at: tickets.resolved_at, closed_at: tickets.closed_at, updated_at: tickets.updated_at, allow_customer_reply: tickets.allow_customer_reply, rca: tickets.rca, rca_images: tickets.rca_images, ticket_no: tickets.ticket_no, customer_id: tickets.customer_id, circuit_description: tickets.circuit_description
      });
      
    return { ...result[0], id: String(result[0].id) } as any;
  }

  static async updateFields(
    tx: any,
    ticketId: string,
    updates: Partial<Ticket>
  ): Promise<Ticket> {
    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    const data: any = { ...updates, updated_at: sql`NOW()` };

    const result = await tx.update(tickets)
      .set(data)
      .where(eq(tickets.id, parseInt(ticketId, 10)))
      .returning();

    return { ...result[0], id: String(result[0].id) } as any;
  }

  static async bulkCloseExpiredResolvedTickets(tx: any): Promise<Ticket[]> {
    const result = await tx.execute(sql`
      UPDATE tickets 
      SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW(), allow_customer_reply = FALSE 
      WHERE status = 'RESOLVED' AND resolved_at < NOW() - INTERVAL '24 hours' AND rca IS NOT NULL AND TRIM(rca) <> ''
      RETURNING *
    `);
    
    return result.rows.map((r: any) => ({ ...r, id: String(r.id) }));
  }

  static async findTicketTimelineInfo(tx: any, ticketId: string) {
    const t = await tx.query.tickets.findFirst({
      where: eq(tickets.id, parseInt(ticketId, 10)),
      with: {
        customer: {
          with: { user: true }
        },
        category: true,
        assignedEmployee: {
          with: { user: true }
        }
      }
    });

    if (!t) return null;

    return {
      id: String(t.id),
      ticket_no: t.ticket_no,
      status: t.status,
      created_by_user_id: t.created_by_user_id ? String(t.created_by_user_id) : null,
      subject: t.category?.name || null,
      created_at: t.created_at,
      updated_at: t.updated_at,
      resolved_at: t.resolved_at,
      closed_at: t.closed_at,
      customer_row_id: String(t.customer?.id),
      customer_id: t.customer?.customer_id,
      customer_name: t.customer?.user?.name,
      customer_email: t.customer?.user?.email,
      customer_phone: t.customer?.user?.phone,
      current_assigned_employee_id: t.current_assigned_employee_id ? String(t.current_assigned_employee_id) : null,
      assigned_employee_name: t.assignedEmployee?.user?.name || null,
      assigned_employee_profile_image: t.assignedEmployee?.user?.profile_image || null,
      circuit_description: t.circuit_description,
      rca: t.rca,
      rca_images: t.rca_images,
      problem_side: t.problem_side,
      telco_sr_number: t.telco_sr_number,
      rating: t.rating,
      rating_feedback: t.rating_feedback,
      alternate_email: t.alternate_email,
      allow_customer_reply: t.allow_customer_reply,
    };
  }

  static async checkCustomerOwnership(tx: any, customerRowId: string, userId: string): Promise<boolean> {
    const res = await tx.query.customers.findFirst({
      where: and(
        eq(customers.id, parseInt(customerRowId, 10)),
        eq(customers.user_id, parseInt(userId, 10))
      ),
      columns: { id: true }
    });
    return !!res;
  }

  static async findUserTickets(
    tx: any, 
    filters: {
      customerId?: string;
      employeeId?: string;
      salesUserId?: string;
      ownership?: string;
      statusGroup?: string;
      status?: string;
      searchQuery?: string;
      sortField?: string;
      sortOrder?: string;
    },
    limit: number,
    cursor?: string // Cursor is expected to be a string like "timestamp_id"
  ) {
    const whereConditions: SQL[] = [];

    // Role filters
    if (filters.customerId) {
      whereConditions.push(eq(tickets.customer_id, parseInt(filters.customerId, 10)));
    } else if (filters.employeeId) {
      whereConditions.push(eq(tickets.current_assigned_employee_id, parseInt(filters.employeeId, 10)));
    } else if (filters.salesUserId) {
      whereConditions.push(eq(tickets.created_by_user_id, parseInt(filters.salesUserId, 10)));
    }

    // Ownership filter
    if (filters.ownership === 'ASSIGNED') {
      whereConditions.push(isNotNull(tickets.current_assigned_employee_id));
    } else if (filters.ownership === 'UNASSIGNED') {
      whereConditions.push(isNull(tickets.current_assigned_employee_id));
    }

    // Status filter
    if (filters.status) {
      whereConditions.push(eq(tickets.status, filters.status as any));
    } else if (filters.statusGroup === 'ACTIVE') {
      whereConditions.push(inArray(tickets.status, ['OPEN', 'IN_PROGRESS', 'ESCALATED']));
    }

    // Search query
    if (filters.searchQuery) {
      let q = filters.searchQuery.trim();
      if (/^\d+$/.test(q)) {
        q = `TCK-${q}`;
      }
      whereConditions.push(ilike(tickets.ticket_no, `%${q}%`));
    }

    // Default sorting logic
    let sortField: any = tickets.created_at;
    if (filters.sortField === 'status') sortField = tickets.status;
    else if (filters.sortField === 'ticket_no') sortField = tickets.ticket_no;
    else if (filters.sortField === 'updated_at') sortField = tickets.updated_at;
    
    const isAsc = filters.sortOrder?.toUpperCase() === 'ASC';
    
    // Keyset pagination (Cursor logic)
    if (cursor) {
      const [cursorValStr, cursorIdStr] = cursor.split('_');
      const cursorId = parseInt(cursorIdStr, 10);
      
      // Determine cursor value type based on sortField
      let cursorVal: any = cursorValStr;
      if (sortField === tickets.created_at || sortField === tickets.updated_at) {
        cursorVal = new Date(parseInt(cursorValStr, 10));
      }

      if (isAsc) {
        whereConditions.push(
          or(
            gt(sortField, cursorVal),
            and(eq(sortField, cursorVal), gt(tickets.id, cursorId))
          )!
        );
      } else {
        whereConditions.push(
          or(
            lt(sortField, cursorVal),
            and(eq(sortField, cursorVal), lt(tickets.id, cursorId))
          )!
        );
      }
    }

    const orderBy = [
      isAsc ? asc(sortField) : desc(sortField),
      isAsc ? asc(tickets.id) : desc(tickets.id) // Tie-breaker
    ];

    const dataResult = await tx.query.tickets.findMany({
      where: and(...whereConditions),
      orderBy,
      limit,
      with: {
        category: { columns: { name: true } },
        customer: {
          with: { user: { columns: { name: true } } }
        },
        assignedEmployee: {
          with: { user: { columns: { name: true } } }
        }
      }
    });

    const mappedTickets = dataResult.map((t: any) => ({
      id: String(t.id),
      ticket_no: t.ticket_no,
      subject: t.category?.name || null,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      circuit_description: t.circuit_description,
      customer_name: t.customer?.user?.name || null,
      assigned_employee_name: t.assignedEmployee?.user?.name || null,
      current_assigned_employee_id: t.current_assigned_employee_id ? String(t.current_assigned_employee_id) : null,
    }));

    let nextCursor: string | null = null;
    if (dataResult.length === limit) {
      const lastItem = dataResult[dataResult.length - 1];
      const lastSortVal = lastItem[filters.sortField as keyof typeof lastItem] ?? lastItem.created_at;
      
      let cursorValStr = String(lastSortVal);
      if (lastSortVal instanceof Date) {
        cursorValStr = String(lastSortVal.getTime());
      }
      
      nextCursor = `${cursorValStr}_${lastItem.id}`;
    }

    return {
      tickets: mappedTickets,
      nextCursor,
    };
  }

  static async getEarliestTicketYear(tx: any): Promise<number> {
    if (this.cachedEarliestYear !== null) {
      return this.cachedEarliestYear;
    }
    const res = await tx.execute(sql`SELECT EXTRACT(YEAR FROM MIN(created_at)) as year FROM tickets`);
    this.cachedEarliestYear = res.rows[0]?.year ? parseInt(String(res.rows[0].year), 10) : new Date().getFullYear();
    return this.cachedEarliestYear;
  }

  static async findResolvedTickets(
    tx: any,
    limit: number,
    offset: number,
    exportAll: boolean,
    year?: number,
    month?: number
  ) {
    let whereSql = sql`t.status IN ('RESOLVED', 'CLOSED')`;

    if (year) {
      whereSql = sql`${whereSql} AND EXTRACT(YEAR FROM COALESCE(t.resolved_at, t.closed_at, t.updated_at)) = ${year}`;
    }
    if (month) {
      whereSql = sql`${whereSql} AND EXTRACT(MONTH FROM COALESCE(t.resolved_at, t.closed_at, t.updated_at)) = ${month}`;
    }

    let total = 0;
    if (!exportAll) {
      const countResult = await tx.execute(sql`
        SELECT COUNT(*) as count FROM tickets t WHERE ${whereSql}
      `);
      total = parseInt(String(countResult.rows[0].count), 10);
    }

    let queryStr = sql`
      SELECT
        t.id,
        t.ticket_no,
        ic.name AS category_name,
        t.status,
        t.rca,
        t.rca_images,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        t.closed_at,
        t.circuit_description,
        c.customer_id,
        cu.name AS customer_name,
        eu.name AS assigned_agent_name
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      JOIN users cu ON cu.id = c.user_id
      LEFT JOIN issue_categories ic ON ic.id = t.primary_issue_category_id
      LEFT JOIN employees e ON e.id = t.current_assigned_employee_id
      LEFT JOIN users eu ON eu.id = e.user_id
      WHERE ${whereSql}
      ORDER BY COALESCE(t.resolved_at, t.closed_at) DESC, t.created_at DESC
    `;

    if (!exportAll) {
      queryStr = sql`${queryStr} LIMIT ${limit} OFFSET ${offset}`;
    }

    const dataResult = await tx.execute(queryStr);

    return {
      tickets: dataResult.rows.map((r: any) => ({ ...r, id: String(r.id) })),
      total: exportAll ? dataResult.rows.length : total,
    };
  }
}
