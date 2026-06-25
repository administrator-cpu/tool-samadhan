import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/dto.js';
import { validateRegister, validateUpdateProfile } from '../middleware/validators/user.validator.js';
import { parseProfileImageUpload } from '../middleware/profile-upload.middleware.js';

const router = Router();

// Protected Routes
router.use(requireAuth);

router.get('/me', UserController.getCurrentUser);
router.get('/my-connections', requireRole([UserRole.USER]), UserController.getMyConnections);
router.put('/profile', validateUpdateProfile, UserController.updateProfile);
router.post('/profile/image', parseProfileImageUpload(), UserController.uploadProfileImage);
router.delete('/profile/image', UserController.removeProfileImage);

router.post(
  '/employees',
  requireRole([UserRole.ADMIN]),
  validateRegister,
  UserController.registerEmployee
);

router.get(
  '/employees',
  requireRole([UserRole.ADMIN]),
  UserController.getAllEmployees
);

router.get(
  '/agents',
  requireRole([UserRole.ADMIN, UserRole.SUPPORT_AGENT]),
  UserController.getAllAgents
);

router.put(
  '/employees/:id',
  requireRole([UserRole.ADMIN]),
  validateUpdateProfile,
  UserController.updateEmployee
);

router.delete(
  '/employees/:id',
  requireRole([UserRole.ADMIN]),
  UserController.deleteEmployee
);

// Customer Management
router.post(
  '/customers',
  requireRole([UserRole.SALES, UserRole.ADMIN]),
  validateRegister,
  UserController.registerCustomer
);

router.get(
  '/customers',
  requireRole([UserRole.SALES, UserRole.ADMIN]),
  UserController.getAllCustomers
);

router.get(
  '/customers/:id/connections',
  requireRole([UserRole.ADMIN, UserRole.SALES]),
  UserController.getCustomerConnectionsById
);

router.put(
  '/customers/:id',
  requireRole([UserRole.ADMIN]),
  validateUpdateProfile,
  UserController.updateCustomer
);

router.delete(
  '/customers/:id',
  requireRole([UserRole.ADMIN]),
  UserController.deleteCustomer
);

export default router;
