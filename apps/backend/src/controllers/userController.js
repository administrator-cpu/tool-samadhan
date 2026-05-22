import { createEmployee, loginUser, refreshSession, logoutSession, getCurrentUserDetails, listAllEmployees, listAllAgents, deleteEmployee, updateEmployee, updatePassword, requestPasswordReset, verifyOtp, completePasswordReset, updateUserProfile, createCustomer, listAllCustomers, deleteCustomer } from "../services/authService.js";
import { listIssueCategories } from "../services/ticketService.js";
import AppError from "../utils/AppError.js";
import { REFRESH_TOKEN_MAX_AGE_MS } from "../services/jwt.js";

const isProd = process.env.NODE_ENV === "production";

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true, // SameSite = None requires Secure: true
    sameSite: "none",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true, // SameSite = None requires Secure: true
    sameSite: "none",
    path: "/",
  });
};

export const customerRegister = async (req, res) => {
  throw new AppError(403, "Public registration is disabled. Please contact an administrator.", "REGISTRATION_DISABLED");
};

export const customerCreate = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const result = await createCustomer({
    name,
    email,
    password,
    phone,
  });

  return res.status(201).json({
    statusCode: 201,
    message: "Customer created successfully",
    data: result,
  });
};

export const fetchAllCustomers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await listAllCustomers({ page, limit });

  return res.status(200).json({
    statusCode: 200,
    message: "Customers fetched successfully",
    data: result,
  });
};

export const removeCustomer = async (req, res) => {
  const { id } = req.params;
  await deleteCustomer(id);

  return res.status(200).json({
    statusCode: 200,
    message: "Customer account deleted successfully",
  });
};

export const employeeCreate = async (req, res) => {
  const { name, email, password, role, issueCategoryNames } = req.body;

  const result = await createEmployee({
    name,
    email,
    password,
    role,
    issueCategoryNames,
  });

  return res.status(201).json({
    statusCode: 201,
    message: "Employee created successfully",
    data: result,
  });
};

export const fetchAllEmployees = async (req, res) => {
  const result = await listAllEmployees();

  return res.status(200).json({
    statusCode: 200,
    message: "Employees fetched successfully",
    data: result,
  });
};

export const removeEmployee = async (req, res) => {
  const { id } = req.params;
  await deleteEmployee(id);

  return res.status(200).json({
    statusCode: 200,
    message: "Employee and user account deleted successfully",
  });
};

export const editEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, issueCategoryNames } = req.body;

  const result = await updateEmployee({
    employeeRowId: id,
    name,
    email,
    phone,
    issueCategoryNames,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Employee updated successfully",
    data: result,
  });
};

export const fetchIssueCategories = async (req, res) => {
  const result = await listIssueCategories();

  return res.status(200).json({
    statusCode: 200,
    message: "Categories fetched successfully",
    data: result,
  });
};

export const fetchAllAgents = async (req, res) => {
  const result = await listAllAgents();

  return res.status(200).json({
    statusCode: 200,
    message: "Agents fetched successfully",
    data: result,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser({
    email,
    password,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });

  setRefreshCookie(res, result.refreshToken);

  return res.status(200).json({
    statusCode: 200,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];

  if (!token) {
    console.log(`[REFRESH] No refresh token found in cookies, body, or headers.`);
    console.log(`[REFRESH] User-Agent: ${req.headers["user-agent"]}`);
    throw new AppError(401, "No refresh token found. Please log in again.", "NO_REFRESH_TOKEN");
  }

  try {
    const result = await refreshSession({
      refreshToken: token,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    console.log(`[REFRESH] Success for user: ${result.user.email}`);
    setRefreshCookie(res, result.refreshToken);

    return res.status(200).json({
      statusCode: 200,
      message: "Token refreshed",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    console.log(`[REFRESH] Failed: ${error.message}`);
    throw error;
  }
};

export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await logoutSession({ refreshToken: token });
  }

  clearRefreshCookie(res);

  return res.status(200).json({
    statusCode: 200,
    message: "Logged out",
  });
};

export const getMe = async (req, res) => {
  const result = await getCurrentUserDetails(req.user.userId);

  return res.status(200).json({
    statusCode: 200,
    message: "User profile fetched successfully",
    data: result,
  });
};

export const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId;

  await updatePassword({ userId, newPassword });

  return res.status(200).json({
    statusCode: 200,
    message: "Password updated successfully",
  });
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);

  return res.status(200).json({
    statusCode: 200,
    message: result.message,
  });
};

export const verifyResetOtp = async (req, res) => {
  const { email, otpCode } = req.body;
  await verifyOtp(email, otpCode);

  return res.status(200).json({
    statusCode: 200,
    message: "OTP verified successfully",
  });
};

export const resetUserPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  await completePasswordReset(email, otpCode, newPassword);

  return res.status(200).json({
    statusCode: 200,
    message: "Password reset successfully",
  });
};

export const updateMe = async (req, res) => {
  const { name, phone } = req.body;
  const result = await updateUserProfile({
    userId: req.user.userId,
    name,
    phone,
  });

  return res.status(200).json({
    statusCode: 200,
    message: "Profile updated successfully",
    data: result,
  });
};
