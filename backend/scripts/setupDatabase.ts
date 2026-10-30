import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database setup...');
    
    // Create 'parents' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        alternative_mobile VARCHAR(20),
        address TEXT,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ parents table created or already exists.');

    // Create 'students' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        grade VARCHAR(100) NOT NULL,
        age INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ students table created or already exists.');

    // Create 'attendance' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        marked_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
    `);
    console.log('✅ attendance table created or already exists.');

    // Create 'fee_structures' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fee_type VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        grade VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ fee_structures table created or already exists.');

    // Create 'student_fees' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_fees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
        amount_due NUMERIC(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, fee_structure_id)
      );
    `);
    console.log('✅ student_fees table created or already exists.');

    // Create 'payments' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES parents(id),
        amount_paid NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ payments table created or already exists.');

    // Create 'homework' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS homework (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grade VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        due_date VARCHAR(100) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ homework table created or already exists.');

    // Create 'notices' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        audience VARCHAR(50) DEFAULT 'all',
        date VARCHAR(100) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ notices table created or already exists.');

    // Create 'chat_rooms' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID REFERENCES users(id),
        parent_id UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, parent_id)
      );
    `);
    console.log('✅ chat_rooms table created or already exists.');

    // Create 'chat_messages' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ chat_messages table created or already exists.');

    // Create 'leave_applications' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ leave_applications table created or already exists.');

    // Create 'timetables' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grade VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(50) NOT NULL,
        period_number INTEGER NOT NULL,
        subject VARCHAR(255) NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ timetables table created or already exists.');

    // Create 'gallery_albums' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ gallery_albums table created or already exists.');

    // Create 'gallery_photos' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ gallery_photos table created or already exists.');

    // Create 'exams' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        term VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        grade VARCHAR(100) NOT NULL,
        year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ exams table created or already exists.');

    // Create 'exam_marks' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_marks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        subject VARCHAR(100) NOT NULL,
        marks_obtained NUMERIC(5, 2) NOT NULL,
        max_marks NUMERIC(5, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exam_id, student_id, subject)
      );
    `);
    console.log('✅ exam_marks table created or already exists.');

    // Create 'lesson_plans' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grade VARCHAR(100) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        chapter_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Planned',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ lesson_plans table created or already exists.');

    // Create 'library_books' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS library_books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(50),
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ library_books table created or already exists.');

    // Create 'book_issues' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS book_issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id UUID REFERENCES library_books(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        status VARCHAR(50) DEFAULT 'issued',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ book_issues table created or already exists.');

    // Create 'certificates' table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ certificates table created or already exists.');

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
