import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { verifyToken } from '../utils/verifyToken.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and follows "Bearer <token>" format
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Reject if token is missing
  if (!token) {
    throw new AppError('Authentication required. Please log in to access this resource.', 401);
  }

  // 3. Verify token signature and expiration
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid authentication token. Please log in again.', 401);
  }

  // 4. Verify user still exists in database
  const [currentUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, decoded.id))
    .limit(1);

  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  // 5. Grant access: attach user object to request
  req.user = currentUser;
  next();
});