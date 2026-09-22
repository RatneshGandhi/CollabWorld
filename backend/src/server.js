import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { pool } from './db/index.js';
import apiRouter from './routes/index.js';
import { notFound } from './middlewares/notFoundMiddleware.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();

// Security & Parsing Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

// Base Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// 404 Catch-All Handler (must be after all valid routes)
app.use(notFound);

// Central Error Handler (must be the very last middleware with 4 arguments)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`[Database] PostgreSQL connected successfully. DB Time: ${result.rows[0].now}`);

    app.listen(PORT, () => {
      console.log(`[Server] CollabSpace API is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Database] Failed to connect to PostgreSQL:', error.message || error);
    process.exit(1);
  }
}

startServer();