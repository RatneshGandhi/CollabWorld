import jwt from 'jsonwebtoken';

/**
 * Verifies a JWT token against the server secret
 * @param {string} token - Raw JWT token string
 * @returns {Object} Decoded token payload (e.g. { id, email, iat, exp })
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};