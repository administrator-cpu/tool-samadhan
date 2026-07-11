import { pgTable, bigint, varchar, text, boolean, timestamp, pgEnum, jsonb, serial, index, unique, uuid, pgSequence, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['USER', 'SUPPORT_AGENT', 'ADMIN', 'SALES']);
export const ticketStatusEnum = pgEnum('ticket_status', ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED']);

// Sequences
export const employeeNumberSeq = pgSequence('employee_number_seq', { startWith: 10001 });
export const customerNumberSeq = pgSequence('customer_number_seq', { startWith: 10001 });
export const ticketNumberSeq = pgSequence('ticket_number_seq', { startWith: 10001 });

// Users Table
export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 15 }),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  must_change_password: boolean('must_change_password').default(true).notNull(),
  profile_image: text('profile_image'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  roleIdx: index('idx_users_role').on(table.role)
}));

// Employees Table
export const employees = pgTable('employees', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  employee_id: varchar('employee_id', { length: 20 }).default(sql`('EMP-' || nextval('employee_number_seq'))`).notNull().unique(),
  joined_at: timestamp('joined_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Customers Table
export const customers = pgTable('customers', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  customer_id: varchar('customer_id', { length: 20 }).default(sql`('CUST-' || nextval('customer_number_seq'))`).notNull().unique(),
  joined_at: timestamp('joined_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Sessions Table
export const sessions = pgTable('sessions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token_hash: text('token_hash').notNull().unique(),
  jti: uuid('jti').notNull().unique(),
  user_agent: text('user_agent'),
  ip_address: text('ip_address'),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  revoked_at: timestamp('revoked_at', { withTimezone: true }),
  last_used_at: timestamp('last_used_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Password Reset OTPs
export const passwordResetOtps = pgTable('password_reset_otps', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  otp_code: varchar('otp_code', { length: 6 }).notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userCreatedIdx: index('idx_password_reset_user_created').on(table.user_id, table.created_at.desc())
}));

// Issue Categories
export const issueCategories = pgTable('issue_categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Employee Issue Categories
export const employeeIssueCategories = pgTable('employee_issue_categories', {
  employee_id: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  issue_category_id: bigint('issue_category_id', { mode: 'number' }).notNull().references(() => issueCategories.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
    pk: primaryKey({
      columns: [table.employee_id, table.issue_category_id],
    }),
}));

// Tickets
export const tickets = pgTable('tickets', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  ticket_no: varchar('ticket_no', { length: 20 }).default(sql`('TCK-' || nextval('ticket_number_seq'))`).notNull().unique(),
  status: ticketStatusEnum('status').default('OPEN').notNull(),
  customer_id: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  created_by_user_id: bigint('created_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  current_assigned_employee_id: bigint('current_assigned_employee_id', { mode: 'number' }).references(() => employees.id, { onDelete: 'set null' }),
  primary_issue_category_id: bigint('primary_issue_category_id', { mode: 'number' }).references(() => issueCategories.id, { onDelete: 'set null' }),
  circuit_description: text('circuit_description'),
  rca: text('rca'),
  rca_images: jsonb('rca_images').default([]),
  problem_side: varchar('problem_side', { length: 100 }),
  telco_sr_number: varchar('telco_sr_number', { length: 100 }),
  rating: integer('rating'),
  rating_feedback: text('rating_feedback'),
  alternate_email: text("alternate_email"),
  allow_customer_reply: boolean('allow_customer_reply').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  closed_at: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  customerIdIdx: index('idx_tickets_customer_id').on(table.customer_id),
  createdByIdx: index('idx_tickets_created_by').on(table.created_by_user_id),
  assignedStatusIdx: index('idx_tickets_assigned_status').on(table.current_assigned_employee_id, table.status),
  statusDatesIdx: index('idx_tickets_status_dates').on(table.status, table.updated_at, table.created_at),
  // Performance Indexes for Cursor Pagination
  cursorIdx: index('idx_tickets_cursor').on(table.created_at.desc(), table.id.desc()),
  customerStatusIdx: index('idx_tickets_customer_status').on(table.customer_id, table.status),
}));

// Ticket Events
export const ticketEvents = pgTable('ticket_events', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  ticket_id: bigint('ticket_id', { mode: 'number' }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  actor_user_id: bigint('actor_user_id', { mode: 'number' }),
  event_type: varchar('event_type', { length: 255 }).notNull(),
  message: text('message'),
  metadata: jsonb('metadata').default({}).notNull(),
  visible_to_customer: boolean('visible_to_customer').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  ticketCreatedIdx: index('idx_ticket_events_ticket_created').on(table.ticket_id, table.created_at)
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, { fields: [users.id], references: [employees.user_id] }),
  customer: one(customers, { fields: [users.id], references: [customers.user_id] }),
  sessions: many(sessions),
  ticketsCreated: many(tickets, { relationName: 'createdBy' })
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.user_id], references: [users.id] }),
  ticketsAssigned: many(tickets, { relationName: 'assignedTo' }),
  categories: many(employeeIssueCategories)
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.user_id], references: [users.id] }),
  tickets: many(tickets)
}));

export const issueCategoriesRelations = relations(issueCategories, ({ many }) => ({
  employees: many(employeeIssueCategories),
  tickets: many(tickets)
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(customers, { fields: [tickets.customer_id], references: [customers.id] }),
  createdBy: one(users, { fields: [tickets.created_by_user_id], references: [users.id], relationName: 'createdBy' }),
  assignedEmployee: one(employees, { fields: [tickets.current_assigned_employee_id], references: [employees.id], relationName: 'assignedTo' }),
  category: one(issueCategories, { fields: [tickets.primary_issue_category_id], references: [issueCategories.id] }),
  events: many(ticketEvents)
}));

export const ticketEventsRelations = relations(ticketEvents, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketEvents.ticket_id], references: [tickets.id] }),
  actor: one(users, { fields: [ticketEvents.actor_user_id], references: [users.id] })
}));

// Automated Email Logs
export const automatedEmailLogs = pgTable('automated_email_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  ticket_id: bigint('ticket_id', { mode: 'number' }).notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  email_type: varchar('email_type', { length: 50 }).notNull(),
  sent_at: timestamp('sent_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  ticketTypeIdx: index('idx_automated_email_logs_ticket_type').on(table.ticket_id, table.email_type)
}));
