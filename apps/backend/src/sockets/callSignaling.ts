import { Server, Socket } from 'socket.io';

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
    socket.on(event, (payload: { toEmail: string; [k: string]: unknown }) => {
      const { toEmail } = payload;
      if (!toEmail) return;
      io.to(`email_${toEmail}`).emit(event, { ...payload, fromEmail: userEmail });
    });
  });
}
