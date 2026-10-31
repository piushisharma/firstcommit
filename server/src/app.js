import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));

  // Global rate limiting
  app.use('/api/', globalRateLimit);

  // Routes
  app.use('/api/v1', routes);

  // Health check (outside versioned routes for convenience)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
