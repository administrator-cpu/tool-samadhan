# Expo Push Notifications Integration Details

This document provides a highly granular explanation of every code change made to introduce the Expo Push Notification system to the Samadhan backend. The primary objective was to attach push notifications to existing trigger points without disrupting the legacy email logic.

## 1. Database Schema Additions
**File Modified**: `apps/backend/src/database/drizzle/schema.ts`

**Changes Made**:
1. Added the `pushTokens` table.
   ```typescript
   export const pushTokens = pgTable('push_tokens', {
     id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
     user_id: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
     token: text('token').notNull().unique(),
     platform: varchar('platform', { length: 50 }),
     created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
   });
   ```
2. Added `pushTokens: many(pushTokens)` to `usersRelations`.

**Why**:
We needed a persistent storage layer to map a physical device (represented by the Expo `token`) to a backend `user_id`. The structure deliberately mirrors the `sessions` table because a single user might have multiple devices (e.g., an iPad and an Android phone), requiring a one-to-many relationship. The `platform` column was added for future analytics or platform-specific debugging (e.g., diagnosing delivery issues specific to iOS). The `ON DELETE CASCADE` rule ensures that if a user account is deleted, their push tokens are automatically purged, preventing dead records.

## 2. Push Token Repository Creation
**File Created**: `apps/backend/src/repositories/push-token.repository.ts`

**Changes Made**:
Implemented the `PushTokenRepository` class with four key static methods:
- `upsertToken(userId, token, platform)`: Inserts a token, but uses `ON CONFLICT DO UPDATE` to reassign `user_id` if the token exists.
- `removeToken(token)`: Deletes a specific token from the database.
- `removeTokens(tokens[])`: Bulk deletes multiple tokens using the `inArray` operator.
- `getTokensByUserIds(userIds[])`: Retrieves all tokens mapped to an array of user IDs.

**Why**:
Abstracting the database queries keeps our controllers clean. The `upsertToken` logic handles a critical edge case: if a Support Agent logs out of the app and a Customer logs into the same physical device, Expo generates the exact same push token. A standard `INSERT` would throw a Unique Constraint Error. By using `ON CONFLICT DO UPDATE`, we gracefully transfer ownership of that device's push token to the newly logged-in user, ensuring they get their own notifications instead of the previous user's.

## 3. API Endpoints (Controllers & Routes)
**Files Modified**: 
- `apps/backend/src/controllers/user.controller.ts`
- `apps/backend/src/routes/user.routes.ts`

**Changes Made**:
1. Added `addPushToken` and `removePushToken` methods to `UserController`. They extract the `userId` from the JWT token (`req.user?.userId`) and the `token` from the request body.
2. Registered `POST /api/users/push-token` and `DELETE /api/users/push-token` under the `Protected Routes` section in `user.routes.ts`.

**Why**:
The frontend applications need a secure, authenticated interface to register their push tokens with our backend. 
- The `POST` route is hit by the frontend as soon as the user logs in or grants Push Permission. 
- The `DELETE` route must be called during the frontend's logout sequence. If a user logs out, we must explicitly delete their push token from our database so they stop receiving sensitive ticket notifications on a device they are no longer authenticated on.

## 4. Ticket Repository Query Modification
**File Modified**: `apps/backend/src/repositories/ticket.repository.ts`

**Changes Made**:
Modified the `getCustomerContactInfo` SQL query.
- **Before**: `SELECT u.name, u.email, u.phone, ...`
- **After**: `SELECT u.id as user_id, au.id as agent_user_id, u.name, u.email, u.phone, ...`

**Why**:
The legacy email and SMS systems only required the user's string email address or phone number to fire off notifications. However, our new Push Notification service queries the `push_tokens` table, which is indexed by the database primary key `user_id`. By injecting `user_id` and `agent_user_id` into this existing centralized query, we instantly gained access to the exact target IDs needed for our push payloads across all ticket triggers, without having to write duplicate queries.

## 5. Ticket Service Triggers Integration
**File Modified**: `apps/backend/src/services/ticket.service.ts`

**Changes Made**:
Injected `NotificationService.notify(...)` payloads immediately following every existing `send[X]Email` call. 
For example, under `sendTicketConfirmationEmail`, we added:
```typescript
await NotificationService.notify({
  userIds: [result.info.user_id],
  title: `Ticket ${result.info.ticket_no} created`,
  body: `Your ticket regarding ${result.info.category} has been created.`,
  data: { ticketId: result.ticket.id }
});
```

**Why**:
The prompt explicitly mandated that this feature must be "additive" without disturbing the existing email logic. By placing the `.notify()` calls strictly adjacent to the email functions, we piggyback on the exact same business logic conditions (e.g., skipping emails if `dto.send_email` is false, ensuring agent assignments actually occurred). 

The `data: { ticketId }` property injected into the payload is vital. It allows the frontend Expo application to read the payload when the user taps the notification and perform deep-linking (e.g., routing the user straight to `/customer/tickets/85` rather than just opening the app's home screen).

## 6. Error Handling & Chunking
**File Created**: `apps/backend/src/services/notification/strategies/expo-push.strategy.ts`

**Changes Made**:
- Sliced push tokens into arrays of 100 via a `chunkArray` utility.
- Iterated through chunks, awaiting the `fetch` POST to Expo's Push API.
- Parsed Expo's `receipts` response to identify objects with `details.error === 'DeviceNotRegistered'` and subsequently purged those tokens from our database using `removeTokens`.

**Why**:
Expo's infrastructure strictly caps incoming API requests to 100 messages per chunk. Passing 101 tokens would result in an immediate 400 Bad Request, crashing the notification for everyone. The chunking algorithm mathematically guarantees we never breach this limit. 

Furthermore, if a user uninstalls the mobile app, their push token dies. Expo knows this and returns a `DeviceNotRegistered` error. If we don't parse this error and actively delete the token from our database, our table will bloat with dead tokens, slowing down queries and wasting network bandwidth trying to notify uninstalled apps. Immediate cleanup solves this.
