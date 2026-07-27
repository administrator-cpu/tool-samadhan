# Backend API Documentation

This document outlines all the available API routes in the backend system, what inputs they require, what inputs they reject, their expected outputs, and ready-to-use cURL commands for testing.

---

## Table of Contents
1. [Authentication Routes](#1-authentication-routes)
2. [User & Profile Routes](#2-user--profile-routes)
3. [Customer & Employee Management Routes](#3-customer--employee-management-routes)
4. [Ticket Routes](#4-ticket-routes)

---

## 1. Authentication Routes

Base path: `/api`

### User Login
Authenticate a user and retrieve an access and refresh token. The server will also set these tokens in HTTP-only cookies.

- **Route:** `POST /api/login`
- **Expected Input:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **What it rejects:** Missing `email`, invalid email formats, and missing `password`.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "role": "USER" },
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123!"}'
  ```

### Refresh Token
Refresh an expired access token using a valid refresh token.

- **Route:** `POST /api/refresh`
- **Expected Input:** You can pass the refresh token either in a secure cookie (handled automatically by the browser) or in the JSON body.
  ```json
  {
    "refreshToken": "eyJhbG..."
  }
  ```
- **What it rejects:** Requests where the refresh token is missing or expired.
- **Expected Output:** Similar to login, it returns the new `accessToken` and `refreshToken` payload.
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token_here"}'
  ```

### Logout
Log out the user and clear the authentication cookies.

- **Route:** `POST /api/logout`
- **Expected Input:** None required (reads from cookie). Optionally provide `refreshToken` in the body.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer <access_token>"
  ```

### Forgot Password
Initiate the password reset process by requesting an OTP.

- **Route:** `POST /api/forgot-password`
- **Expected Input:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **What it rejects:** Invalid email addresses.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "OTP sent to your email"
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
  ```

### Verify OTP
Verify the 6-digit OTP sent to the user's email.

- **Route:** `POST /api/verify-otp`
- **Expected Input:**
  ```json
  {
    "email": "user@example.com",
    "otpCode": "123456"
  }
  ```
- **What it rejects:** OTP codes that are not exactly 6 characters long, or invalid email addresses.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully. You may now reset your password."
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otpCode": "123456"}'
  ```

### Reset Password
Set a new password after verifying the OTP.

- **Route:** `POST /api/reset-password`
- **Expected Input:**
  ```json
  {
    "email": "user@example.com",
    "otpCode": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **What it rejects:** 
  - OTP codes not exactly 6 characters long.
  - Passwords that are shorter than 8 characters.
  - Passwords missing at least one uppercase letter, one lowercase letter, one number, and one special character.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully. You can now login."
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otpCode": "123456", "newPassword": "NewPassword123!"}'
  ```

### Change Password
Allow an authenticated user to change their current password.

- **Route:** `POST /api/change-password`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **What it rejects:** `newPassword` failing the complexity checks (must have uppercase, lowercase, number, and min 8 characters).
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please log in again."
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"currentPassword": "OldPassword123!", "newPassword": "NewPassword123!"}'
  ```

---

## 2. User & Profile Routes

Base path: `/api/users`

### Get Current User Profile
Retrieve the details of the currently authenticated user.

- **Route:** `GET /api/users/me`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "USER"
      }
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer <access_token>"
  ```

### Update User Profile
Update the currently authenticated user's profile details. Customers cannot use this route to update profile details.

- **Route:** `PUT /api/users/profile`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admins/Agents only)
- **Expected Input:**
  ```json
  {
    "name": "Jane Doe",
    "phone": "1234567890",
    "issueCategories": ["category-uuid"]
  }
  ```
- **What it rejects:** Names shorter than 2 or longer than 100 characters, phone numbers longer than 15 characters, or unauthorized roles (Customers).
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "user": { /* updated user object */ }
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X PUT http://localhost:8000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name": "Jane Doe", "phone": "1234567890"}'
  ```

### Get My Connections
Retrieve network/CRM connections for the logged-in customer.

- **Route:** `GET /api/users/my-connections`
- **Authentication:** Requires `Authorization: Bearer <token>` (Customer Role `USER` only)
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "connections": [
        {
          "id": "conn-uuid",
          "fabCircuitId": "FAB-123",
          "serviceType": "Fiber"
        }
      ]
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/my-connections \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Outstanding Balance
Retrieve the outstanding billing balance for the logged-in customer.

- **Route:** `GET /api/users/outstanding-balance`
- **Authentication:** Requires `Authorization: Bearer <token>` (Customer Role `USER` only)
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "outstandingBalance": 150.50
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/outstanding-balance \
  -H "Authorization: Bearer <access_token>"
  ```

### Upload Profile Image
Upload a new profile image for the authenticated user.

- **Route:** `POST /api/users/profile/image`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input (Multipart Form-Data):** `profile_image` (File)
- **Expected Output:** Success message with updated user data containing the image URL.
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/users/profile/image \
  -H "Authorization: Bearer <access_token>" \
  -F "profile_image=@/path/to/image.jpg"
  ```

### Remove Profile Image
Remove the profile image for the authenticated user.

- **Route:** `DELETE /api/users/profile/image`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Output:** Success message with updated user data.
- **cURL Command:**
  ```bash
  curl -X DELETE http://localhost:8000/api/users/profile/image \
  -H "Authorization: Bearer <access_token>"
  ```

---

## 3. Customer & Employee Management Routes

Base path: `/api/users`

### Register Employee
Create a new employee (Admin or Support Agent) account.

- **Route:** `POST /api/users/employees`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Expected Input:**
  ```json
  {
    "name": "Agent Smith",
    "email": "smith@example.com",
    "phone": "9876543210",
    "role": "SUPPORT_AGENT",
    "issueCategories": ["cat-uuid-1"]
  }
  ```
- **What it rejects:** Missing name or email, improperly formatted emails, and names that are less than 2 characters.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Employee registered",
    "data": { /* new user object */ }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/users/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"name": "Agent Smith", "email": "smith@example.com", "role": "SUPPORT_AGENT"}'
  ```

### Register Customer
Create a new customer account.

- **Route:** `POST /api/users/customers`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Expected Input:** Identical to the `Register Employee` endpoint, but creates a customer.
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/users/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"name": "Acme Corp", "email": "contact@acme.com"}'
  ```

### List Employees
Retrieve a paginated list of all employees.

- **Route:** `GET /api/users/employees`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Query Parameters (Optional):** `page`, `limit`.
- **Expected Output:** Paginated list of employees.
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/users/employees?page=1&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
  ```

### List Support Agents
Retrieve a list of all support agents.

- **Route:** `GET /api/users/agents`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin or Support Agent Role)
- **Expected Output:** List of agent users.
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/agents \
  -H "Authorization: Bearer <access_token>"
  ```

### Update Employee
Update an existing employee's details.

- **Route:** `PUT /api/users/employees/:id`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Expected Input:** Same as profile update.
- **cURL Command:**
  ```bash
  curl -X PUT http://localhost:8000/api/users/employees/employee-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"name": "Updated Name"}'
  ```

### Delete Employee
Delete an employee from the system.

- **Route:** `DELETE /api/users/employees/:id`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **cURL Command:**
  ```bash
  curl -X DELETE http://localhost:8000/api/users/employees/employee-uuid \
  -H "Authorization: Bearer <admin_access_token>"
  ```

### List Customers
Retrieve a paginated list of customers.

- **Route:** `GET /api/users/customers`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Query Parameters (Optional):** `page`, `limit`, `search`.
- **Expected Output:** Paginated list of customer users.
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/users/customers?page=1&limit=10" \
  -H "Authorization: Bearer <admin_access_token>"
  ```

### List Not-Linked Customers
Retrieve a list of customers who are not yet linked to connections in the system.

- **Route:** `GET /api/users/customers/not-linked`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Output:** List of customers.
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/customers/not-linked \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Customer Connections by ID
Retrieve the network/CRM connections for a specific customer by their internal user ID.

- **Route:** `GET /api/users/customers/:id/connections`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Expected Output:** Array of connection objects for the specified customer.
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/users/customers/customer-uuid-here/connections \
  -H "Authorization: Bearer <admin_access_token>"
  ```

### Update Customer
Update an existing customer's details.

- **Route:** `PUT /api/users/customers/:id`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Expected Input:** Same as profile update.
- **cURL Command:**
  ```bash
  curl -X PUT http://localhost:8000/api/users/customers/customer-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"name": "Updated Corp"}'
  ```

### Delete Customer
Delete a customer from the system.

- **Route:** `DELETE /api/users/customers/:id`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **cURL Command:**
  ```bash
  curl -X DELETE http://localhost:8000/api/users/customers/customer-uuid \
  -H "Authorization: Bearer <admin_access_token>"
  ```

---

## 4. Ticket Routes

Base path: `/api/tickets`

### Create Ticket
Submit a new support ticket.

- **Route:** `POST /api/tickets`
- **Authentication:** Requires `Authorization: Bearer <token>` (All authenticated users)
- **Expected Input (Multipart Form-Data for attachments, or JSON):**
  ```json
  {
    "issueCategoryId": "uuid-of-category",
    "circuitDescription": "Internet is down on FAB-123",
    "message": "Cannot connect since morning.",
    "alternateEmail": ["alt1@example.com"],
    "customerId": "uuid" // Optional, used when agents create tickets for customers
  }
  ```
- **What it rejects:** Missing `issueCategoryId`, missing `circuitDescription`, and providing more than 3 `alternateEmail` addresses.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Ticket created successfully",
    "data": { /* newly created ticket object */ }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"issueCategoryId": "cat-id", "circuitDescription": "Network down"}'
  ```

### List Tickets
Retrieve a paginated list of tickets.

- **Route:** `GET /api/tickets`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Query Parameters (Optional):** `limit`, `cursor`, `status`, `statusGroup`, `searchQuery`, `sortField`, `sortOrder`.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "tickets": [],
      "nextCursor": "uuid"
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/tickets?limit=10&status=OPEN" \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Ticket Timeline (Details)
Retrieve the full details and event history timeline for a specific ticket.

- **Route:** `GET /api/tickets/:id`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Output:** Returns the ticket details alongside a chronological list of events (messages, status changes, assignments).
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/tickets/ticket-uuid-here \
  -H "Authorization: Bearer <access_token>"
  ```

### Add Event to Ticket (Reply)
Add a message or internal note to a ticket.

- **Route:** `POST /api/tickets/:id/events`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input:**
  ```json
  {
    "message": "We are investigating the issue.",
    "visibleToCustomer": true,
    "send_email": true
  }
  ```
- **What it expects:** `visibleToCustomer` and `send_email` boolean flags. Message is optional.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Event added successfully",
    "data": { "event": { /* event object */ } }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/tickets/ticket-uuid-here/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"message": "Please restart your router.", "visibleToCustomer": true}'
  ```

### Update Ticket Status
Change the status of an existing ticket.

- **Route:** `PATCH /api/tickets/:id/status`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input:**
  ```json
  {
    "status": "RESOLVED",
    "message": "Fixed the fiber cut." // Optional context message
  }
  ```
- **What it rejects:** Statuses outside of `OPEN`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REOPENED`.
- **Expected Output:**
  ```json
  {
    "success": true,
    "message": "Ticket status updated successfully",
    "data": { "ticket": { /* ticket object */ } }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X PATCH http://localhost:8000/api/tickets/ticket-uuid-here/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"status": "IN_PROGRESS"}'
  ```

