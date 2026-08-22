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
  const userId = (socket as any).user?.userId;
  if (!userId) return;

  socket.join(`user_${userId}`);

  CALL_EVENTS.forEach((event) => {
    socket.on(event, (payload: { toUserId: string | number; [k: string]: unknown }) => {
      const { toUserId } = payload;
      if (!toUserId) return;
      io.to(`user_${toUserId}`).emit(event, { ...payload, fromUserId: userId });
    });
  });
}
