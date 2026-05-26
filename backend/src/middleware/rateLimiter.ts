import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limits requests to 100 per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Prea multe cereri. Te rugăm să încerci din nou mai târziu.',
  },
});

/**
 * Auth rate limiter (stricter)
 * Limits login/register attempts to 5 per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Prea multe încercări de autentificare. Te rugăm să încerci din nou mai târziu.',
  },
});

/**
 * Quote creation rate limiter
 * Limits quote creation to 10 per hour per IP
 */
export const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Prea multe citate create. Te rugăm să încerci din nou mai târziu.',
  },
});
