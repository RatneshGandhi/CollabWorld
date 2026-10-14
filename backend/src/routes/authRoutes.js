import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// Public routes protected with strict anti-brute-force rate limiting
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);

// Protected routes
router.get('/me', protect, getMe);

export default router;