### Reassign Ticket
Assign a ticket to a specific support agent.

- **Route:** `POST /api/tickets/:id/reassign`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin/Agent only)
- **Expected Input:**
  ```json
  {
    "employeeId": "uuid-of-agent"
  }
  ```
- **What it rejects:** Missing `employeeId`.
- **Expected Output:** Success message with updated ticket.
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/tickets/ticket-uuid-here/reassign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"employeeId": "agent-uuid-here"}'
  ```

### Rate Ticket
Allow a customer to leave a 1-5 star rating and feedback on a closed/resolved ticket.

- **Route:** `POST /api/tickets/:id/rate`
- **Authentication:** Requires `Authorization: Bearer <token>` (Customer Role only)
- **Expected Input:**
  ```json
  {
    "rating": 5,
    "feedback": "Great service, thank you!"
  }
  ```
- **What it rejects:** Ratings lower than 1 or higher than 5.
- **Expected Output:** Success message confirming the rating submission.
- **cURL Command:**
  ```bash
  curl -X POST http://localhost:8000/api/tickets/ticket-uuid-here/rate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"rating": 5, "feedback": "Fast resolution."}'
  ```

### Update Ticket RCA
Update the Root Cause Analysis (RCA) details for a ticket.

- **Route:** `PATCH /api/tickets/:id/rca`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin/Agent only)
- **Expected Input (Multipart Form-Data for attachments, or JSON):**
  ```json
  {
    "rca": "The fiber cable was cut due to construction.",
    "existingImages": "[\"image_url_1\"]",
    "metadata": { "attachments": ["new_image_url"] } // Handled via form-data upload
  }
  ```
- **What it rejects:** Closed tickets. Also rejects requests with more than 10 total RCA images (combining existing and new images). Each Image should be 5MB and total 50MB it can take.
- **Expected Output:** Success message with the updated ticket.
- **cURL Command:**
  ```bash
  curl -X PATCH http://localhost:8000/api/tickets/ticket-uuid-here/rca \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"rca": "Fiber cut"}'
  ```

### Update Outage Details
Update outage specific details like problem side and external ticket number.

- **Route:** `PATCH /api/tickets/:id/outage`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin/Agent only)
- **Expected Input:**
  ```json
  {
    "problemSide": "Network",
    "externalTicketNo": "EXT-12345"
  }
  ```
- **What it rejects:** Missing `problemSide` (must be at least 1 character).
- **Expected Output:** Success message with the updated ticket.
- **cURL Command:**
  ```bash
  curl -X PATCH http://localhost:8000/api/tickets/ticket-uuid-here/outage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"problemSide": "Customer Premises Equipment"}'
  ```

### Toggle Customer Reply Status
Enable or disable the customer's ability to reply to a ticket.

- **Route:** `PATCH /api/tickets/:id/reply-status`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin/Agent only)
- **Expected Input:**
  ```json
  {
    "allowCustomerReply": true
  }
  ```
- **What it expects:** Valid boolean value for `allowCustomerReply`.
- **Expected Output:** Success message with updated ticket.
- **cURL Command:**
  ```bash
  curl -X PATCH http://localhost:8000/api/tickets/ticket-uuid-here/reply-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"allowCustomerReply": false}'
  ```

### Export Resolved Tickets
Retrieve a list of resolved tickets for reporting/exporting purposes.

- **Route:** `GET /api/tickets/resolved`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin only)
- **Query Parameters (Optional):** `page`, `limit`, `exportAll` (or `export`), `year`, `month`.
- **Expected Output:** Paginated list of resolved tickets.
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/tickets/resolved?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Earliest Ticket Year
Retrieve the year of the oldest ticket in the system, useful for populating date filters.

- **Route:** `GET /api/tickets/earliest-year`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin only)
- **Expected Output:** 
  ```json
  {
    "success": true,
    "data": {
      "year": 2023
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/tickets/earliest-year \
  -H "Authorization: Bearer <access_token>"
  ```



---

## 5. Analytics & Graph Routes

These endpoints provide data for the network analytics graphs, charts, and KPI metric cards. 

### Get Customer Metrics (Customer View)
Retrieve network analytics and graph data for the authenticated customer. This endpoint is used in the **Customer Dashboard (Metric cards)** and the **Drishti Analytics page**.

- **Route:** `GET /api/tickets/customer-metrics`
- **Authentication:** Requires `Authorization: Bearer <token>` (Customer Role `USER` only)
- **Query Parameters (Optional):** 
  - `circuitId`: `ALL`.
  - `totalCircuits`: The total number of connections the customer has (used for metric calculations). Get it from the myconnection store.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "kpiHighlights": {
        "uptimeDelta": { /* uptime KPI object */ },
        "mttrReduction": { /* MTTR KPI object */ },
        "zeroCoreOutage": { /* core outage KPI object */ },
        "repeatFaultReduction": { /* repeat fault KPI object */ }
      },
      "monthlyUptimeTrend": [{ "name": "Jan", "uptime": 99.9 }],
      "totalFaultsByMonth": [{ "name": "Jan", "count": 2 }],
      "repeatFaultComparison": [{ "name": "Jan", "Link Down": 1, "Packet Drops": 0 }],
      "faultCategoryDistribution": [{ "name": "Fiber Cut", "value": 5 }],
      "mttrTrend": [{ "name": "Jan", "mttr": 2.5 }],
      "faultSeverity": [{ "name": "Jan", "Critical": 1, "Medium": 2, "Low": 0 }]
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/tickets/customer-metrics?circuitId=ALL" \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Customer Metrics (Admin View)
Retrieve network analytics and graph data for a specific customer. This endpoint is used by Admins in the **Customer List (Customer Graph Modal)** to view a specific customer's performance.

- **Route:** `GET /api/users/customers/:id/metrics`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin Role only)
- **Query Parameters (Optional):**
  - `circuitId`: Specific circuit ID to filter by, or `ALL`.
  - `totalCircuits`: The total number of connections the customer has.
- **Expected Output:** Identical to the Customer View metrics payload containing `kpiHighlights` and graph arrays.
- **cURL Command:**
  ```bash
  curl -X GET "http://localhost:8000/api/users/customers/customer-row-id-here/metrics?circuitId=ALL" \
  -H "Authorization: Bearer <admin_access_token>"
  ```

---

## 6. System & Dashboard Routes

Base path: `/api`

### Get All Active Issue Categories
Retrieve a list of all active issue categories available in the system for ticket creation and reporting.

- **Route:** `GET /api/categories`
- **Authentication:** Public or general authenticated.
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "1",
        "code": "NET-001",
        "name": "Network Outage"
      }
    ]
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/categories
  ```

### Get Unassigned Issue Categories
Retrieve a list of active issue categories that have not yet been assigned to any support agent. Used in the Admin staff management view.

- **Route:** `GET /api/categories/unassigned`
- **Authentication:** Requires `Authorization: Bearer <token>`
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "2",
        "code": "HW-002",
        "name": "Hardware Failure"
      }
    ]
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/categories/unassigned \
  -H "Authorization: Bearer <access_token>"
  ```

### Get Admin & Sales Ticket Stats
Retrieve high-level overview statistics for tickets. The data payload changes depending on whether the requesting user is an Admin or Sales representative. Used in the Admin and Sales Dashboards.

- **Route:** `GET /api/tickets/stats`
- **Authentication:** Requires `Authorization: Bearer <token>` (Admin or Sales Role)
- **Expected Input:** None.
- **Expected Output (Admin):**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "summary": {
          "total_tickets": "150",
          "active_tickets": "20",
          "escalated_tickets": "2",
          "resolved_today": "5",
          "tickets_last_24h": "10",
          "tickets_previous_24h": "8",
          "active_agents": "3",
          "total_agents": "5"
        },
        "categories": [{ "name": "Fiber Cut", "count": 50 }],
        "volumeMix": [{ "name": "Fiber Cut", "count": 50 }],
        "agents": [{
          "employee_id": 1,
          "name": "Agent Smith",
          "role": "SUPPORT_AGENT",
          "total_assigned": 15,
          "active_assigned": 4
        }]
      }
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/tickets/stats \
  -H "Authorization: Bearer <admin_access_token>"
  ```

### Get Agent Dashboard Stats
Retrieve performance metrics and recent assigned tickets for a specific support agent. Used in the Support Agent Dashboard.

- **Route:** `GET /api/tickets/agent-stats`
- **Authentication:** Requires `Authorization: Bearer <token>` (Support Agent Role)
- **Expected Input:** None.
- **Expected Output:**
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "summary": {
          "total_assigned": "45",
          "active_tickets": "4",
          "total_resolved": "40",
          "resolved_today": "2"
        },
        "recentTickets": [
          {
            "id": "uuid",
            "ticket_no": "TCK-123",
            "subject": "Slow Internet",
            "status": "OPEN",
            "created_at": "2023-10-15T10:00:00Z",
            "customer_name": "Acme Corp"
          }
        ]
      }
    }
  }
  ```
- **cURL Command:**
  ```bash
  curl -X GET http://localhost:8000/api/tickets/agent-stats \
  -H "Authorization: Bearer <agent_access_token>"
  ```
