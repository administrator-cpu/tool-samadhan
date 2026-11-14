import { randomUUID } from 'node:crypto';
import { notificationsQueue } from '../config/redis.js';
import { env } from '../config/environment.js';
import { logger } from './logger.js';

export const NOTIFICATION_CONTRACT_VERSION = 1;

export type NotificationEventType =
  | 'ticket.created'
  | 'ticket.reassigned'
  | 'ticket.reply'
  | 'ticket.internal_note'
  | 'ticket.status_changed'
  | 'ticket.rca_added'
  | 'ticket.outage'
  | 'ticket.rated'
  | 'ticket.auto_closed'
  | 'ticket.sla_breach'
  | 'ticket.automated_update';

export interface NotificationEvent {
  eventId: string;
  version: number;
  eventType: NotificationEventType;
  ticketId: string;
  actorUserId: string | null;
  occurredAt: string;
  meta: Record<string, unknown>;
}

const enabledEvents = new Set(
  env.notifications.queueEvents
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
);

function isEventEnabled(eventType: NotificationEventType): boolean {
  if (!env.notifications.queueEnabled) return false;
  return enabledEvents.has('*') || enabledEvents.has(eventType);
}

/**
 * Hands a ticket event to the Notification Service.
 * Fire-and-forget: never throws, never blocks the caller, independent of email/SMS.
 * Call only AFTER the DB transaction has committed so the service reads committed data.
 */
export function publishNotificationEvent(
  eventType: NotificationEventType,
  ticketId: string | number,
  actorUserId: string | number | null | undefined,
  meta: Record<string, unknown> = {},
): void {
  if (!isEventEnabled(eventType)) return;

  const event: NotificationEvent = {
    eventId: randomUUID(),
    version: NOTIFICATION_CONTRACT_VERSION,
    eventType,
    ticketId: String(ticketId),
    actorUserId: actorUserId === null || actorUserId === undefined ? null : String(actorUserId),
    occurredAt: new Date().toISOString(),
    meta,
  };

  notificationsQueue
    .add(eventType, event, { jobId: event.eventId })
    .catch((err) => logger.error(`[NOTIFICATIONS] Failed to enqueue ${eventType} for ticket ${event.ticketId}`, err));
}
