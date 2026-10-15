import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

import * as schema from './schema.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const requiresSSL = process.env.DATABASE_URL?.includes('sslmode=require') || isProduction;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, {
  schema,
});

export { db, pool };