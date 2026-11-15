# Notification events (backend → Notification Service)

The backend publishes ticket events to the BullMQ queue **`notifications`** on the shared Redis.
The standalone Notification Service consumes it. The backend never computes recipients or builds push payloads.

Producer: `src/lib/notification-events.ts` → `publishNotificationEvent(eventType, ticketId, actorUserId, meta)`.
Publishing is fire-and-forget, happens after the DB transaction commits, and is independent of email/SMS.

## Job

- Queue: `notifications`
- Job name: same as `eventType`
- Job id: `eventId` (BullMQ dedupes on it)
- Job data:

| Field | Type | Notes |
|---|---|---|
| `eventId` | string (UUID) | Idempotency key |
| `version` | number | Contract version, currently `1` |
| `eventType` | string | See table below |
| `ticketId` | string | `tickets.id` |
| `actorUserId` | string \| null | `users.id` of whoever caused it; `null` for automation |
| `occurredAt` | string | ISO 8601 |
| `meta` | object | Event-specific, see below |

## Event types

| eventType | Source | meta |
|---|---|---|
| `ticket.created` | `TicketService.createTicket` | `assignedEmployeeId` (`employees.id` or null if not auto-assigned) |
| `ticket.reassigned` | `TicketService.reassignTicket` | `previousEmployeeId` (`employees.id` or null), `newEmployeeId` (`employees.id`) |
| `ticket.reply` | `TicketService.addTicketEvent` (visible to customer) | `ticketEventId`, `replyType` (`USER_REPLY` / `AGENT_REPLY` / `ADMIN_REPLY` / `INTERNAL_NOTE`), `actorRole` |
| `ticket.internal_note` | `TicketService.addTicketEvent` (not visible to customer) | same as `ticket.reply` |
| `ticket.status_changed` | `TicketService.updateTicketStatus` | `oldStatus`, `requestedStatus` (may be `REOPENED`), `newStatus` (stored status) |
| `ticket.rca_added` | `TicketService.updateTicketRca` | `autoClosed` (true if the late RCA also closed the ticket) |
| `ticket.outage` | `TicketService.updateOutageDetails` | `problemSide`, `externalTicketNo` |
| `ticket.rated` | `TicketService.updateTicketRating` | `rating` |
| `ticket.auto_closed` | automation worker (`CLOSE_RESOLVED_TICKET`, `BULK_CLOSE_RESOLVED_TICKETS`) | `source` |
| `ticket.sla_breach` | automation worker (`MTTR_BREACH_ESCALATION`, `REOPENED_MTTR_BREACH_ESCALATION`) | `reopened` |
| `ticket.automated_update` | automation worker (troubleshooting / final-activity updates) | `job` |

Mapping ids to users: `employees.id → employees.user_id`, `tickets.customer_id → customers.user_id`.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NOTIFICATION_QUEUE_ENABLED` | `false` | Turn publishing on once the Notification Service is running |
| `NOTIFICATION_QUEUE_EVENTS` | `*` | Comma-separated allowlist for staged rollout, e.g. `ticket.created,ticket.reassigned` |
| `LEGACY_TICKET_PUSH_ENABLED` | `true` | Old in-process Expo push on ticket create/auto-assign. Set `false` after the service is verified |

## Rollout

1. Deploy the Notification Service.
2. `NOTIFICATION_QUEUE_ENABLED=true`, `NOTIFICATION_QUEUE_EVENTS=ticket.created,ticket.reassigned`. Legacy push stays on; compare delivery.
3. `LEGACY_TICKET_PUSH_ENABLED=false`.
4. `NOTIFICATION_QUEUE_EVENTS=*`.

Call push (`src/lib/push.ts`, used by `callSignaling.ts`) is unchanged; it moves to the service in Track 3.

# Call pushes (backend → Notification Service)

Incoming calls ring natively (APNs VoIP → CallKit, FCM high-priority data → full-screen call).
Producer: `src/lib/push.ts` → `sendCallPush(email, type, input)`, called from `src/sockets/callSignaling.ts`.
Signaling, the pending-invite buffer, replay and decline tokens are unchanged.

- Queue: **`calls`** (separate from `notifications`, so tickets never delay a ring)
- Job name: `type`; job id: `jobId`
- Attempts: 3, fixed 1 s backoff. The service drops an invite whose `expiresAt` has passed.

| Field | Type | Notes |
|---|---|---|
| `version` | number | `1` |
| `jobId` | string (UUID) | Idempotency key per device delivery |
| `type` | `call_invite` \| `call_cancel` \| `call_missed` | |
| `toEmail` / `toUserId` | string | Callee |
| `callId` | string | |
| `ticketId`, `ticketNumber`, `callerName`, `fromEmail` | string \| null | |
| `declineToken` | string \| null | Invite only; posted to `POST /api/calls/decline` by the native UI |
| `reason` | `caller_cancelled` \| `answered_elsewhere` \| `declined_elsewhere` \| null | Cancel only |
| `excludeDeviceId` | string \| null | Cancel only: the device that answered/declined |
| `ttlSec`, `createdAt`, `expiresAt` | | Invite TTL = ring timeout (50 s) |

| When | Push |
|---|---|
| Invite while the callee has no foreground socket | `call_invite` |
| Caller cancels / ends before answer | `call_cancel` (`caller_cancelled`) + `call_missed` |
| Callee answers, declines or is busy on one device | `call_cancel` to the others (`answered_elsewhere` / `declined_elsewhere`) |
| Decline from the lock screen (`/api/calls/decline`) | `call_cancel` (`declined_elsewhere`) to the others |

`delivered` for `call:unavailable` = connected socket, or at least one device the push was handed to.
Callees with no `apns_voip`/`fcm` token (old app builds) get the previous Expo data push.

| Env | Default | |
|---|---|---|
| `CALL_QUEUE_ENABLED` | `false` | `true` = use the `calls` queue. `false` = old in-process Expo push for everyone |
