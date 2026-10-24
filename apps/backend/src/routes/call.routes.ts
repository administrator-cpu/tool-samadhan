import { Router } from 'express';
import { declineCallWithToken } from '../sockets/callSignaling.js';

const router = Router();

router.post('/decline', (req, res) => {
  const callId = typeof req.body?.callId === 'string' ? req.body.callId : '';
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!callId || !token) return res.status(400).json({ ok: false });
  const ok = declineCallWithToken(callId, token);
  return res.status(ok ? 200 : 410).json({ ok });
});

export default router;
