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
