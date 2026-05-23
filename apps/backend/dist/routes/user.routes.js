import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/dto.js';
import { validateRegister, validateLogin, validateChangePassword, validateUpdateProfile, validateForgotPassword, validateVerifyOtp, validateResetPassword } from '../middleware/validators/user.validator.js';
const router = Router();
// Public Routes
router.post('/login', validateLogin, UserController.login);
router.post('/refresh', UserController.refresh);
router.post('/logout', UserController.logout);
router.post('/forgot-password', validateForgotPassword, UserController.forgotPassword);
router.post('/verify-otp', validateVerifyOtp, UserController.verifyOtp);
router.post('/reset-password', validateResetPassword, UserController.resetPassword);
// Protected Routes
router.use(requireAuth);
router.get('/me', UserController.getCurrentUser);
router.put('/profile', validateUpdateProfile, UserController.updateProfile);
router.post('/change-password', validateChangePassword, UserController.changePassword);
// Employee Management (ADMIN, MANAGER)
router.post('/employees', requireRole([UserRole.ADMIN]), // Originally only ADMIN/MANAGER, adjusted to what exists
validateRegister, UserController.registerEmployee);
router.get('/employees', requireRole([UserRole.ADMIN]), UserController.getAllEmployees);
router.get('/agents', requireRole([UserRole.ADMIN]), UserController.getAllAgents);
router.put('/employees/:id', requireRole([UserRole.ADMIN]), validateUpdateProfile, UserController.updateEmployee);
router.delete('/employees/:id', requireRole([UserRole.ADMIN]), UserController.deleteEmployee);
// Customer Management
router.post('/customers', requireRole([UserRole.SALES, UserRole.ADMIN]), validateRegister, UserController.registerCustomer);
router.get('/customers', requireRole([UserRole.SALES, UserRole.ADMIN]), UserController.getAllCustomers);
router.delete('/customers/:id', requireRole([UserRole.ADMIN]), UserController.deleteCustomer);
export default router;
//# sourceMappingURL=user.routes.js.map