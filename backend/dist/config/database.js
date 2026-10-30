"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
let connStr = process.env.DATABASE_URL || '';
// In serverless environments like Vercel, Supabase connection pooler MUST use port 6543 (Transaction Mode)
// Port 5432 is Session Mode which has a strict limit of 15 connections total and throws EMAXCONNSESSION
if (connStr.includes('pooler.supabase.com:5432')) {
    connStr = connStr.replace(':5432', ':6543');
}
const isSupabase = connStr.includes('supabase.com');
exports.pool = new pg_1.Pool({
    connectionString: connStr,
    ssl: (process.env.NODE_ENV === 'production' || isSupabase) ? { rejectUnauthorized: false } : undefined,
    max: 2, // Minimal connections per serverless instance to prevent pool exhaustion
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
});
exports.pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL Database');
});
exports.pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
});
