import { postgresPool } from '../../config/database.js';

export const createIssueCategoryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS issue_categories (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await postgresPool.query(query);
};

export const createEmployeeIssueCategoryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employee_issue_categories (
        employee_id BIGINT NOT NULL,
        issue_category_id BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
        PRIMARY KEY (employee_id, issue_category_id),
 
        CONSTRAINT fk_employee_issue_categories_employee
            FOREIGN KEY (employee_id)
            REFERENCES employees(id)
            ON DELETE CASCADE,
 
        CONSTRAINT fk_employee_issue_categories_issue_category
            FOREIGN KEY (issue_category_id)
            REFERENCES issue_categories(id)
            ON DELETE CASCADE
    );
  `;
  await postgresPool.query(query);
};

export const createTicketTable = async () => {
  const query = `
    DO $$ BEGIN
        CREATE TYPE ticket_status AS ENUM (
            'OPEN',
            'IN_PROGRESS',
            'ESCALATED',
            'RESOLVED',
            'CLOSED'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 3. Create sequence for ticket number
    CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 10001;

    -- 4. Create tickets table
    CREATE TABLE IF NOT EXISTS tickets (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ticket_no VARCHAR(20) UNIQUE NOT NULL DEFAULT ('TCK-' || nextval('ticket_number_seq')),
        customer_id BIGINT NOT NULL,
        created_by_user_id BIGINT NULL,
        current_assigned_employee_id BIGINT NULL,
        primary_issue_category_id BIGINT NULL,
 
        status ticket_status NOT NULL DEFAULT 'OPEN',
 
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMPTZ NULL,
        closed_at TIMESTAMPTZ NULL,
 
        circuit_description TEXT NULL,
 
        problem_side VARCHAR(100) NULL,
        external_ticket_no VARCHAR(100) NULL,
        alternate_email VARCHAR(255) NULL,
 
        rca TEXT NULL,
        rating INTEGER NULL,
        rating_feedback TEXT NULL,
 
        allow_customer_reply BOOLEAN NOT NULL DEFAULT FALSE,
 
        CONSTRAINT fk_tickets_customer
            FOREIGN KEY (customer_id)
            REFERENCES customers(id)
            ON DELETE CASCADE,
 
        CONSTRAINT fk_tickets_assigned_employee
            FOREIGN KEY (current_assigned_employee_id)
            REFERENCES employees(id)
            ON DELETE SET NULL,
 
        CONSTRAINT fk_tickets_created_by
            FOREIGN KEY (created_by_user_id)
            REFERENCES users(id)
            ON DELETE SET NULL,
 
        CONSTRAINT fk_tickets_primary_issue_category
            FOREIGN KEY (primary_issue_category_id)
            REFERENCES issue_categories(id)
            ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON tickets(current_assigned_employee_id, status);
    CREATE INDEX IF NOT EXISTS idx_tickets_status_dates ON tickets(status, updated_at, created_at);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS alternate_email VARCHAR(255) NULL;
  `;
  await postgresPool.query(query);
};

export const createTicketEventTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ticket_events (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ticket_id BIGINT NOT NULL,
        actor_user_id BIGINT NULL,
        event_type VARCHAR(255) NOT NULL,
        message TEXT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        visible_to_customer BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
        CONSTRAINT fk_ticket_events_ticket
            FOREIGN KEY (ticket_id)
            REFERENCES tickets(id)
            ON DELETE CASCADE,
 
        CONSTRAINT fk_ticket_events_actor
            FOREIGN KEY (actor_user_id)
            REFERENCES users(id)
            ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_created ON ticket_events(ticket_id, created_at);
  `;
  await postgresPool.query(query);
};

export const seedDefaultIssueCategories = async () => {
  const query = `
    INSERT INTO issue_categories (code, name) VALUES
      ('LINK_DOWN', 'Link Down'),
      ('PACKET_DROPS', 'Packet Drops'),
      ('LATENCY_VERY_HIGH', 'Latency Very High'),
      ('LINK_FLUCTUATING', 'Link Fluctuating'),
      ('BTS_ACCESS', 'BTS Access'),
      ('SLOW_BROWSING', 'Slow Browsing'),
      ('WEBSITE_RELATED_ISSUE', 'Website Related Issue'),
      ('IP_RELATED', 'IP Related'),
      ('OTHERS', 'Others'),
      ('BGP_ISSUE', 'BGP Issue'),
      ('HARDWARE_CONFIGURATION', 'Hardware configuration')
    ON CONFLICT (code) DO NOTHING;
  `;
  await postgresPool.query(query);
};

export const createAutomatedEmailLogTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS automated_email_logs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ticket_id BIGINT NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
        CONSTRAINT fk_email_logs_ticket
            FOREIGN KEY (ticket_id)
            REFERENCES tickets(id)
            ON DELETE CASCADE
    );
 
    CREATE INDEX IF NOT EXISTS idx_automated_email_logs_ticket_type 
    ON automated_email_logs(ticket_id, email_type);
  `;
  await postgresPool.query(query);
};
