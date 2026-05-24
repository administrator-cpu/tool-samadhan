import dotenv from 'dotenv';
import { vi } from 'vitest';

// Load env vars, but override them for testing
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.PORT = '4001'; // Use a different port so we don't clash with dev server
process.env.POSTGRES_DB = process.env.POSTGRES_TEST_DB || 'samadhan_test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Globally mock PostgreSQL to NEVER connect to a real database in tests
vi.mock('pg', () => {
  const mClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  return {
    Pool: class {
      connect = vi.fn().mockResolvedValue(mClient);
      query = vi.fn();
      on = vi.fn();
      end = vi.fn();
    }
  };
});

// Disable logger output during tests to keep console clean
vi.mock('../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  }
}));

// We can also mock EmailJS service to prevent sending emails during tests
vi.mock('../src/services/email.service.js', () => ({
  sendTicketConfirmationEmail: vi.fn(),
  sendTicketCreatedHelpdeskEmail: vi.fn(),
  sendImmediateAgentAssignmentEmails: vi.fn(),
  sendTicketUpdateEmail: vi.fn(),
  sendTicketStatusUpdateEmail: vi.fn(),
  sendTicketRcaEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock Socket service
vi.mock('../src/services/socket.service.js', () => ({
  initSocket: vi.fn(),
  getIo: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn()
  }))
}));

// Mock BullMQ to prevent real Redis connections in tests
vi.mock('bullmq', () => {
  return {
    Queue: class {
      add = vi.fn();
      close = vi.fn();
      on = vi.fn();
    },
    Worker: class {
      on = vi.fn();
      close = vi.fn();
    },
    QueueEvents: class {
      on = vi.fn();
      close = vi.fn();
    }
  };
});
