# Backend Testing Documentation

Welcome to the testing documentation for the Samadhan Backend. 


## 🎯 Testing Strategy Overview

Our goal is to ensure the backend is reliable, stable, and bug-free without risking modifications to the real database.

- **Framework**: We use [Vitest](https://vitest.dev/) for blazing-fast test execution.
- **Isolation**: A global database mock guarantees that **zero** actual database connections are made during testing.
- **E2E Testing**: We use `supertest` to simulate real HTTP requests to our API endpoints (checking headers, cookies, and status codes).
- **Unit Testing**: We test specific business logic (Services) by mocking out the Database (Repositories).

---

## 📂 File-by-File Breakdown

### 1. Auth Routes Testing
**File:** `tests/routes/auth.routes.test.ts`
**Purpose:** Ensure user login and logout endpoints process requests securely and correctly manage cookies.

**How it works:**
We use `supertest` to hit the `/api/login` and `/api/logout` routes. We mock `AuthService` so we don't query the real Users table. We assert HTTP status codes and verify the `set-cookie` header array to guarantee secure token delivery.

**What is tested (Scenarios):**
- ❌ **Fails gracefully (400 Bad Request):** If a user forgets to send a password.
- ❌ **Fails securely (401 Unauthorized):** If a user provides an incorrect email or password.
- ✅ **Passes (200 OK):** If credentials are correct, the API sets an `HttpOnly` refresh token cookie and returns user data.
- ✅ **Logout (200 OK):** Clears the active session and strips the authentication cookies from the browser.

### 2. Ticket Routes Testing
**File:** `tests/routes/ticket.routes.test.ts`
**Purpose:** Ensure the endpoints that create and update tickets correctly validate user input before touching business logic.

**How it works:**
We mock `auth.middleware` to instantly authenticate a test user (Admin). We then mock `TicketService` to isolate the controller logic. We test Zod payload validation and the JSON structure of the API response.

**What is tested (Scenarios):**
- ❌ **Fails gracefully (400 Bad Request):** If a user tries to create a ticket without a mandatory field (e.g., missing title).
- ✅ **Passes (201 Created):** When valid ticket data is sent, the API confirms creation.
- ❌ **Fails gracefully (400 Bad Request):** If an agent tries to update a ticket status to an invalid state (e.g., "SUPER_RESOLVED").
- ✅ **Passes (200 OK):** When a ticket status is successfully updated to "RESOLVED".

### 3. Ticket Service Testing (Business Logic)
**File:** `tests/services/ticket.service.test.ts`
**Purpose:** Ensure that the internal logic for creating tickets behaves correctly, calculating default values, and firing background events.

**How it works:**
We test `TicketService.createTicket`. We mock `TicketRepository`, `TicketEventRepository`, and the Email Service so no database rows are inserted and no real emails are sent. We also mock Postgres `withTransaction` to execute synchronously.

**What is tested (Scenarios):**
- ✅ **Passes:** Creates a ticket successfully. The logic correctly calculates that new tickets must start with an `OPEN` status.
- ✅ **Passes:** Ensures an internal "Ticket Created" timeline event is tracked.
- ✅ **Passes:** Confirms that the Email Notification service is triggered to alert the helpdesk.
- ❌ **Fails:** Rejects creation if the database payload is critically malformed.

### 4. Assignment Service Testing (Business Logic)
**File:** `tests/services/assignment.service.test.ts`
**Purpose:** Ensure tickets can only be assigned to agents under valid conditions.

**How it works:**
We test `AssignmentService.assignTicket`. We mock `TicketRepository` and `EmployeeRepository` to inject fake ticket states (e.g., returning a mock ticket that is already closed) and check how our logic reacts.

**What is tested (Scenarios):**
- ❌ **Fails (Not Found):** If someone tries to assign a ticket ID that doesn't exist.
- ❌ **Fails (Invalid State):** If someone tries to assign a ticket that is already `CLOSED` or `RESOLVED` (prevents modifying archived tickets).
- ✅ **Passes:** Successfully assigns an `OPEN` ticket to an IT Agent.
- ✅ **Passes:** Successfully re-assigns a ticket from one agent to another.

---

## 🛠️ Mock Data & Setup

**File:** `tests/setupTests.ts`
This is the heart of our test reliability. Before any test runs, this file sets up a virtual environment:
1. **Global Postgres Mock (`pg`)**: It overrides the database driver. Whenever the code tries to `connect()` or `query()`, it silently intercepts the call and does nothing. 
2. **Global Logger Mock**: Disables `console.log` from the application logger so test outputs remain clean and readable.
3. **Environment Variables**: Injects fake secret keys (like `JWT_SECRET='test-secret'`) to prevent using real production keys during local testing.
