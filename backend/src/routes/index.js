import { Router } from 'express';

const router = Router();

// Base route to verify API v1 routing
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API v1 is operational',
  });
});

export default router;