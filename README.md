# Samadhan - Customer Support System

Samadhan acts as a bridge between technical infrastructure and human connection. It provides a platform for users to report issues instantly and receive support with complete transparency and accountability.

## Project Overview

Samadhan streamlines the support workflow by automating issue routing and tracking. It ensures that every ticket meets strict Service Level Agreements (SLAs) and provides real-time visibility into the resolution process for both customers and support staff.

## Key Features

- **Rapid Reporting**: Users can report an issue in under 30 seconds.
- **Automated Routing**: The system automatically assigns tickets to the most relevant expert.
- **Real-Time Tracking**: Customers monitor live timeline updates on their dashboard.
- **SLA Management**: Strict monitoring against resolution targets with automatic escalation.
- **Role-Based Access**: Specialized dashboards for Customers, Support Agents, and Admins.
- **Secure Authentication**: Robust session management using JWT and secure password hashing.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Animations**: Motion
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Argon2 password hashing, Cookie-based session management

## Project Structure

This project uses a monorepo structure managed by **Turborepo**:

- `apps/frontend`: The Next.js web application.
- `apps/backend`: The Express.js API server.
- `package.json`: Root configuration and workspace management.
- `turbo.json`: Pipeline configuration for build and dev tasks.

## Getting Started

### Prerequisites
- Node.js (>= 18)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tool-samadhan
   ```

2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in `apps/backend` based on the provided configuration.
   - Ensure the database connection string and JWT secrets are set.
   - Create a `.env` file in `apps/frontend` based on the provided configuration.
   

### Running the Project

Run both the frontend and backend simultaneously using the root development script:

```bash
npm run dev
```

The frontend will start at `http://localhost:3000` and the backend at `http://localhost:4000`.
