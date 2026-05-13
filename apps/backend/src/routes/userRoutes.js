import express from "express";
import { customerRegister, login, refresh, logout, employeeCreate, getMe, fetchAllEmployees, fetchIssueCategories, fetchAllAgents, removeEmployee, changePassword, forgotPassword, verifyResetOtp, resetUserPassword } from "../controllers/userController.js";
import { validateCustomerRegister, validateLogin, validateEmployeeCreate } from "../middlewares/inputValidator.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", validateCustomerRegister, customerRegister);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyResetOtp);
router.post("/reset-password", resetUserPassword);

router.post("/employees", requireAuth, requireRole("ADMIN"), validateEmployeeCreate, employeeCreate);
router.get("/employees", requireAuth, requireRole("ADMIN"), fetchAllEmployees);
router.delete("/employees/:id", requireAuth, requireRole("ADMIN"), removeEmployee);
router.get("/agents", requireAuth, requireRole("ADMIN"), fetchAllAgents);
router.get("/categories", requireAuth, fetchIssueCategories);

router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, changePassword);

export default router;