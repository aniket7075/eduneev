import { Pool } from 'pg';

const isSupabase = process.env.DATABASE_URL?.includes('supabase.com');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isSupabase) ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err);
  // Do not exit process in serverless environments
});

