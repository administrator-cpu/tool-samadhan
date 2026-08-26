// sockets/callSignaling.js
import { Server, Socket } from 'socket.io';
import { sendPushToEmail } from '../lib/push.js'; // you'll need to write this using expo-server-sdk against your push_tokens table

const CALL_EVENTS = [
  'call:invite',
  'call:offer',
  'call:answer',
  'call:ice-candidate',
  'call:accept',
  'call:reject',
  'call:cancel',
  'call:end',
] as const;

export function registerCallSignaling(io: Server, socket: Socket) {
  const userEmail = (socket as any).user?.email;
  if (!userEmail) return;

  socket.join(`email_${userEmail}`);

  CALL_EVENTS.forEach((event) => {
    socket.on(event, async (payload: { toEmail: string; [k: string]: unknown }) => {
      const { toEmail } = payload;
      if (!toEmail) return;

      const room = io.sockets.adapter.rooms.get(`email_${toEmail}`);
      const isOnline = room && room.size > 0;

      io.to(`email_${toEmail}`).emit(event, { ...payload, fromEmail: userEmail });

      if (event === 'call:invite' && !isOnline) {
        await sendPushToEmail(toEmail, {
          title: 'Incoming call',
          body: `${(payload as any).callerName || 'Someone'} is calling you`,
          data: { ticketId: (payload as any).ticketId, type: 'call_invite' },
        });
      }
    });
  });
}