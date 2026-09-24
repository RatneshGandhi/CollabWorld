import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Protected routes
router.get('/me', protect, getMe);

export default router;