import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { healthRouter } from './routes/health.js';
import { profileRouter } from './routes/profile.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { stopsRouter } from './routes/stops.js';
import { optimizationRouter } from './routes/optimization.js';
import { simulatorRouter } from './routes/simulator.js';
import { aiRouter } from './routes/ai.js';
import { trackingRouter } from './routes/tracking.js';
import { dashboardRouter } from './routes/dashboard.js';
import { demoRouter } from './routes/demo.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow local asset and iframe rendering
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS allowlisting
  app.use(
    cors({
      origin: [config.frontendOrigin, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request size limit & JSON parser
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Global Rate Limiting
  app.use(standardRateLimiter);

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api', profileRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/vehicles', vehiclesRouter);
  app.use('/api/stops', stopsRouter);
  app.use('/api', optimizationRouter);
  app.use('/api/scenarios', simulatorRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/tracking', trackingRouter);
  app.use('/api/demo', demoRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
