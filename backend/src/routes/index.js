import { Router } from 'express';
import authRoutes from './authRoutes.js';
import docRoutes from './docRoutes.js';

const router = Router();

// Health/Ping route
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API v1 is operational',
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/documents', docRoutes);

export default router;