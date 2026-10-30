const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function fixGallery() {
  try {
    console.log('🔧 Creating gallery_albums table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery_albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        description TEXT,
        caption TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ gallery_albums & gallery_photos created/verified successfully.');
  } catch (err) {
    console.error('❌ Gallery tables error:', err);
  } finally {
    await pool.end();
  }
}

fixGallery();
