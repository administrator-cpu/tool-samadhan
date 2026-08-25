import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/:id/translate', EventController.translateEvent);

export default router;
