const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkLibCert() {
  try {
    const resBooks = await pool.query(`
      SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'library_books'
    `);
    console.log('library_books columns:', resBooks.rows);

    const resCert = await pool.query(`
      SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'certificates'
    `);
    console.log('certificates columns:', resCert.rows);
  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await pool.end();
  }
}

checkLibCert();
