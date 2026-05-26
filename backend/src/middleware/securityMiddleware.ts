import helmet from 'helmet';
import { generalLimiter } from './rateLimiter';

/**
 * Apply security middleware to an Express app
 * Includes helmet for HTTP headers and general rate limiting
 */
export const applySecurityMiddleware = (app: import('express').Application): void => {
  // Helmet for secure HTTP headers
  app.use(helmet());

  // General rate limiting
  app.use(generalLimiter);
};
