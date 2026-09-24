import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUser.length > 0) {
    throw new AppError('A user with this email address already exists', 400);
  }

  // 2. Hash the password securely
  const hashedPassword = await hashPassword(password);

  // 3. Insert user into PostgreSQL
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    });

  // 4. Generate JWT token
  const token = generateToken({ id: newUser.id, email: newUser.email });

  // 5. Send success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: newUser,
    },
  });
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    // Security tip: Use generic message so attackers can't enumerate valid emails
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Generate JWT token
  const token = generateToken({ id: user.id, email: user.email });

  // 4. Send response (exclude password)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
});

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user was populated by protect middleware
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});