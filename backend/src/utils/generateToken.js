import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token
 * @param {Object} payload - User identification payload (e.g., { id, email })
 * @returns {string} Signed JWT token string
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};