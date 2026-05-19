import postgresPool from "../config/db.js";

export const createUserTable = async () => {
  const query = `
    -- 1. Create enum for role
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('USER', 'SUPPORT_AGENT', 'MANAGER', 'ADMIN');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 2. Create user table
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'USER',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await postgresPool.query(query);

  // 3. Add phone column if it doesn't exist
  await postgresPool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
  `);
};

export const createEmployeeTable = async () => {
  const query = `
    -- 1. Create sequence for employee number
    CREATE SEQUENCE IF NOT EXISTS employee_number_seq START 10001;

    -- 2. Create employees table
    CREATE TABLE IF NOT EXISTS employees (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        employee_id VARCHAR(20) UNIQUE NOT NULL DEFAULT ('EMP-' || nextval('employee_number_seq')),
        must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_employees_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
  `;
  await postgresPool.query(query);
};

export const createCustomerTable = async () => {
  const query = `
    -- 1. Create sequence for customer number
    CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 10001;

    -- 2. Create customers table
    CREATE TABLE IF NOT EXISTS customers (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,
        customer_id VARCHAR(20) UNIQUE NOT NULL DEFAULT ('CUST-' || nextval('customer_number_seq')),
        joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_customers_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
  `;
  await postgresPool.query(query);
};

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
            'ON_HOLD',
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
        created_by_user_id BIGINT NOT NULL,
        current_assigned_employee_id BIGINT NULL,
        primary_issue_category_id BIGINT NULL,

        status ticket_status NOT NULL DEFAULT 'OPEN',

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMPTZ NULL,
        closed_at TIMESTAMPTZ NULL,
        circuit_description TEXT NULL,
        rca TEXT NULL,
        problem_side VARCHAR(100) NULL,
        external_ticket_no VARCHAR(100) NULL,

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
            ON DELETE RESTRICT,

        CONSTRAINT fk_tickets_primary_issue_category
            FOREIGN KEY (primary_issue_category_id)
            REFERENCES issue_categories(id)
            ON DELETE SET NULL
    );
    
    -- 5. Add circuit_description column if it doesn't exist (for existing tables)
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='circuit_description') THEN
            ALTER TABLE tickets ADD COLUMN circuit_description TEXT NULL;
        END IF;
    END $$;

    -- 6. Add problem_side column if it doesn't exist (for existing tables)
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='problem_side') THEN
            ALTER TABLE tickets ADD COLUMN problem_side VARCHAR(100) NULL;
        END IF;
    END $$;

    -- 7. Add external_ticket_no column if it doesn't exist (for existing tables)
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='external_ticket_no') THEN
            ALTER TABLE tickets ADD COLUMN external_ticket_no VARCHAR(100) NULL;
        END IF;
    END $$;

    -- 8. Add rating and rating_feedback columns if they don't exist
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='rating') THEN
            ALTER TABLE tickets ADD COLUMN rating INTEGER NULL;
        END IF;
    END $$;

    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='rating_feedback') THEN
            ALTER TABLE tickets ADD COLUMN rating_feedback TEXT NULL;
        END IF;
    END $$;
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
  `;
  await postgresPool.query(query);
};

export const createSessionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sessions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        jti UUID NOT NULL UNIQUE,
        user_agent TEXT NULL,
        ip_address TEXT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        revoked_at TIMESTAMPTZ NULL,
        last_used_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_sessions_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );
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
      ('OTHERS', 'Others')
    ON CONFLICT (code) DO NOTHING;
  `;
  await postgresPool.query(query);
};

export const passwordResetOtps = async () => {
  const query = `
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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

export const createDatabaseTables = async () => {
  await createUserTable();
  await createEmployeeTable();
  await createCustomerTable();
  await createIssueCategoryTable();
  await createEmployeeIssueCategoryTable();
  await createTicketTable();
  await createTicketEventTable();
  await createSessionTable();
  await seedDefaultIssueCategories();
  await passwordResetOtps();
  await createAutomatedEmailLogTable();
}