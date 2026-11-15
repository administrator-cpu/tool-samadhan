import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  execute: vi.fn(),
  add: vi.fn(),
  expoSend: vi.fn(),
  env: { calls: { queueEnabled: true } },
}));

vi.mock('../../src/config/database.js', () => ({ db: { execute: h.execute } }));
vi.mock('../../src/config/redis.js', () => ({ callsQueue: { add: h.add } }));
vi.mock('../../src/config/environment.js', () => ({ env: h.env }));
vi.mock('expo-server-sdk', () => ({
  Expo: class {
    static isExpoPushToken = () => true;
    chunkPushNotifications = (m: unknown[]) => [m];
    sendPushNotificationsAsync = h.expoSend;
  },
}));

const { sendCallPush } = await import('../../src/lib/push.js');

const invite = { callId: 'c1', ttlSec: 50, ticketId: 7, ticketNumber: 'T-7', callerName: 'Ravi', fromEmail: 'a@x.io', declineToken: 'tok' };

describe('sendCallPush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.env.calls.queueEnabled = true;
    h.add.mockResolvedValue({});
    h.expoSend.mockImplementation(async (chunk: unknown[]) => chunk.map(() => ({ status: 'ok', id: 'r' })));
  });

  it('enqueues a call_invite when the callee has native call tokens', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '42', native: 2 }] });
    expect(await sendCallPush('Bob@X.io', 'call_invite', invite)).toBe(2);
    expect(h.add).toHaveBeenCalledTimes(1);
    const [name, job, opts] = h.add.mock.calls[0]!;
    expect(name).toBe('call_invite');
    expect(opts.jobId).toBe(job.jobId);
    expect(job).toMatchObject({
      version: 1,
      type: 'call_invite',
      toEmail: 'bob@x.io',
      toUserId: '42',
      callId: 'c1',
      ticketId: '7',
      ticketNumber: 'T-7',
      declineToken: 'tok',
      ttlSec: 50,
    });
    expect(Date.parse(job.expiresAt) - Date.parse(job.createdAt)).toBe(50_000);
    expect(h.expoSend).not.toHaveBeenCalled();
  });

  it('falls back to the Expo data push for old builds without native tokens', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '42', native: 0 }] }).mockResolvedValueOnce({ rows: [{ token: 'ExponentPushToken[a]' }] });
    expect(await sendCallPush('bob@x.io', 'call_invite', invite)).toBe(1);
    expect(h.add).not.toHaveBeenCalled();
    const msg = h.expoSend.mock.calls[0]![0][0];
    expect(msg.data.type).toBe('call_invite');
    expect(msg._contentAvailable).toBe(true);
  });

  it('always enqueues missed calls (visible push is sent by the service)', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '42', native: 0 }] });
    expect(await sendCallPush('bob@x.io', 'call_missed', { callId: 'c1', ttlSec: 86400, callerName: 'Ravi' })).toBe(1);
    expect(h.add.mock.calls[0]![1].type).toBe('call_missed');
  });

  it('passes the cancel reason and the device to skip', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '42', native: 1 }] });
    await sendCallPush('bob@x.io', 'call_cancel', { callId: 'c1', ttlSec: 60, reason: 'answered_elsewhere', excludeDeviceId: 'ios-1' });
    expect(h.add.mock.calls[0]![1]).toMatchObject({ type: 'call_cancel', reason: 'answered_elsewhere', excludeDeviceId: 'ios-1' });
  });

  it('returns 0 for an unknown callee', async () => {
    h.execute.mockResolvedValueOnce({ rows: [] });
    expect(await sendCallPush('nobody@x.io', 'call_invite', invite)).toBe(0);
    expect(h.add).not.toHaveBeenCalled();
  });

  it('uses the Expo path when Redis is down', async () => {
    h.execute.mockResolvedValueOnce({ rows: [{ id: '42', native: 1 }] }).mockResolvedValueOnce({ rows: [{ token: 'ExponentPushToken[a]' }] });
    h.add.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect(await sendCallPush('bob@x.io', 'call_invite', invite)).toBe(1);
    expect(h.expoSend).toHaveBeenCalledTimes(1);
  });

  it('uses the Expo path when the queue is disabled', async () => {
    h.env.calls.queueEnabled = false;
    h.execute.mockResolvedValueOnce({ rows: [{ token: 'ExponentPushToken[a]' }] });
    expect(await sendCallPush('bob@x.io', 'call_cancel', { callId: 'c1', ttlSec: 60 })).toBe(1);
    expect(h.add).not.toHaveBeenCalled();
    expect(h.expoSend.mock.calls[0]![0][0].data).toEqual({ type: 'call_cancel', callId: 'c1' });
  });
});
