import helmet from 'helmet';
import { generalLimiter } from './rateLimiter';

/**
 * Apply security middleware to an Express app
 * Includes helmet for HTTP headers and general rate limiting
 */
export const applySecurityMiddleware = (app: import('express').Application): void => {
  // Helmet for secure HTTP headers
  // Disable contentSecurityPolicy and crossOriginEmbedderPolicy to allow file uploads
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // General rate limiting
  app.use(generalLimiter);
};

