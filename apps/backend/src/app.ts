import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { env, isProd } from './config/environment.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticket.routes.js';

const app = express();

// Middleware
const corsOptions = {
  origin: env.cors.origin ? env.cors.origin.split(',').map(s => s.trim()) : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Request logger for debugging in development
if (!isProd) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ statusCode: 200, message: 'OK' });
});

// API Routes
import { TicketController } from './controllers/ticket.controller.js';
app.use('/api', authRoutes);
app.get('/api/categories', TicketController.getCategories);
app.get('/api/categories/unassigned', TicketController.getUnassignedCategories);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
