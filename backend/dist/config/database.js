"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const isSupabase = (_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.includes('supabase.com');
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.NODE_ENV === 'production' || isSupabase) ? { rejectUnauthorized: false } : undefined,
});
exports.pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL Database');
});
exports.pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client:', err);
    // Do not exit process in serverless environments
});
