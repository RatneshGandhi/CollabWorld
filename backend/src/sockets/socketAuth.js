import { verifyToken } from '../utils/verifyToken.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Socket.IO Handshake Authentication Middleware
 * Validates JWT token passed in socket.handshake.auth or authorization headers.
 * Attaches the authenticated user object to the socket instance.
 */
export const socketAuth = async (socket, next) => {
  try {
    // 1. Extract token from auth payload or headers
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!rawToken) {
      console.warn('[Socket Auth] Connection rejected: No token provided');
      return next(new Error('Authentication token required for WebSocket connection'));
    }

    // 2. Strip 'Bearer ' prefix if present
    const token = rawToken.replace(/^Bearer\s+/i, '').trim();

    // 3. Verify JWT signature & expiration
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      console.warn('[Socket Auth] Connection rejected: Malformed token');
      return next(new Error('Invalid authentication token'));
    }

    // 4. Verify user exists in PostgreSQL
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      console.warn(`[Socket Auth] Connection rejected: User ${decoded.id} not found`);
      return next(new Error('User account not found'));
    }

    // 5. Attach user details to socket for downstream handlers
    socket.user = user;
    console.log(`[Socket Auth] Authenticated user: ${user.name} (${user.email}) [socket: ${socket.id}]`);
    next();
  } catch (err) {
    console.error('[Socket Auth] Verification error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return next(new Error('Authentication token has expired. Please re-login.'));
    }
    return next(new Error('Authentication failed'));
  }
};