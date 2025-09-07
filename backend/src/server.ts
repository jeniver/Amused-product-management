import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { productsRouter } from './routes/products';
import { eventsRouter, registerEventBroadcaster } from './sse/events';
import { aiRouter } from './routes/ai';
import { initSchema } from './db';
import { config, isDevelopment } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export async function startServer() {
  const app = express();

  // Security middleware
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan(isDevelopment ? 'dev' : 'combined'));

  // API routes
  app.use('/products', productsRouter);
  app.use('/events', eventsRouter);
  app.use('/ai', aiRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Initialize database and event broadcaster
  await initSchema();
  await registerEventBroadcaster();

  return new Promise<void>((resolve) => {
    // Create server with proper error handling
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 AMused API v2.0.0 listening on port ${config.PORT}`);
      logger.info(`🛍️  Products API: http://localhost:${config.PORT}/products`);
      logger.info(`📡 Events API: http://localhost:${config.PORT}/events`);
      resolve();
    });

    // Configure SSE-specific settings
    server.setTimeout(0);
    server.keepAliveTimeout = 0;
    server.headersTimeout = 0;

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Closing HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Closing HTTP server...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    });
  });
}