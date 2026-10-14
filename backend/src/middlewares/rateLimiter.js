import rateLimit from 'express-rate-limit';

/**
 * Standard structured JSON response for rate limit violations
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    retryAfter: res.getHeader('Retry-After') || '15 minutes',
  });
};

/**
 * Strict Rate Limiter for Authentication Endpoints (Login / Register)
 * Max 10 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* legacy headers
  handler: rateLimitHandler(
    'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  ),
  skipSuccessfulRequests: false,
});

/**
 * General API Rate Limiter
 * Max 300 requests per 15-minute window per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many requests sent to the CollabSpace API. Please slow down.'
  ),
});