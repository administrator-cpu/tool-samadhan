import { Router } from 'express';
import { GuestController } from '../controllers/guest.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { parseTicketCreationUpload } from '../middleware/multipart.middleware.js';

const router = Router();

router.post('/send-otp', GuestController.sendOtp);
router.post('/verify-otp', GuestController.verifyOtp);
router.get('/circuit/verify', GuestController.verifyCircuit);
router.post('/tickets', requireAuth, parseTicketCreationUpload, GuestController.createTicket);

export default router;
