import postgresPool from "../config/db.js";

export const createUserTable = async () => {

  const query = `
    -- 1. Create enum for role
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('USER', 'SUPPORT_AGENT', 'ADMIN', 'SALES');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 2. Create user table
    CREATE TABLE IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(15) NULL,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'USER',
        must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await postgresPool.query(query);
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