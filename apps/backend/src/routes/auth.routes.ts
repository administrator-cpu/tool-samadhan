import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  validateLogin,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
  validateChangePassword
} from '../middleware/validators/user.validator.js';

const router = Router();

// Auth Routes
router.post('/login', validateLogin, UserController.login);
router.post('/refresh', UserController.refresh);
router.post('/logout', UserController.logout);

router.post('/forgot-password', validateForgotPassword, UserController.forgotPassword);
router.post('/verify-otp', validateVerifyOtp, UserController.verifyOtp);
router.post('/reset-password', validateResetPassword, UserController.resetPassword);

router.post('/change-password', requireAuth, validateChangePassword, UserController.changePassword);

export default router;
