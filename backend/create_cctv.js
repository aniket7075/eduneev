require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS cctv_cameras (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      stream_url VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    
    // Insert some mock data for preview
    await pool.query(`
      INSERT INTO cctv_cameras (name, location, stream_url, status)
      VALUES 
      ('Main Gate Cam', 'Entrance', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'active'),
      ('Playground Cam', 'Play Area', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'active'),
      ('Cafeteria Cam', 'Dining Hall', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'offline');
    `);
    
    console.log('CCTV cameras table created and seeded.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

createTable();
