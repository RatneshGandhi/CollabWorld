import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { pool } from './db/index.js';

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Query database time to verify connectivity
    const result = await pool.query('SELECT NOW()');

    console.log(
      `[Database] PostgreSQL connected successfully. DB Time: ${result.rows[0].now}`,
    );

    app.listen(PORT, () => {
      console.log(
        `[Server] CollabSpace API is running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error(
      '[Database] Failed to connect to PostgreSQL:',
      error.message,
    );

    process.exit(1);
  }
}

startServer();