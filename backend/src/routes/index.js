import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

// Health/Ping route
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API v1 is operational',
  });
});

// Mount Authentication routes
router.use('/auth', authRoutes);

export default router;