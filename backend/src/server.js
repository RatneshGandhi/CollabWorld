import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { pool } from './db/index.js';
import apiRouter from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound } from './middlewares/notFoundMiddleware.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { initSocketServer } from './sockets/index.js';

dotenv.config();

const app = express();

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// 2. Strict CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Payload Body Hardening (Prevent memory exhaustion attacks)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Base Health Check (exempt from rate limiter for cloud load balancers)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CollabSpace API server is operational and secure',
    timestamp: new Date().toISOString(),
  });
});

// 5. Apply Global API Rate Limiting to all /api/v1 endpoints
app.use('/api/v1', apiLimiter);

// 6. Mount Primary API Router
app.use('/api/v1', apiRouter);

// 7. 404 Catch-All Handler
app.use(notFound);

// 8. Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create Native HTTP Server for both Express & Socket.IO
const httpServer = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initSocketServer(httpServer);

async function startServer() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`[Database] PostgreSQL connected successfully. DB Time: ${result.rows[0].now}`);

    httpServer.listen(PORT, () => {
      console.log(`[Server] CollabSpace API & WebSockets running on http://localhost:${PORT}`);
      console.log(`[Security] Helmet headers & Rate limiting active`);
    });
  } catch (error) {
    console.error('[Database] Failed to connect to PostgreSQL:', error.message || error);
    process.exit(1);
  }
}

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Closing HTTP server gracefully...');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    pool.end(() => {
      console.log('[Database] PostgreSQL pool drained.');
      process.exit(0);
    });
  });
});

startServer();