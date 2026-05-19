import argon2 from "argon2";
import postgresPool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { sendStaffWelcomeEmail } from "../utils/emailService.js";
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from "./jwt.js";

const buildAuthPayload = (user) => ({
  userId: user.id,
  role: user.role,
  email: user.email,
});

const createSession = async (client, user, { userAgent, ipAddress }) => {
  const accessToken = signAccessToken(buildAuthPayload(user));
  const { token: refreshToken, jti, expiresAt } = signRefreshToken(
    buildAuthPayload(user),
  );
  const tokenHash = hashToken(refreshToken);

  await client.query(
    `INSERT INTO sessions (
      user_id,
      token_hash,
      jti,
      user_agent,
      ip_address,
      expires_at,
      last_used_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [user.id, tokenHash, jti, userAgent || null, ipAddress || null, expiresAt],
  );

  return { accessToken, refreshToken };
};

export const updatePassword = async ({ userId, newPassword }) => {
  const passwordHash = await argon2.hash(newPassword);

  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");

    // Update password on user table
    await client.query(
      `UPDATE users
       SET password = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId],
    );

    // Clear must_change_password on employee table (if exists)
    await client.query(
      `UPDATE employees
       SET must_change_password = FALSE
       WHERE user_id = $1`,
      [userId],
    );

    // Clear must_change_password on customer table (if exists)
    await client.query(
      `UPDATE customers
       SET must_change_password = FALSE
       WHERE user_id = $1`,
      [userId],
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const registerCustomer = async ({ name, email, password, userAgent, ipAddress }) => {
  const client = await postgresPool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existingUser.rowCount > 0) {
      throw new AppError(409, "Email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await argon2.hash(password);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'USER')
       RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO customers (user_id)
       VALUES ($1)`,
      [user.id],
    );

    const session = await createSession(client, user, {
      userAgent,
      ipAddress,
    });

    await client.query("COMMIT");

    return {
      user,
      ...session,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const createCustomer = async ({ name, email, password, phone }) => {
  const client = await postgresPool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existingUser.rowCount > 0) {
      throw new AppError(409, "Email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await argon2.hash(password);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, 'USER', $4)
       RETURNING id, name, email, role, phone`,
      [name, email, passwordHash, phone || null],
    );

    const user = userResult.rows[0];

    const customerResult = await client.query(
      `INSERT INTO customers (user_id, must_change_password)
       VALUES ($1, TRUE)
       RETURNING id, customer_id, joined_at`,
      [user.id],
    );
    const customer = customerResult.rows[0];

    await client.query("COMMIT");

    // Send welcome email asynchronously
    const { sendCustomerWelcomeEmail } = await import("../utils/emailService.js");
    sendCustomerWelcomeEmail({
      name: user.name,
      email: user.email,
      password: password,
    }).catch(err => console.error("Failed to send welcome email:", err));

    return {
      user,
      customer,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const createEmployee = async ({ name, email, password, role, issueCategoryNames = [] }) => {
  const allowedRoles = ["SUPPORT_AGENT", "MANAGER", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    throw new AppError(400, "Invalid employee role", "INVALID_ROLE");
  }

  const client = await postgresPool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existingUser.rowCount > 0) {
      throw new AppError(409, "Email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await argon2.hash(password);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role],
    );

    const user = userResult.rows[0];

    const employeeResult = await client.query(
      `INSERT INTO employees (user_id)
       VALUES ($1)
       RETURNING id, employee_id, joined_at`,
      [user.id],
    );

    const employee = employeeResult.rows[0];

    // Handle issue categories by name in bulk
    if (issueCategoryNames && issueCategoryNames.length > 0) {
      await client.query(
        `INSERT INTO employee_issue_categories (employee_id, issue_category_id)
         SELECT $1, id FROM issue_categories WHERE name = ANY($2)`,
        [employee.id, issueCategoryNames]
      );
    }

    await client.query("COMMIT");

    // Send welcome email asynchronously
    sendStaffWelcomeEmail({
      name: user.name,
      email: user.email,
      password: password, // Use the raw password generated on frontend/backend
      role: user.role,
    });

    return {
      user,
      employee,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const listAllEmployees = async () => {
  const result = await postgresPool.query(`
    SELECT 
      e.id as employee_row_id,
      e.employee_id,
      e.joined_at,
      u.id as user_id,
      u.name,
      u.email,
      u.role,
      COALESCE(
        json_agg(
          json_build_object('id', ic.id, 'name', ic.name)
        ) FILTER (WHERE ic.id IS NOT NULL),
        '[]'
      ) as categories
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN employee_issue_categories eic ON e.id = eic.employee_id
    LEFT JOIN issue_categories ic ON eic.issue_category_id = ic.id
    GROUP BY e.id, u.id
    ORDER BY e.joined_at DESC
  `);
  return result.rows;
};

export const listAllCustomers = async ({ page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;

  // 1. Get total count
  const countResult = await postgresPool.query(`SELECT COUNT(*) FROM customers`);
  const total = parseInt(countResult.rows[0].count, 10);

  // 2. Get paginated results
  const result = await postgresPool.query(`
    SELECT 
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
    ORDER BY c.joined_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return {
    customers: result.rows,
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / limit)
  };
};

export const deleteCustomer = async (customerRowId) => {
  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");

    const customerRes = await client.query(
      "SELECT user_id FROM customers WHERE id = $1",
      [customerRowId]
    );

    if (customerRes.rowCount === 0) {
      throw new AppError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
    }

    const userId = customerRes.rows[0].user_id;

    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    await client.query("COMMIT");
    return { userId, customerRowId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const listAllAgents = async () => {
  const result = await postgresPool.query(`
    SELECT e.id, u.name, u.email
    FROM employees e
    JOIN users u ON u.id = e.user_id
    WHERE u.role = 'SUPPORT_AGENT'
    ORDER BY u.name ASC
  `);
  return result.rows;
};

export const deleteEmployee = async (employeeRowId) => {
  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");

    // 1. Find the user_id associated with this employee
    const employeeRes = await client.query(
      "SELECT user_id FROM employees WHERE id = $1",
      [employeeRowId]
    );

    if (employeeRes.rowCount === 0) {
      throw new AppError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
    }

    const userId = employeeRes.rows[0].user_id;

    // 2. Delete the user (this will cascade to employees due to ON DELETE CASCADE)
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    await client.query("COMMIT");
    return { userId, employeeRowId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async ({ email, password, userAgent, ipAddress }) => {
  const client = await postgresPool.connect();

  try {
    const result = await client.query(
      `SELECT 
        u.id, u.name, u.email, u.password, u.role,
        COALESCE(e.must_change_password, c.must_change_password, FALSE) as must_change_password
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.email = $1
       LIMIT 1`,
      [email],
    );

    if (result.rowCount === 0) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const user = result.rows[0];
    const ok = await argon2.verify(user.password, password);

    if (!ok) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const session = await createSession(client, user, {
      userAgent,
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: user.must_change_password,
      },
      ...session,
    };
  } finally {
    client.release();
  }
};

export const refreshSession = async ({ refreshToken, userAgent, ipAddress }) => {
  const client = await postgresPool.connect();

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id, revoked, revoked_at, expires_at
       FROM sessions
       WHERE jti = $1 AND token_hash = $2
       FOR UPDATE`,
      [decoded.jti, tokenHash],
    );

    if (tokenResult.rowCount === 0) {
      throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    const storedSession = tokenResult.rows[0];

    const GRACE_PERIOD_MS = 60000; // 60 seconds grace for race conditions
    const isRevoked = storedSession.revoked || storedSession.revoked_at;
    const now = new Date();
    const revokedAt = storedSession.revoked_at ? new Date(storedSession.revoked_at) : null;
    const revokedRecently = isRevoked && revokedAt && (now.getTime() - revokedAt.getTime()) < GRACE_PERIOD_MS;

    if (isRevoked) {
      if (revokedRecently) {
        console.log(`[AUTH-SERVICE] Grace period hit for recently revoked JTI: ${decoded.jti}. Allowing one more rotation.`);
      } else {
        console.log(`[AUTH-SERVICE] Attempted to use revoked token for JTI: ${decoded.jti} (Revoked at: ${storedSession.revoked_at})`);
        throw new AppError(401, "Refresh token revoked", "REFRESH_REVOKED");
      }
    }

    if (new Date(storedSession.expires_at) < now) {
      console.log(`[AUTH-SERVICE] Refresh token expired for JTI: ${decoded.jti}`);
      throw new AppError(401, "Refresh token expired", "REFRESH_EXPIRED");
    }

    const userResult = await client.query(
      `SELECT 
        u.id, u.name, u.email, u.role,
        COALESCE(e.must_change_password, c.must_change_password, FALSE) as must_change_password
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = $1
       LIMIT 1`,
      [storedSession.user_id],
    );

    if (userResult.rowCount === 0) {
      console.log(`[AUTH-SERVICE] User not found for ID: ${storedSession.user_id}`);
      throw new AppError(401, "User not found", "USER_NOT_FOUND");
    }

    const user = userResult.rows[0];

    console.log(`[AUTH-SERVICE] Refreshing session ${storedSession.id} for user ${user.email}`);

    await client.query(
      `UPDATE sessions
       SET revoked = TRUE,
           revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1`,
      [storedSession.id],
    );

    const session = await createSession(client, user, {
      userAgent,
      ipAddress,
    });

    await client.query("COMMIT");
    console.log(`[AUTH-SERVICE] Session refreshed successfully. New access token generated.`);

    return {
      user,
      ...session,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const logoutSession = async ({ refreshToken }) => {
  const decoded = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  await postgresPool.query(
    `UPDATE sessions
     SET revoked = TRUE,
         revoked_at = NOW()
     WHERE jti = $1 AND token_hash = $2`,
    [decoded.jti, tokenHash],
  );
};

export const getCurrentUserDetails = async (userId) => {
  const result = await postgresPool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.phone,
      u.created_at,
      u.updated_at,

      c.id AS customer_row_id,
      c.customer_id,
      c.joined_at AS customer_joined_at,

      e.id AS employee_row_id,
      e.employee_id,
      e.joined_at AS employee_joined_at,
      COALESCE(e.must_change_password, c.must_change_password, FALSE) as must_change_password,
      COALESCE(
        json_agg(
          json_build_object('id', ic.id, 'name', ic.name)
        ) FILTER (WHERE ic.id IS NOT NULL),
        '[]'
      ) as categories
    FROM users u
    LEFT JOIN customers c ON c.user_id = u.id
    LEFT JOIN employees e ON e.user_id = u.id
    LEFT JOIN employee_issue_categories eic ON e.id = eic.employee_id
    LEFT JOIN issue_categories ic ON eic.issue_category_id = ic.id
    WHERE u.id = $1
    GROUP BY u.id, c.id, e.id
    LIMIT 1
    `,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const row = result.rows[0];

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      phone: row.phone,
      must_change_password: row.must_change_password,
      specialties: row.categories.map(c => c.name),
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    customer: row.customer_row_id
      ? {
          id: row.customer_row_id,
          customer_id: row.customer_id,
          joined_at: row.customer_joined_at,
        }
      : null,
    employee: row.employee_row_id
      ? {
          id: row.employee_row_id,
          employee_id: row.employee_id,
          joined_at: row.employee_joined_at,
        }
      : null,
  };
};

export const requestPasswordReset = async (email) => {
  const client = await postgresPool.connect();
  try {
    const userRes = await client.query("SELECT id, name FROM users WHERE email = $1 LIMIT 1", [email]);
    if (userRes.rowCount === 0) throw new AppError(404, "No account associated with this email", "USER_NOT_FOUND");
    const user = userRes.rows[0];

    const lastOtpRes = await client.query("SELECT created_at FROM password_reset_otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [user.id]);
    if (lastOtpRes.rowCount > 0) {
      const lastSent = new Date(lastOtpRes.rows[0].created_at);
      const diffSec = (Date.now() - lastSent.getTime()) / 1000;
      if (diffSec < 60) throw new AppError(429, `Please wait ${Math.ceil(60 - diffSec)}s before requesting a new code`, "RATE_LIMIT");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await client.query("DELETE FROM password_reset_otps WHERE user_id = $1", [user.id]);
    await client.query("INSERT INTO password_reset_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)", [user.id, otpCode, expiresAt]);

    const { sendPasswordResetEmail } = await import("../utils/emailService.js");
    await sendPasswordResetEmail({ name: user.name, email, otpCode });

    return { message: "OTP sent successfully" };
  } finally { client.release(); }
};

export const verifyOtp = async (email, otpCode) => {
  const client = await postgresPool.connect();
  try {
    const res = await client.query("SELECT pro.id, pro.expires_at FROM password_reset_otps pro JOIN users u ON u.id = pro.user_id WHERE u.email = $1 AND pro.otp_code = $2 LIMIT 1", [email, otpCode]);
    if (res.rowCount === 0) throw new AppError(400, "Invalid verification code", "INVALID_OTP");
    if (new Date(res.rows[0].expires_at) < new Date()) throw new AppError(400, "Verification code has expired", "OTP_EXPIRED");
    return { success: true };
  } finally { client.release(); }
};

export const completePasswordReset = async (email, otpCode, newPassword) => {
  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query("SELECT pro.id, pro.user_id, pro.expires_at FROM password_reset_otps pro JOIN users u ON u.id = pro.user_id WHERE u.email = $1 AND pro.otp_code = $2 LIMIT 1", [email, otpCode]);
    if (res.rowCount === 0) throw new AppError(400, "Invalid verification code", "INVALID_OTP");
    if (new Date(res.rows[0].expires_at) < new Date()) throw new AppError(400, "Verification code has expired", "OTP_EXPIRED");

    const passwordHash = await argon2.hash(newPassword);
    await client.query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [passwordHash, res.rows[0].user_id]);
    await client.query("DELETE FROM password_reset_otps WHERE user_id = $1", [res.rows[0].user_id]);

    await client.query("COMMIT");
    return { success: true, message: "Password reset successfully" };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
};

export const updateUserProfile = async ({ userId, name, phone }) => {
  const result = await postgresPool.query(
    `UPDATE users
     SET name = $1,
         phone = $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, role, phone`,
    [name, phone, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return result.rows[0];
};